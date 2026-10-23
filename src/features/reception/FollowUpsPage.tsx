import { useMemo, useState } from 'react';
import { addDays, isSameDay, startOfDay } from 'date-fns';
import { CalendarClock, MessageCircle, Printer, Search } from 'lucide-react';
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
import { TablePagination, usePagination } from '../../components/ui/Pagination';

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
  const [printingId, setPrintingId] = useState<string | null>(null);
  const today = startOfDay(new Date());
  const rows = useMemo(() => state.followUps.filter((item) => {
    const patient = state.patients.find((person) => person.id === item.patientId);
    const when = new Date(`${item.date}T00:00:00`);
    return (!query || `${patient?.fullName ?? ''} ${patient?.id ?? ''} ${item.doctor}`.toLowerCase().includes(query.toLowerCase()))
      && (department === 'all' || item.department === department)
      && (status === 'all' || item.status === status)
      && (dueWindow === 'all' || (dueWindow === 'overdue' && (when < today || item.status === 'Overdue')) || (dueWindow === 'today' && isSameDay(when, today)) || (dueWindow === '7days' && when >= today && when <= addDays(today, 7)));
  }).sort((a, b) => a.date.localeCompare(b.date)), [department, dueWindow, query, state.followUps, state.patients, status, today]);
  const { page, setPage, pageSize, setPageSize, pagedItems, total } = usePagination(rows, 6);
  const inDepartment = state.followUps.filter((item) => department === 'all' || item.department === department);
  const dueToday = inDepartment.filter((item) => isSameDay(new Date(`${item.date}T00:00:00`), today) && item.status === 'Upcoming').length;
  const overdue = inDepartment.filter((item) => item.status === 'Overdue').length;
  const upcoming = inDepartment.filter((item) => item.status === 'Upcoming').length;
  const printedFollowUp = state.followUps.find((item) => item.id === printingId);
  const printedPatient = state.patients.find((item) => item.id === printedFollowUp?.patientId);
  const reminder = (id: string, timing: '2days' | 'scheduled' | 'manual') => {
    try {
      repository.updateFollowUp(id, { reminderStatus: 'Queued' });
      toast.push(timing === 'manual' ? 'Demo reminder queued — no message was sent.' : `Demo reminder queued for ${timing === '2days' ? 'two days before the follow-up' : 'the scheduled date'} — no message was sent.`, 'info');
    } catch (error) { toast.push(error instanceof Error ? error.message : 'Could not queue reminder.', 'error'); }
  };
  const update = (id: string, next: 'Completed' | 'Rescheduled' | 'Cancelled') => {
    if (next === 'Rescheduled') {
      const entry = state.followUps.find((item) => item.id === id);
      setRescheduleDate(entry?.date ?? ''); setRescheduling(id); return;
    }
    if (next === 'Cancelled' && !window.confirm('Cancel this follow-up in demo data?')) return;
    try { repository.updateFollowUp(id, { status: next }); toast.push(`Follow-up marked ${next.toLowerCase()}.`); }
    catch (error) { toast.push(error instanceof Error ? error.message : 'Could not update follow-up.', 'error'); }
  };
  const saveReschedule = () => {
    if (!rescheduling || !rescheduleDate) { toast.push('Choose the updated follow-up date.', 'error'); return; }
    try { repository.updateFollowUp(rescheduling, { date: rescheduleDate, status: 'Rescheduled' }); toast.push('Follow-up date updated and marked rescheduled.'); setRescheduling(null); }
    catch (error) { toast.push(error instanceof Error ? error.message : 'Could not reschedule follow-up.', 'error'); }
  };
  const printFollowUp = (id: string) => {
    setPrintingId(id);
    window.setTimeout(() => { document.body.classList.add('print-follow-up'); window.print(); document.body.classList.remove('print-follow-up'); }, 100);
  };
  return <>
    <PageHeading eyebrow={`${forcedDepartment ? departmentLabel(forcedDepartment) : 'Reception'} · Continuity of care`} title="Follow-ups" description={forcedDepartment ? "Keep upcoming reviews visible and queue reminder actions as clear demo-only interactions." : "Keep upcoming patient reviews visible and track care continuity."} />
    <div className="stats-grid"><StatCard label="Upcoming" value={upcoming} hint="Open scheduled reviews" icon={<CalendarClock size={16} />} /><StatCard label="Due today" value={dueToday} hint="Follow-ups on today's date" icon={<CalendarClock size={16} />} /><StatCard label="Overdue" value={overdue} hint="Needs rescheduling or completion" icon={<MessageCircle size={16} />} />{forcedDepartment ? <StatCard label="Mock reminder status" value={inDepartment.filter((item) => item.reminderStatus === 'Queued').length} hint="No real message has been sent" icon={<MessageCircle size={16} />} /> : <StatCard label="Completed" value={inDepartment.filter((item) => item.status === 'Completed').length} hint="Resolved reviews" icon={<CalendarClock size={16} />} />}</div>
    <Card padded={false}><div style={{ padding: '18px 20px 0' }}><SectionHeading title="Follow-up register" subtitle={forcedDepartment ? "Two-day, scheduled-date and manual reminder buttons only update demo state." : "Manage and update upcoming patient follow-up appointments."} /></div><div className="toolbar" style={{ padding: '0 20px' }}><div className="search-field"><Search size={15} /><input aria-label="Search follow-ups" placeholder="Patient or doctor" value={query} onChange={(event) => setQuery(event.target.value)} /></div><select className="select-field" aria-label="Filter follow-ups by department" value={department} disabled={Boolean(forcedDepartment)} onChange={(event) => setDepartmentFilter(event.target.value as Department | 'all')}><option value="all">All departments</option><option value="skin">Skin</option><option value="orthopaedics">Orthopaedics</option></select><select className="select-field" aria-label="Filter follow-ups by due date" value={dueWindow} onChange={(event) => setDueWindow(event.target.value)}><option value="all">All due dates</option><option value="today">Today</option><option value="7days">Next 7 days</option><option value="overdue">Overdue</option></select><select className="select-field" aria-label="Filter follow-ups by status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{['Upcoming', 'Completed', 'Overdue', 'Rescheduled', 'Cancelled'].map((item) => <option key={item}>{item}</option>)}</select><span className="result-count">{rows.length} records</span></div>
      {rows.length ? <><div className="table-wrap responsive-cards"><table className="data-table"><thead><tr><th className="serial-col">S.No</th><th>Patient</th><th>Department / Doctor</th><th>Follow-up date</th><th>Status</th>{forcedDepartment && <th>Reminder</th>}<th>Actions</th></tr></thead><tbody>{pagedItems.map((item, index) => { const patient = state.patients.find((person) => person.id === item.patientId); const serialNo = (page - 1) * pageSize + index + 1; return <tr key={item.id}><td className="serial-cell">{serialNo}</td><td><div className="patient-cell"><PatientAvatar name={patient?.fullName ?? 'Patient'} small /><div><strong>{patient?.fullName ?? 'Patient'}</strong><span>{patient?.id ?? item.patientId}</span></div></div></td><td>{departmentLabel(item.department)}<span className="table-subtext">{item.doctor}</span></td><td>{dateLabel(`${item.date}T00:00:00`)}</td><td><Badge tone={statusTone(item.status)}>{item.status}</Badge></td>{forcedDepartment && <td><Badge tone={statusTone(item.reminderStatus)}>{item.reminderStatus}</Badge></td>}<td><FollowUpActions id={item.id} status={item.status} isReception={!forcedDepartment} onReminder={reminder} onUpdate={update} onPrint={() => printFollowUp(item.id)} /></td></tr>; })}</tbody></table></div>
        <div className="patient-card-list followup-card-list">{pagedItems.map((item, index) => { const patient = state.patients.find((person) => person.id === item.patientId); const serialNo = (page - 1) * pageSize + index + 1; return <article className="patient-card" key={item.id}><div className="patient-card-head"><div className="patient-card-name"><span className="serial-cell" style={{ marginRight: 6 }}>#{serialNo}</span><PatientAvatar name={patient?.fullName ?? 'Patient'} /><div><strong>{patient?.fullName ?? 'Patient'}</strong><span>{departmentLabel(item.department)} · {item.doctor}</span></div></div><Badge tone={statusTone(item.status)}>{item.status}</Badge></div><div className="patient-card-meta"><div><small>Follow-up date</small><strong>{dateLabel(`${item.date}T00:00:00`)}</strong></div>{forcedDepartment ? <div><small>Reminder</small><strong>{item.reminderStatus}</strong></div> : <div><small>Patient ID</small><strong>{patient?.id ?? item.patientId}</strong></div>}</div><FollowUpActions id={item.id} status={item.status} isReception={!forcedDepartment} onReminder={reminder} onUpdate={update} onPrint={() => printFollowUp(item.id)} /></article>; })}</div>
        <TablePagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />
      </> : <EmptyState title="No follow-ups match" message="Adjust the department, due-date or status filter to see records." icon={<CalendarClock size={18} />} />}
    </Card>
    <Modal open={Boolean(rescheduling)} title="Reschedule follow-up" subtitle="Choose a new date. The demo record is updated; no reminder is sent." onClose={() => setRescheduling(null)} footer={<><Button variant="secondary" onClick={() => setRescheduling(null)}>Cancel</Button><Button onClick={saveReschedule}>Save new date</Button></>}><Field id="reschedule-followup-date" label="New follow-up date" type="date" value={rescheduleDate} onChange={(event) => setRescheduleDate(event.target.value)} /></Modal>
    {printedFollowUp && <section className="follow-up-print-sheet" aria-label="Printable follow-up sheet"><div className="print-brand"><strong>TRICHY ORTHO & SKIN</strong><span>{departmentLabel(printedFollowUp.department)} · HEALTH FOUNDATION</span></div><h1>Follow-up sheet</h1><p>Patient: {printedPatient?.fullName ?? 'Patient'} · {printedPatient?.id ?? printedFollowUp.patientId}</p><div className="print-block"><h2>Follow-up date</h2><p>{dateLabel(`${printedFollowUp.date}T00:00:00`)}</p></div><div className="print-block"><h2>Clinician</h2><p>{printedFollowUp.doctor}</p></div><div className="print-block"><h2>Instructions</h2><p>{printedFollowUp.note || 'Please contact the clinic if you need to change your appointment.'}</p></div><div className="print-block"><h2>Status</h2><p>{printedFollowUp.status} · Reminder state: {printedFollowUp.reminderStatus}</p></div><div className="print-signature">TRICHY ORTHO & SKIN · HEALTH FOUNDATION<span>Demo document · No reminder was sent by printing this sheet.</span></div></section>}
  </>;
}

function FollowUpActions({ id, status, onReminder, onUpdate, onPrint, isReception }: { id: string; status: string; onReminder: (id: string, timing: '2days' | 'scheduled' | 'manual') => void; onUpdate: (id: string, status: 'Completed' | 'Rescheduled' | 'Cancelled') => void; onPrint: () => void; isReception?: boolean }) {
  const open = !['Completed', 'Cancelled'].includes(status);

  if (isReception) {
    if (!open) return <span className="table-subtext">—</span>;
    return (
      <div className="followup-actions">
        <Button variant="ghost" size="small" onClick={() => onUpdate(id, 'Completed')}>Complete</Button>
        <Button variant="ghost" size="small" onClick={() => onUpdate(id, 'Rescheduled')}>Reschedule</Button>
        <Button variant="ghost" size="small" onClick={() => onUpdate(id, 'Cancelled')}>Cancel</Button>
      </div>
    );
  }

  return <div className="followup-actions"><Button variant="ghost" size="small" onClick={onPrint} icon={<Printer size={13} />}>Print sheet</Button>{open && <><Button variant="secondary" size="small" onClick={() => onReminder(id, '2days')}>2-day reminder</Button><Button variant="ghost" size="small" onClick={() => onReminder(id, 'scheduled')}>Scheduled date</Button><Button variant="ghost" size="small" onClick={() => onReminder(id, 'manual')} icon={<MessageCircle size={13} />}>WhatsApp demo</Button><Button variant="ghost" size="small" onClick={() => onUpdate(id, 'Completed')}>Complete</Button><Button variant="ghost" size="small" onClick={() => onUpdate(id, 'Rescheduled')}>Reschedule</Button><Button variant="ghost" size="small" onClick={() => onUpdate(id, 'Cancelled')}>Cancel</Button></>}</div>;
}
