import { useMemo, useState } from 'react';
import { addDays, isSameDay, startOfDay } from 'date-fns';
import { ArrowRight, Check, Clock3, Plus, Search, UserRoundPlus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { patientSchema } from '../../schemas/forms';
import type { Department, Gender, VisitType, Vitals } from '../../types/domain';
import { useHospitalData } from '../../services/mock/DemoProvider';
import { useToast } from '../../components/ui/Toast';
import { PageHeading, PatientAvatar } from '../../components/shared/Primitives';
import { Badge, statusTone } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, SectionHeading } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Field, TextAreaField } from '../../components/ui/Field';

const doctors: Record<Department, string[]> = { skin: ['Dr. Nisha Kulkarni'], orthopaedics: ['Dr. Raghav Menon'] };
const defaults = { fullName: '', dateOfBirth: '', gender: 'Prefer not to say' as Gender, phone: '', email: '', address: '', emergencyContact: '' };
const blankVitals = (): Vitals => ({ bloodPressure: '', pulse: '', temperature: '', height: '', weight: '', oxygenSaturation: '' });
const vitalFields: { key: keyof Vitals; label: string; placeholder: string }[] = [
  { key: 'bloodPressure', label: 'Blood pressure', placeholder: 'e.g. 118/76' },
  { key: 'pulse', label: 'Pulse', placeholder: 'e.g. 72 bpm' },
  { key: 'temperature', label: 'Temperature', placeholder: 'e.g. 36.8 °C' },
  { key: 'height', label: 'Height', placeholder: 'e.g. 168 cm' },
  { key: 'weight', label: 'Weight', placeholder: 'e.g. 64 kg' },
  { key: 'oxygenSaturation', label: 'Oxygen saturation', placeholder: 'e.g. 98%' },
];

export function QueuePage() {
  const { state, repository } = useHospitalData();
  const toast = useToast();
  const navigate = useNavigate();
  const [flow, setFlow] = useState<'existing' | 'new' | null>(null);
  const [search, setSearch] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [department, setDepartment] = useState<Department>('skin');
  const [doctor, setDoctor] = useState(doctors.skin[0]);
  const [visitType, setVisitType] = useState<VisitType>('Follow-up');
  const [note, setNote] = useState('');
  const [vitals, setVitals] = useState<Vitals>(blankVitals);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({ resolver: zodResolver(patientSchema), defaultValues: defaults });
  const possiblePatients = useMemo(() => state.patients.filter((patient) => `${patient.fullName} ${patient.id} ${patient.phone}`.toLowerCase().includes(patientSearch.toLowerCase())), [state.patients, patientSearch]);
  const filtered = useMemo(() => state.queue.filter((item) => {
    const patient = state.patients.find((person) => person.id === item.patientId);
    const matchesQuery = !search || `${patient?.fullName ?? ''} ${patient?.id ?? ''} ${patient?.phone ?? ''} ${item.token}`.toLowerCase().includes(search.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || item.department === departmentFilter;
    const matchesDoctor = doctorFilter === 'all' || item.doctor === doctorFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesDate = dateFilter === 'all' || isSameDay(new Date(item.arrivalAt), startOfDay(addDays(new Date(), dateFilter === 'tomorrow' ? 1 : 0)));
    return matchesQuery && matchesDepartment && matchesDoctor && matchesStatus && matchesDate;
  }), [dateFilter, departmentFilter, doctorFilter, search, state.patients, state.queue, statusFilter]);
  const allDoctors = [...new Set(state.queue.map((item) => item.doctor))];
  const changeDepartment = (value: Department) => { setDepartment(value); setDoctor(doctors[value][0]); };

  const addExisting = () => {
    if (!selectedPatient) { toast.push('Choose an existing patient before adding to the queue.', 'error'); return; }
    try {
      repository.addQueueEntry({ patientId: selectedPatient, department, doctor, visitType, note, vitals });
      toast.push('Patient added to the shared demo queue.');
      setFlow(null); setSelectedPatient(''); setPatientSearch(''); setNote(''); setVitals(blankVitals());
    } catch (error) { toast.push(error instanceof Error ? error.message : 'Could not add patient.', 'error'); }
  };
  const addNew = handleSubmit((values) => {
    try {
      const id = repository.addPatientAndQueue({ ...values, email: values.email || undefined, department, doctor, visitType, note, vitals });
      toast.push(`Demo patient ${id} registered and added to the queue.`);
      reset(defaults); setFlow(null); setNote(''); setVitals(blankVitals());
    } catch (error) { toast.push(error instanceof Error ? error.message : 'Could not register patient.', 'error'); }
  });
  const setStatus = (id: string, status: 'Waiting' | 'Consulting' | 'Completed') => {
    try { repository.updateQueueEntry(id, status); toast.push(`Queue status updated to ${status.toLowerCase()}.`); }
    catch (error) { toast.push(error instanceof Error ? error.message : 'Could not update queue.', 'error'); }
  };

  return <>
    <PageHeading eyebrow="Reception · Patient flow" title="Manage the queue" description="Check in an existing patient or register a new visitor, then keep the care team in sync." actions={<Button variant="secondary" onClick={() => navigate('/reception/appointments')} icon={<Users size={15} />}>Appointments</Button>} />
    <div className="queue-actions"><button className={`queue-action${flow === 'existing' ? ' selected' : ''}`} onClick={() => setFlow(flow === 'existing' ? null : 'existing')} type="button"><span className="queue-action-icon"><Search size={18} /></span><span><strong>Existing patient</strong><small>Search by ID, name, or phone</small></span><ArrowRight size={16} /></button><button className={`queue-action${flow === 'new' ? ' selected' : ''}`} onClick={() => setFlow(flow === 'new' ? null : 'new')} type="button"><span className="queue-action-icon"><UserRoundPlus size={18} /></span><span><strong>New patient</strong><small>Register and add a queue entry</small></span><Plus size={17} /></button></div>
    {flow && <Card className="queue-flow"><SectionHeading title={flow === 'existing' ? 'Add an existing patient' : 'Register a new patient'} subtitle={flow === 'existing' ? 'The selected patient will be added to the shared department queue.' : 'Patient ID is generated only for this frontend demonstration.'} action={<button className="icon-button" aria-label="Close patient flow" type="button" onClick={() => setFlow(null)}>×</button>} />
      {flow === 'existing' ? <div className="form-grid">
        <div className="field span-2"><label htmlFor="patient-search">Search patients by ID, name, or phone</label><div className="search-field"><Search size={15} /><input id="patient-search" value={patientSearch} onChange={(event) => { setPatientSearch(event.target.value); setSelectedPatient(''); }} placeholder="Start typing a patient name, ID, or phone" /></div></div>
        <div className="patient-choice-list span-2">{possiblePatients.slice(0, 4).map((patient) => <button type="button" key={patient.id} className={`patient-choice${selectedPatient === patient.id ? ' active' : ''}`} onClick={() => setSelectedPatient(patient.id)}><PatientAvatar name={patient.fullName} /><span><strong>{patient.fullName}</strong><small>{patient.id} · {patient.phone}</small></span>{selectedPatient === patient.id && <Check size={17} />}</button>)}{!possiblePatients.length && <p className="field-hint">No matching demo patients found. Choose “New patient” to register a fictional demo record.</p>}</div>
      </div> : <div className="form-grid">
        <Field id="fullName" label="Full name" required placeholder="Patient's full name" error={errors.fullName?.message as string} {...register('fullName')} />
        <Field id="dateOfBirth" label="Date of birth" type="date" required error={errors.dateOfBirth?.message as string} {...register('dateOfBirth')} />
        <div className="field"><label htmlFor="gender">Gender</label><select id="gender" className="control" {...register('gender')}><option>Prefer not to say</option><option>Female</option><option>Male</option><option>Other</option></select></div>
        <Field id="phone" label="Phone number" required type="tel" placeholder="+91 98..." error={errors.phone?.message as string} {...register('phone')} />
        <Field id="email" label="Email (optional)" type="email" placeholder="name@example.test" error={errors.email?.message as string} {...register('email')} />
        <Field id="emergencyContact" label="Emergency contact" placeholder="Name or phone (optional)" {...register('emergencyContact')} />
        <Field id="address" label="Address" required placeholder="Street, city" error={errors.address?.message as string} className="span-2" {...register('address')} />
      </div>}
      <hr className="divider" /><div className="form-grid three">
        <div className="field"><label htmlFor="queue-department">Department</label><select id="queue-department" className="control" value={department} onChange={(event) => changeDepartment(event.target.value as Department)}><option value="skin">Skin / Dermatology</option><option value="orthopaedics">Orthopaedics</option></select></div>
        <div className="field"><label htmlFor="queue-doctor">Doctor</label><select id="queue-doctor" className="control" value={doctor} onChange={(event) => setDoctor(event.target.value)}>{doctors[department].map((name) => <option key={name}>{name}</option>)}</select></div>
        <div className="field"><label htmlFor="queue-visit-type">Visit type</label><select id="queue-visit-type" className="control" value={visitType} onChange={(event) => setVisitType(event.target.value as VisitType)}><option>New</option><option>Follow-up</option><option>Walk-in</option></select></div>
        <TextAreaField id="queue-note" label="Visit note (optional)" placeholder="A short, non-clinical note for the care team" maxLength={240} value={note} onChange={(event) => setNote(event.target.value)} className="span-3" />
        <div className="field span-3"><label>Reception-entered vitals (optional)</label><div className="vitals-entry-grid">{vitalFields.map(({ key, label, placeholder }) => <div className="field" key={key}><label htmlFor={`queue-vital-${key}`}>{label}</label><input id={`queue-vital-${key}`} className="control" value={vitals[key]} placeholder={placeholder} onChange={(event) => setVitals((current) => ({ ...current, [key]: event.target.value }))} /></div>)}</div><span className="field-hint">Demo measurements are shared with the selected department’s clinical workspace; verify all values in real care workflows.</span></div>
      </div>
      <div className="button-row" style={{ marginTop: 16 }}><Button onClick={flow === 'existing' ? addExisting : addNew} disabled={isSubmitting} icon={<Plus size={15} />}>{isSubmitting ? 'Saving…' : 'Add to queue'}</Button><Button variant="secondary" onClick={() => setFlow(null)}>Cancel</Button></div>
    </Card>}
    <Card padded={false}>
      <div style={{ padding: '19px 20px 0' }}><SectionHeading title="Queue overview" subtitle={`${filtered.length} ${filtered.length === 1 ? 'patient' : 'patients'} · demo state is shared with both doctor portals`} /></div>
      <div className="toolbar" style={{ padding: '0 20px' }}><div className="search-field"><Search size={15} /><input aria-label="Search queue" placeholder="Search patient, phone, ID, or token" value={search} onChange={(event) => setSearch(event.target.value)} /></div><select aria-label="Filter by department" className="select-field" value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}><option value="all">All departments</option><option value="skin">Skin</option><option value="orthopaedics">Orthopaedics</option></select><select aria-label="Filter by doctor" className="select-field" value={doctorFilter} onChange={(event) => setDoctorFilter(event.target.value)}><option value="all">All doctors</option>{allDoctors.map((name) => <option key={name}>{name}</option>)}</select><select aria-label="Filter by status" className="select-field" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option><option>Waiting</option><option>Consulting</option><option>Completed</option></select><select aria-label="Filter by date" className="select-field" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}><option value="today">Today</option><option value="tomorrow">Tomorrow</option><option value="all">All dates</option></select></div>
      {filtered.length ? <><div className="table-wrap responsive-cards"><table className="data-table"><thead><tr><th>Token / patient</th><th>Department & doctor</th><th>Arrival</th><th>Status</th><th>Payment</th><th>Actions</th></tr></thead><tbody>{filtered.map((entry) => { const patient = state.patients.find((person) => person.id === entry.patientId); return <tr key={entry.id}><td><div className="patient-cell"><span className="queue-token">{entry.token}</span><div><strong>{patient?.fullName ?? 'Patient'}</strong><span>{patient?.id ?? entry.patientId} · {patient?.phone ?? ''}</span></div></div></td><td>{entry.department === 'skin' ? 'Skin' : 'Orthopaedics'}<span className="table-subtext">{entry.doctor}</span></td><td>{new Date(entry.arrivalAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</td><td><Badge tone={statusTone(entry.status)}>{entry.status}</Badge></td><td><Badge tone={statusTone(entry.paymentStatus)}>{entry.paymentStatus}</Badge></td><td><div className="table-actions">{entry.status === 'Waiting' && <Button variant="secondary" size="small" onClick={() => setStatus(entry.id, 'Consulting')}>Call in</Button>}{entry.status === 'Consulting' && <Button variant="secondary" size="small" onClick={() => setStatus(entry.id, 'Completed')}>Complete</Button>}<Button variant="ghost" size="small" onClick={() => navigate('/reception/billing')}>Billing</Button></div></td></tr>; })}</tbody></table></div>
        <div className="patient-card-list queue-card-list">{filtered.map((entry) => { const patient = state.patients.find((person) => person.id === entry.patientId); return <article className="patient-card" key={entry.id}><div className="patient-card-head"><div className="patient-card-name"><PatientAvatar name={patient?.fullName ?? 'Patient'} /><div><strong>{patient?.fullName ?? 'Patient'}</strong><span>{entry.token} · {patient?.id}</span></div></div><Badge tone={statusTone(entry.status)}>{entry.status}</Badge></div><div className="patient-card-meta"><div><small>Department / Doctor</small><strong>{entry.department === 'skin' ? 'Skin' : 'Orthopaedics'} · {entry.doctor}</strong></div><div><small>Arrival / Payment</small><strong>{new Date(entry.arrivalAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })} · {entry.paymentStatus}</strong></div></div><div className="button-row" style={{ marginTop: 12 }}>{entry.status === 'Waiting' && <Button variant="secondary" size="small" onClick={() => setStatus(entry.id, 'Consulting')}>Call in</Button>}{entry.status === 'Consulting' && <Button variant="secondary" size="small" onClick={() => setStatus(entry.id, 'Completed')}>Complete</Button>}<Button variant="ghost" size="small" onClick={() => navigate('/reception/billing')}>Billing</Button></div></article>; })}</div>
      </> : <EmptyState title="No queue entries match" message="Change a filter or add a patient to the queue to get started." icon={<Clock3 size={18} />} action={<Button size="small" onClick={() => setFlow('existing')}>Add existing patient</Button>} />}
    </Card>
  </>;
}
