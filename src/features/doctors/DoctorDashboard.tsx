import { isSameDay, startOfDay, addDays } from 'date-fns';
import { Activity, ArrowRight, CalendarDays, CheckCheck, Clock3, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Department } from '../../types/domain';
import { useHospitalData } from '../../services/mock/DemoProvider';
import { timeLabel } from '../../utils/format';
import { Badge, statusTone } from '../../components/ui/Badge';
import { Card, SectionHeading, StatCard } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageHeading, PatientCell } from '../../components/shared/Primitives';

export function DoctorDashboard({ department }: { department: Department }) {
  const { state } = useHospitalData();
  const navigate = useNavigate();
  const today = startOfDay(new Date());
  const appointments = state.appointments.filter((item) => item.department === department && isSameDay(new Date(item.startsAt), today));
  const queue = state.queue.filter((item) => item.department === department);
  const waiting = queue.filter((item) => item.status === 'Waiting').length;
  const consulting = queue.filter((item) => item.status === 'Consulting').length;
  const completed = queue.filter((item) => item.status === 'Completed').length;
  const due = state.followUps.filter((item) => item.department === department && item.status === 'Upcoming' && new Date(`${item.date}T00:00:00`) <= addDays(today, 2)).length;
  const deptTitle = department === 'skin' ? 'Skin & Dermatology' : 'Orthopaedics';
  const doctorName = department === 'skin' ? 'Dr. Nisha Kulkarni' : 'Dr. Raghav Menon';
  const rows = [...appointments].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const cards = [
    { label: "Today's appointments", value: appointments.length, hint: 'Booked for today', icon: <CalendarDays size={16} /> },
    { label: 'Waiting patients', value: waiting, hint: 'Ready for your review', icon: <Clock3 size={16} /> },
    { label: 'In consultation', value: consulting, hint: 'Currently with a clinician', icon: <Activity size={16} /> },
    { label: 'Completed visits', value: completed, hint: 'Marked complete in demo', icon: <CheckCheck size={16} /> },
  ];
  return <>
    <PageHeading eyebrow={`${deptTitle} · Clinical workspace`} title={`Good morning, ${doctorName.split(' ')[1]}`} description="Your appointments and patient work, in one place." actions={<Button onClick={() => navigate(`/${department === 'skin' ? 'skin' : 'ortho'}/consultation`)} icon={<Users size={15} />}>Open consultation</Button>} />
    <div className="stats-grid">{cards.map((item) => <StatCard key={item.label} {...item} />)}<StatCard label="Follow-ups due" value={due} hint="Due today or in two days" icon={<Users size={16} />} /></div>
    <div className="content-grid">
      <Card padded={false}><div style={{ padding: '19px 20px 0' }}><SectionHeading title="Today's appointments" subtitle="Your department schedule" action={<Button variant="ghost" size="small" onClick={() => navigate(`/${department === 'skin' ? 'skin' : 'ortho'}/appointments`)} icon={<ArrowRight size={14} />}>Full schedule</Button>} /></div>{rows.length ? <div className="table-wrap responsive-cards"><table className="data-table"><thead><tr><th>Patient</th><th>Time</th><th>Visit</th><th>Status</th><th /></tr></thead><tbody>{rows.map((item) => { const patient = state.patients.find((person) => person.id === item.patientId); return <tr key={item.id}><td><PatientCell name={patient?.fullName ?? 'Patient'} id={patient?.id ?? item.patientId} /></td><td><span className="appointment-time">{timeLabel(item.startsAt)}</span></td><td>{item.visitType}</td><td><Badge tone={statusTone(item.status)}>{item.status}</Badge></td><td><Button variant="ghost" size="small" onClick={() => navigate(`/${department === 'skin' ? 'skin' : 'ortho'}/consultation/${item.patientId}`)}>Open</Button></td></tr>; })}</tbody></table></div> : <div className="empty-state"><h3>No appointments scheduled</h3><p>New visits added by reception will appear here.</p></div>}</Card>
      <Card><SectionHeading title="Waiting room" subtitle={`${waiting} waiting · ${consulting} in progress`} />{queue.filter((item) => item.status !== 'Completed').slice(0, 5).map((entry) => { const patient = state.patients.find((person) => person.id === entry.patientId); return <div className="list-row" key={entry.id}><div className="list-row-main"><strong>{entry.token} · {patient?.fullName ?? 'Patient'}</strong><span>{entry.visitType} · arrived {timeLabel(entry.arrivalAt)}</span></div><Button variant="ghost" size="small" onClick={() => navigate(`/${department === 'skin' ? 'skin' : 'ortho'}/consultation/${entry.patientId}`)}>Review</Button></div>; })}</Card>
    </div>
    <Card><SectionHeading title="Follow-up reminders" subtitle="The front desk can queue a mock reminder; no message is sent." action={<Button variant="ghost" size="small" onClick={() => navigate(`/${department === 'skin' ? 'skin' : 'ortho'}/follow-ups`)}>View follow-ups</Button>} />{state.followUps.filter((item) => item.department === department).slice(0, 3).map((item) => { const patient = state.patients.find((person) => person.id === item.patientId); return <div className="list-row" key={item.id}><div className="list-row-main"><strong>{patient?.fullName ?? 'Patient'}</strong><span>{item.date} · {item.doctor}</span></div><Badge tone={statusTone(item.status)}>{item.status}</Badge></div>; })}</Card>
  </>;
}
