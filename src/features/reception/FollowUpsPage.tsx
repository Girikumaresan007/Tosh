import { useMemo, useState } from 'react';
import { addDays, isSameDay, startOfDay } from 'date-fns';
import { AlertCircle, Calendar, CalendarClock, CheckCircle2, MessageSquare, Search, XCircle } from 'lucide-react';
import type { Department } from '../../types/domain';
import { useHospitalData } from '../../services/mock/DemoProvider';
import { useToast } from '../../components/ui/Toast';
import { dateLabel, departmentLabel } from '../../utils/format';
import { PageHeading, PatientAvatar } from '../../components/shared/Primitives';
import { Badge, statusTone } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, SectionHeading, StatCard } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Field } from '../../components/ui/Field';

export function FollowUpsPage({ department: forcedDepartment }: { department?: Department } = {}) {
  const { state, repository } = useHospitalData();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<Department | 'all'>(forcedDepartment ?? 'all');
  const department = forcedDepartment ?? departmentFilter;
  const [status, setStatus] = useState('all');
  const [dueWindow, setDueWindow] = useState('all');
  const [rescheduling, setRescheduling] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const today = startOfDay(new Date());

  const rows = useMemo(() => state.followUps.filter((item) => {
    const patient = state.patients.find((person) => person.id === item.patientId);
    const when = new Date(`${item.date}T00:00:00`);
    return (!query || `${patient?.fullName ?? ''} ${patient?.id ?? ''} ${item.doctor}`.toLowerCase().includes(query.toLowerCase()))
      && (department === 'all' || item.department === department)
      && (status === 'all' || item.status === status)
      && (dueWindow === 'all' || (dueWindow === 'overdue' && (when < today || item.status === 'Overdue')) || (dueWindow === 'today' && isSameDay(when, today)) || (dueWindow === '7days' && when >= today && when <= addDays(today, 7)));
  }).sort((a, b) => a.date.localeCompare(b.date)), [department, dueWindow, query, state.followUps, state.patients, status, today]);

  const inDepartment = state.followUps.filter((item) => department === 'all' || item.department === department);
  const dueToday = inDepartment.filter((item) => isSameDay(new Date(`${item.date}T00:00:00`), today) && item.status === 'Upcoming').length;
  const overdue = inDepartment.filter((item) => item.status === 'Overdue').length;
  const upcoming = inDepartment.filter((item) => item.status === 'Upcoming').length;

  const reminder = (id: string) => {
    try {
      repository.updateFollowUp(id, { reminderStatus: 'Queued' });
      toast.push('WhatsApp reminder queued for patient.');
    } catch (error) {
      toast.push(error instanceof Error ? error.message : 'Could not queue reminder.', 'error');
    }
  };

  const update = (id: string, next: 'Completed' | 'Rescheduled' | 'Cancelled') => {
    if (next === 'Rescheduled') {
      const entry = state.followUps.find((item) => item.id === id);
      setRescheduleDate(entry?.date ?? '');
      setRescheduling(id);
      return;
    }
    if (next === 'Cancelled' && !window.confirm('Cancel this scheduled follow-up?')) return;
    try {
      repository.updateFollowUp(id, { status: next });
      toast.push(`Follow-up marked ${next.toLowerCase()}.`);
    } catch (error) {
      toast.push(error instanceof Error ? error.message : 'Could not update follow-up.', 'error');
    }
  };

  const saveReschedule = () => {
    if (!rescheduling || !rescheduleDate) {
      toast.push('Choose the updated follow-up date.', 'error');
      return;
    }
    try {
      repository.updateFollowUp(rescheduling, { date: rescheduleDate, status: 'Rescheduled' });
      toast.push('Follow-up date updated and marked rescheduled.');
      setRescheduling(null);
    } catch (error) {
      toast.push(error instanceof Error ? error.message : 'Could not reschedule follow-up.', 'error');
    }
  };

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, currentPage]);

  return <>
    <PageHeading
      eyebrow={`${forcedDepartment ? departmentLabel(forcedDepartment) : 'Reception'} · Continuity of care`}
      title="Follow-ups"
      description="Track upcoming clinical reviews, send WhatsApp reminders, and update patient appointment schedules."
    />
    <div className="stats-grid">
      <StatCard label="Upcoming" value={upcoming} hint="Scheduled reviews" icon={<CalendarClock size={16} />} />
      <StatCard label="Due today" value={dueToday} hint="Follow-ups today" icon={<Calendar size={16} />} />
      <StatCard label="Overdue" value={overdue} hint="Requires rescheduling" icon={<AlertCircle size={16} />} />
      <StatCard label="Reminders Sent" value={inDepartment.filter((item) => item.reminderStatus === 'Queued').length} hint="Active notification queue" icon={<MessageSquare size={16} />} />
    </div>
    <Card padded={false}>
      <div style={{ padding: '18px 20px 0' }}>
        <SectionHeading title="Follow-up register" subtitle="Manage scheduled reviews with instant WhatsApp reminders, rescheduling, and status tracking." />
      </div>
      <div className="toolbar" style={{ padding: '0 20px' }}>
        <div className="search-field">
          <Search size={15} />
          <input aria-label="Search follow-ups" placeholder="Patient or doctor" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} />
        </div>
        <select className="select-field" aria-label="Filter follow-ups by department" value={department} disabled={Boolean(forcedDepartment)} onChange={(event) => { setDepartmentFilter(event.target.value as Department | 'all'); setPage(1); }}>
          <option value="all">All departments</option>
          <option value="skin">Skin</option>
          <option value="orthopaedics">Orthopaedics</option>
        </select>
        <select className="select-field" aria-label="Filter follow-ups by due date" value={dueWindow} onChange={(event) => { setDueWindow(event.target.value); setPage(1); }}>
          <option value="all">All due dates</option>
          <option value="today">Today</option>
          <option value="7days">Next 7 days</option>
          <option value="overdue">Overdue</option>
        </select>
        <select className="select-field" aria-label="Filter follow-ups by status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
          <option value="all">All statuses</option>
          {['Upcoming', 'Completed', 'Overdue', 'Rescheduled', 'Cancelled'].map((item) => <option key={item}>{item}</option>)}
        </select>
        <span className="result-count">{rows.length} records</span>
      </div>
      {paginatedRows.length ? (
        <>
          <div className="table-wrap responsive-cards">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 55, textAlign: 'center' }}>S.No</th>
                  <th style={{ minWidth: 170 }}>Patient</th>
                  <th style={{ minWidth: 170 }}>Department / Doctor</th>
                  <th style={{ minWidth: 130 }}>Follow-up date</th>
                  <th style={{ width: 100, textAlign: 'center' }}>Status</th>
                  <th style={{ width: 100, textAlign: 'center' }}>Reminder</th>
                  <th style={{ minWidth: 380, textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((item, index) => {
                  const sno = (currentPage - 1) * PAGE_SIZE + index + 1;
                  const patient = state.patients.find((person) => person.id === item.patientId);
                  return (
                    <tr key={item.id}>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--muted)' }}>{sno}</td>
                      <td>
                        <div className="patient-cell">
                          <PatientAvatar name={patient?.fullName ?? 'Patient'} small />
                          <div>
                            <strong>{patient?.fullName ?? 'Patient'}</strong>
                            <span>{patient?.id ?? item.patientId}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--navy)' }}>{departmentLabel(item.department)}</strong>
                        <span className="table-subtext">{item.doctor}</span>
                      </td>
                      <td style={{ fontWeight: 500, color: 'var(--ink)' }}>{dateLabel(`${item.date}T00:00:00`)}</td>
                      <td style={{ textAlign: 'center' }}><Badge tone={statusTone(item.status)}>{item.status}</Badge></td>
                      <td style={{ textAlign: 'center' }}><Badge tone={statusTone(item.reminderStatus)}>{item.reminderStatus}</Badge></td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <FollowUpActions
                          id={item.id}
                          status={item.status}
                          onReminder={reminder}
                          onUpdate={update}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="patient-card-list followup-card-list">
            {paginatedRows.map((item) => {
              const patient = state.patients.find((person) => person.id === item.patientId);
              return (
                <article className="patient-card" key={item.id}>
                  <div className="patient-card-head">
                    <div className="patient-card-name">
                      <PatientAvatar name={patient?.fullName ?? 'Patient'} />
                      <div>
                        <strong>{patient?.fullName ?? 'Patient'}</strong>
                        <span>{departmentLabel(item.department)} · {item.doctor}</span>
                      </div>
                    </div>
                    <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                  </div>
                  <div className="patient-card-meta">
                    <div>
                      <small>Follow-up date</small>
                      <strong>{dateLabel(`${item.date}T00:00:00`)}</strong>
                    </div>
                    <div>
                      <small>Reminder</small>
                      <strong>{item.reminderStatus}</strong>
                    </div>
                  </div>
                  <FollowUpActions
                    id={item.id}
                    status={item.status}
                    onReminder={reminder}
                    onUpdate={update}
                  />
                </article>
              );
            })}
          </div>
          <div className="table-footer" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)' }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, rows.length)} of {rows.length} records
            </span>
            <div className="button-row">
              <Button variant="secondary" size="small" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Previous
              </Button>
              <span style={{ fontSize: 13, fontWeight: 600, padding: '0 8px' }}>
                Page {currentPage} of {totalPages}
              </span>
              <Button variant="secondary" size="small" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                Next
              </Button>
            </div>
          </div>
        </>
      ) : (
        <EmptyState title="No follow-ups match" message="Adjust the department, due-date or status filter to see records." icon={<CalendarClock size={18} />} />
      )}
    </Card>
    <Modal
      open={Boolean(rescheduling)}
      title="Reschedule follow-up"
      subtitle="Select a new follow-up appointment date for the patient."
      onClose={() => setRescheduling(null)}
      footer={
        <>
          <Button variant="secondary" onClick={() => setRescheduling(null)}>Cancel</Button>
          <Button onClick={saveReschedule}>Save new date</Button>
        </>
      }
    >
      <Field id="reschedule-followup-date" label="New follow-up date" type="date" value={rescheduleDate} onChange={(event) => setRescheduleDate(event.target.value)} />
    </Modal>
  </>;
}

function FollowUpActions({
  id,
  status,
  onReminder,
  onUpdate,
}: {
  id: string;
  status: string;
  onReminder: (id: string) => void;
  onUpdate: (id: string, status: 'Completed' | 'Rescheduled' | 'Cancelled') => void;
}) {
  const open = !['Completed', 'Cancelled'].includes(status);
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
      {open ? (
        <>
          <Button
            variant="secondary"
            size="small"
            onClick={() => onReminder(id)}
            icon={<MessageSquare size={13} style={{ color: '#15803D' }} />}
            title="Send WhatsApp reminder"
            style={{ background: '#F0FDF4', borderColor: '#BBF7D0', color: '#15803D' }}
          >
            WhatsApp
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={() => onUpdate(id, 'Completed')}
            icon={<CheckCircle2 size={13} style={{ color: '#16A34A' }} />}
          >
            Complete
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={() => onUpdate(id, 'Rescheduled')}
            icon={<Calendar size={13} style={{ color: 'var(--teal)' }} />}
          >
            Reschedule
          </Button>
          <Button
            variant="ghost"
            size="small"
            onClick={() => onUpdate(id, 'Cancelled')}
            icon={<XCircle size={13} style={{ color: '#DC2626' }} />}
            style={{ color: '#DC2626' }}
          >
            Cancel
          </Button>
        </>
      ) : (
        <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
          {status}
        </span>
      )}
    </div>
  );
}

