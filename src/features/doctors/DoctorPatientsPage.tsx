import { useMemo, useState } from 'react';
import { Search, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Department } from '../../types/domain';
import { useHospitalData } from '../../services/mock/DemoProvider';
import { dateLabel, getAge } from '../../utils/format';
import { PageHeading, PatientAvatar, PatientCell } from '../../components/shared/Primitives';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, SectionHeading } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';

export function DoctorPatientsPage({ department }: { department: Department }) {
  const { state } = useHospitalData();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const role = department === 'skin' ? 'skin' : 'ortho';
  const patients = useMemo(() => state.patients.filter((patient) => patient.departments.includes(department) && `${patient.fullName} ${patient.id} ${patient.phone}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => a.fullName.localeCompare(b.fullName)), [department, query, state.patients]);
  return <>
    <PageHeading eyebrow={`${department === 'skin' ? 'Skin & Dermatology' : 'Orthopaedics'} · Records`} title="Patients" description="Open authorized fictional history and continue into a consultation workspace." actions={<Badge tone="info">{patients.length} records</Badge>} />
    <Card padded={false}><div style={{ padding: '18px 20px 0' }}><SectionHeading title="Department patients" subtitle="Patient records created at Reception appear here automatically." /></div><div className="toolbar" style={{ padding: '0 20px' }}><div className="search-field"><Search size={15} /><input aria-label="Search doctor patient list" placeholder="Search by patient name, ID, or phone" value={query} onChange={(event) => setQuery(event.target.value)} /></div><span className="result-count">{patients.length} patients</span></div>
      {patients.length ? <><div className="table-wrap responsive-cards"><table className="data-table"><thead><tr><th>Patient</th><th>Age / gender</th><th>Phone</th><th>Latest visit</th><th>Clinical status</th><th /></tr></thead><tbody>{patients.map((patient) => { const visit = state.consultations.find((item) => item.patientId === patient.id && item.department === department); return <tr key={patient.id}><td><PatientCell name={patient.fullName} id={patient.id} /></td><td>{getAge(patient.dateOfBirth) ?? '—'} · {patient.gender}</td><td>{patient.phone}</td><td>{patient.latestVisitAt ? dateLabel(patient.latestVisitAt) : 'No visit yet'}</td><td><Badge tone={visit?.status === 'Finalized' ? 'success' : 'neutral'}>{visit?.status ?? 'No consultation'}</Badge></td><td><Button variant="secondary" size="small" onClick={() => navigate(`/${role}/consultation/${patient.id}`)}>Open consultation</Button></td></tr>; })}</tbody></table></div><div className="patient-card-list doctor-patient-cards">{patients.map((patient) => { const visit = state.consultations.find((item) => item.patientId === patient.id && item.department === department); return <article className="patient-card" key={patient.id}><div className="patient-card-head"><div className="patient-card-name"><PatientAvatar name={patient.fullName} /><div><strong>{patient.fullName}</strong><span>{patient.id} · {getAge(patient.dateOfBirth) ?? '—'} years · {patient.gender}</span></div></div><Badge tone={visit?.status === 'Finalized' ? 'success' : 'neutral'}>{visit?.status ?? 'No consultation'}</Badge></div><div className="patient-card-meta"><div><small>Phone</small><strong>{patient.phone}</strong></div><div><small>Latest visit</small><strong>{patient.latestVisitAt ? dateLabel(patient.latestVisitAt) : 'No visit yet'}</strong></div></div><Button variant="secondary" size="small" className="btn-full" style={{ marginTop: 12 }} onClick={() => navigate(`/${role}/consultation/${patient.id}`)}>Open consultation</Button></article>; })}</div></> : <EmptyState title="No patients in this department" message="New records added by Reception will become visible in the shared demo data." icon={<UserRound size={18} />} />}
    </Card>
  </>;
}
