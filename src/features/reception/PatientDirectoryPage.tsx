import { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FileText, Search, UserRound, Wallet } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type { Patient } from '../../types/domain';
import { useHospitalData } from '../../services/mock/DemoProvider';
import { dateLabel, departmentLabel, money, patientInvoiceTotals } from '../../utils/format';
import { useToast } from '../../components/ui/Toast';
import { PageHeading, PatientAvatar } from '../../components/shared/Primitives';
import { Badge, statusTone } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { TabPanel, Tabs } from '../../components/ui/Tabs';

const PAGE_SIZE = 6;
type ProfileTab = 'Overview' | 'Appointments' | 'Visit history' | 'Invoices and payments' | 'Follow-ups';

export function PatientDirectoryPage() {
  const { state } = useHospitalData();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [department, setDepartment] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  useEffect(() => { setQuery(params.get('q') ?? ''); }, [params]);
  const matches = useMemo(() => state.patients.filter((patient) => {
    const text = `${patient.fullName} ${patient.id} ${patient.phone} ${patient.email ?? ''}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (department === 'all' || patient.departments.includes(department as 'skin' | 'orthopaedics'));
  }).sort((a, b) => a.fullName.localeCompare(b.fullName)), [department, query, state.patients]);
  const pages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const visible = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const setSearch = (value: string) => { setPage(1); setQuery(value); setParams(value ? { q: value } : {}); };
  return <>
    <PageHeading eyebrow="Reception · Records" title="All patients" description="Fictional demo records with visit history, appointments, invoices and follow-ups." actions={<Badge tone="info">{state.patients.length} demo records</Badge>} />
    <Card padded={false}><div style={{ padding: '18px 20px 0' }}><div className="toolbar"><div className="search-field"><Search size={15} /><input aria-label="Search patients" placeholder="Name, patient ID, phone or email" value={query} onChange={(event) => setSearch(event.target.value)} /></div><select aria-label="Filter patients by department" className="select-field" value={department} onChange={(event) => { setDepartment(event.target.value); setPage(1); }}><option value="all">All departments</option><option value="skin">Skin</option><option value="orthopaedics">Orthopaedics</option></select><span className="result-count">{matches.length} records</span></div></div>
      {matches.length ? <><div className="table-wrap responsive-cards"><table className="data-table"><thead><tr><th>Patient</th><th>Phone</th><th>Departments</th><th>Latest visit</th><th>Registered</th><th /></tr></thead><tbody>{visible.map((patient) => <tr key={patient.id}><td><button className="patient-link" type="button" onClick={() => setSelectedPatient(patient)}><span className="patient-cell"><PatientAvatar name={patient.fullName} small /><span><strong>{patient.fullName}</strong><span>{patient.id}</span></span></span></button></td><td>{patient.phone}</td><td><div className="department-tags">{patient.departments.map((dept) => <Badge key={dept} tone="info">{dept === 'skin' ? 'Skin' : 'Orthopaedics'}</Badge>)}</div></td><td>{patient.latestVisitAt ? dateLabel(patient.latestVisitAt) : 'No visit yet'}</td><td>{dateLabel(patient.registeredAt)}</td><td><Button variant="ghost" size="small" onClick={() => setSelectedPatient(patient)}>View profile</Button></td></tr>)}</tbody></table></div>
        <div className="patient-card-list directory-card-list">{visible.map((patient) => <article className="patient-card" key={patient.id}><div className="patient-card-head"><div className="patient-card-name"><PatientAvatar name={patient.fullName} /><div><strong>{patient.fullName}</strong><span>{patient.id}</span></div></div><Button variant="ghost" size="small" onClick={() => setSelectedPatient(patient)}>Details</Button></div><div className="patient-card-meta"><div><small>Phone</small><strong>{patient.phone}</strong></div><div><small>Latest visit</small><strong>{patient.latestVisitAt ? dateLabel(patient.latestVisitAt) : 'No visit yet'}</strong></div></div><div className="department-tags" style={{ marginTop: 12 }}>{patient.departments.map((dept) => <Badge key={dept} tone="info">{dept === 'skin' ? 'Skin' : 'Orthopaedics'}</Badge>)}</div></article>)}</div>
        <div className="table-footer" style={{ padding: '14px 20px 18px' }}><span>Showing {matches.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, matches.length)} of {matches.length}</span><div className="button-row"><Button variant="secondary" size="small" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</Button><span>Page {page} of {pages}</span><Button variant="secondary" size="small" disabled={page >= pages} onClick={() => setPage((current) => Math.min(pages, current + 1))}>Next</Button></div></div>
      </> : <EmptyState title="No patients found" message="Try another search term or choose a different department." icon={<UserRound size={18} />} />}
    </Card>
    <ProfileModal patient={selectedPatient} onClose={() => setSelectedPatient(null)} />
  </>;
}

function ProfileModal({ patient, onClose }: { patient: Patient | null; onClose: () => void }) {
  const { state } = useHospitalData();
  const toast = useToast();
  const [tab, setTab] = useState<ProfileTab>('Overview');
  useEffect(() => { if (patient) setTab('Overview'); }, [patient?.id]);
  if (!patient) return null;
  const appointments = state.appointments.filter((item) => item.patientId === patient.id).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  const visits = state.consultations.filter((item) => item.patientId === patient.id).sort((a, b) => b.visitedAt.localeCompare(a.visitedAt));
  const invoices = state.invoices.filter((item) => item.patientId === patient.id);
  const followups = state.followUps.filter((item) => item.patientId === patient.id);
  const tabs: ProfileTab[] = ['Overview', 'Appointments', 'Visit history', 'Invoices and payments', 'Follow-ups'];
  return <Modal open title={patient.fullName} subtitle={`${patient.id} · Registered ${dateLabel(patient.registeredAt)}`} onClose={onClose} wide>
    <div className="profile-intro"><PatientAvatar name={patient.fullName} /><div><strong>{patient.fullName}</strong><span>{patient.gender} · {patient.dateOfBirth ? `${new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} years` : 'Age not recorded'} · {patient.phone}</span><div className="department-tags">{patient.departments.map((dept) => <Badge key={dept} tone="info">{departmentLabel(dept)}</Badge>)}</div></div></div>
    <Tabs idPrefix="profile" ariaLabel="Patient profile sections" items={tabs.map((label) => ({ id: label, label }))} selected={tab} onChange={setTab} />
    <TabPanel idPrefix="profile" selected={tab} className="profile-tab-panel">
      {tab === 'Overview' && <div className="profile-grid"><div className="profile-info"><span>Patient ID</span><strong>{patient.id}</strong></div><div className="profile-info"><span>Phone</span><strong>{patient.phone}</strong></div><div className="profile-info"><span>Email</span><strong>{patient.email || 'Not provided'}</strong></div><div className="profile-info"><span>Address</span><strong>{patient.address}</strong></div><div className="profile-info"><span>Emergency contact</span><strong>{patient.emergencyContact || 'Not provided'}</strong></div><div className="profile-info"><span>Latest visit</span><strong>{patient.latestVisitAt ? formatDistanceToNow(new Date(patient.latestVisitAt), { addSuffix: true }) : 'No visits yet'}</strong></div></div>}
      {tab === 'Appointments' && <HistoryList items={appointments.map((item) => ({ title: dateLabel(item.startsAt, 'd MMM yyyy · h:mm a'), detail: `${departmentLabel(item.department)} · ${item.visitType} · ${item.doctor}`, status: item.status }))} empty="No appointments recorded for this patient." />}
      {tab === 'Visit history' && <HistoryList items={visits.map((item) => ({ title: `${departmentLabel(item.department)} consultation`, detail: `${dateLabel(item.visitedAt)} · ${item.diagnosis || 'Diagnosis not entered'}${item.assessment ? ` · ${item.assessment}` : ''}`, status: item.status }))} empty="No consultation notes in the demo record." />}
      {tab === 'Invoices and payments' && (invoices.length ? invoices.map((invoice) => { const totals = patientInvoiceTotals(invoice); return <div className="list-row" key={invoice.id}><div className="list-row-main"><strong>{invoice.id} · {money(totals.total)}</strong><span>{invoice.visitLabel} · {dateLabel(invoice.date)}</span></div><div className="profile-payment"><Badge tone={statusTone(totals.status)}>{totals.status}</Badge><small>{money(totals.balance)} balance</small></div></div>; }) : <EmptyState title="No invoices" message="Billing records will appear here after a visit is created." icon={<Wallet size={18} />} />)}
      {tab === 'Follow-ups' && <HistoryList items={followups.map((item) => ({ title: dateLabel(item.date), detail: `${departmentLabel(item.department)} · ${item.doctor} · Reminder ${item.reminderStatus}`, status: item.status }))} empty="No follow-ups recorded." />}
    </TabPanel>
    <div className="profile-modal-actions"><Button variant="secondary" size="small" onClick={() => { navigator.clipboard?.writeText(patient.id).then(() => toast.push('Patient ID copied.')).catch(() => toast.push(patient.id, 'info')); }}>Copy patient ID</Button><Button variant="primary" size="small" onClick={() => window.print()} icon={<FileText size={14} />}>Print profile</Button></div>
  </Modal>;
}

function HistoryList({ items, empty }: { items: { title: string; detail: string; status: string }[]; empty: string }) {
  return items.length ? <div className="profile-history">{items.map((item, index) => <div className="list-row" key={`${item.title}-${index}`}><div className="list-row-main"><strong>{item.title}</strong><span>{item.detail}</span></div><Badge tone={statusTone(item.status)}>{item.status}</Badge></div>)}</div> : <EmptyState title="Nothing to show yet" message={empty} icon={<FileText size={18} />} />;
}
