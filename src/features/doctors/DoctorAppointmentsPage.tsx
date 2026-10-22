import { useMemo, useState } from 'react';
import { format, isSameDay, startOfDay } from 'date-fns';
import { CalendarDays, Search, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Department } from '../../types/domain';
import { useHospitalData } from '../../services/mock/DemoProvider';
import { useToast } from '../../components/ui/Toast';
import { dateLabel, timeLabel } from '../../utils/format';
import { PageHeading, PatientAvatar, PatientCell } from '../../components/shared/Primitives';
import { Badge, statusTone } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, SectionHeading } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';

export function DoctorAppointmentsPage({ department }: { department: Department }) {
  const { state, repository } = useHospitalData();
  const toast = useToast();
  const navigate = useNavigate();
  const role = department === 'skin' ? 'skin' : 'ortho';
  const title = department === 'skin' ? 'Skin appointments' : 'Orthopaedic appointments';
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showAllDates, setShowAllDates] = useState(false);
  const rows = useMemo(() => state.appointments.filter((item) => {
    const patient = state.patients.find((person) => person.id === item.patientId);
    return item.department === department && (!query || `${patient?.fullName ?? ''} ${patient?.id ?? ''} ${patient?.phone ?? ''}`.toLowerCase().includes(query.toLowerCase()))
      && (status === 'all' || item.status === status)
      && (showAllDates || isSameDay(new Date(item.startsAt), startOfDay(new Date(`${date}T00:00:00`))));
  }).sort((a, b) => a.startsAt.localeCompare(b.startsAt)), [date, department, query, showAllDates, state.appointments, state.patients, status]);
  const updateStatus = (id: string, next: 'In progress' | 'Completed') => {
    try { repository.updateAppointment(id, { status: next }); toast.push(next === 'In progress' ? 'Consultation started; queue state updated.' : 'Visit completed in shared demo data.'); }
    catch (error) { toast.push(error instanceof Error ? error.message : 'Could not update appointment.', 'error'); }
  };
  return <>
    <PageHeading eyebrow={`${department === 'skin' ? 'Skin & Dermatology' : 'Orthopaedics'} · Schedule`} title={title} description="Reception appointment and check-in changes appear in this shared demo schedule." />
    <Card padded={false}><div style={{ padding: '18px 20px 0' }}><SectionHeading title="Department schedule" subtitle="Choose a date or view all dates in the demo record." /></div><div className="toolbar" style={{ padding: '0 20px' }}><div className="search-field"><Search size={15} /><input aria-label="Search department appointments" placeholder="Patient name, ID, or phone" value={query} onChange={(event) => setQuery(event.target.value)} /></div><label className="date-control"><CalendarDays size={14} /><span className="sr-only">Appointment date</span><input aria-label="Appointment date" type="date" value={date} onChange={(event) => { setDate(event.target.value); setShowAllDates(false); }} /></label><select className="select-field" aria-label="Filter appointments by status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{['Scheduled', 'Checked-in', 'In progress', 'Completed', 'Cancelled', 'No-show'].map((item) => <option key={item}>{item}</option>)}</select><Button variant={showAllDates ? 'primary' : 'secondary'} size="small" onClick={() => setShowAllDates((value) => !value)}>{showAllDates ? 'All dates' : 'Today only'}</Button><span className="result-count">{rows.length} visits</span></div>
      {rows.length ? <><div className="table-wrap responsive-cards"><table className="data-table"><thead><tr><th>Patient</th><th>Time</th><th>Visit / note</th><th>Status</th><th>Action</th></tr></thead><tbody>{rows.map((item) => { const patient = state.patients.find((person) => person.id === item.patientId); return <tr key={item.id}><td><PatientCell name={patient?.fullName ?? 'Patient'} id={patient?.id ?? item.patientId} /></td><td><span className="appointment-time">{timeLabel(item.startsAt)}</span><span className="table-subtext">{dateLabel(item.startsAt)}</span></td><td>{item.visitType}<span className="table-subtext">{item.note || 'No scheduling note'}</span></td><td><Badge tone={statusTone(item.status)}>{item.status}</Badge></td><td><div className="appointment-actions">{!['Completed', 'Cancelled', 'No-show'].includes(item.status) && <Button variant="secondary" size="small" onClick={() => updateStatus(item.id, 'In progress')} icon={<Stethoscope size={13} />}>Start</Button>}<Button variant="ghost" size="small" onClick={() => navigate(`/${role}/consultation/${item.patientId}`)}>Open</Button>{item.status !== 'Completed' && !['Cancelled', 'No-show'].includes(item.status) && <Button variant="ghost" size="small" onClick={() => updateStatus(item.id, 'Completed')}>Complete</Button>}</div></td></tr>; })}</tbody></table></div><div className="patient-card-list doctor-appointment-cards">{rows.map((item) => { const patient = state.patients.find((person) => person.id === item.patientId); return <article className="patient-card" key={item.id}><div className="patient-card-head"><div className="patient-card-name"><PatientAvatar name={patient?.fullName ?? 'Patient'} /><div><strong>{patient?.fullName ?? 'Patient'}</strong><span>{patient?.id} · {timeLabel(item.startsAt)}</span></div></div><Badge tone={statusTone(item.status)}>{item.status}</Badge></div><div className="patient-card-meta"><div><small>Visit type</small><strong>{item.visitType}</strong></div><div><small>Note</small><strong>{item.note || 'No note'}</strong></div></div><div className="appointment-actions" style={{ marginTop: 12 }}>{!['Completed', 'Cancelled', 'No-show'].includes(item.status) && <Button variant="secondary" size="small" onClick={() => updateStatus(item.id, 'In progress')}>Start</Button>}<Button variant="ghost" size="small" onClick={() => navigate(`/${role}/consultation/${item.patientId}`)}>Open</Button>{item.status !== 'Completed' && !['Cancelled', 'No-show'].includes(item.status) && <Button variant="ghost" size="small" onClick={() => updateStatus(item.id, 'Completed')}>Complete</Button>}</div></article>; })}</div></> : <EmptyState title="No appointments found" message="Choose a different date or check that Reception has scheduled a visit for this department." icon={<CalendarDays size={18} />} />}
    </Card>
  </>;
}
