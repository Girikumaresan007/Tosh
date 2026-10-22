import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { CheckCheck, ClipboardList, FileText, Printer, Save, Stethoscope } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Consultation, Department } from '../../types/domain';
import { useHospitalData } from '../../services/mock/DemoProvider';
import { useToast } from '../../components/ui/Toast';
import { dateLabel, departmentLabel, getAge } from '../../utils/format';
import { PageHeading, PatientAvatar } from '../../components/shared/Primitives';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, SectionHeading } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { TabPanel, Tabs } from '../../components/ui/Tabs';
import { ClinicalNotesPanel } from './clinical/ClinicalNotesPanel';
import { PrescriptionPanel } from './clinical/PrescriptionPanel';
import { DocumentsPanel } from './clinical/DocumentsPanel';
import { ProceduresPanel } from './clinical/ProceduresPanel';
import { DoctorFollowUpPanel } from './clinical/DoctorFollowUpPanel';
import { BodyRegionTemplatesPanel } from './clinical/BodyRegionTemplatesPanel';

const tabs = ['Clinical notes', 'Prescription', 'Documents', 'Procedures', 'Follow-up'] as const;
type Tab = typeof tabs[number];
const tabOptions = tabs.map((label) => ({ id: label, label }));
const doctorNames: Record<Department, string> = { skin: 'Dr. Nisha Kulkarni', orthopaedics: 'Dr. Raghav Menon' };
function blankVisit(patientId: string, department: Department, visitId?: string): Consultation {
  return { id: visitId ?? `DRAFT-${patientId}-${department}`, patientId, department, visitedAt: new Date().toISOString(), vitals: { bloodPressure: '', pulse: '', temperature: '', height: '', weight: '', oxygenSaturation: '' }, symptoms: '', medicalHistory: '', allergies: '', examination: '', assessment: '', diagnosis: '', treatmentPlan: '', prescription: [], documents: [], procedures: [], painLocation: '', side: 'Not applicable', status: 'Draft' };
}

export function ClinicalWorkspace({ department }: { department: Department }) {
  const { patientId: routePatientId } = useParams<{ patientId: string }>();
  const { state, repository } = useHospitalData();
  const toast = useToast();
  const navigate = useNavigate();
  const role = department === 'skin' ? 'skin' : 'ortho';
  const patients = state.patients.filter((patient) => patient.departments.includes(department));
  const defaultPatient = state.queue.find((entry) => entry.department === department && entry.status !== 'Completed')?.patientId ?? patients[0]?.id;
  const selectedPatientId = routePatientId ?? defaultPatient;
  const patient = state.patients.find((entry) => entry.id === selectedPatientId);
  const selectedQueue = state.queue.find((entry) => entry.patientId === selectedPatientId && entry.department === department && entry.status !== 'Completed') ?? state.queue.find((entry) => entry.patientId === selectedPatientId && entry.department === department);
  const visitIdSupplied = selectedQueue?.visitId !== undefined;
  const queueVisitId = selectedQueue?.visitId;
  const invalidEmptyVisitId = visitIdSupplied && !queueVisitId?.trim();
  const visitCandidate = visitIdSupplied && !invalidEmptyVisitId ? state.consultations.find((visit) => visit.id === queueVisitId) : undefined;
  const visitLinkMismatch = Boolean(invalidEmptyVisitId || (visitCandidate && (visitCandidate.patientId !== selectedPatientId || visitCandidate.department !== department)));
  const savedVisit = visitIdSupplied ? (!visitLinkMismatch ? visitCandidate : undefined) : state.consultations.find((visit) => visit.patientId === selectedPatientId && visit.department === department);
  const missingVisitId = visitIdSupplied && !visitLinkMismatch && !visitCandidate ? queueVisitId : undefined;
  const [clinical, setClinical] = useState<Consultation>(() => patient ? savedVisit ?? blankVisit(patient.id, department, missingVisitId) : blankVisit('', department));
  const [tab, setTab] = useState<Tab>('Clinical notes');
  const [dirty, setDirty] = useState(false);
  useEffect(() => { if (patient) { setClinical(savedVisit ?? blankVisit(patient.id, department, missingVisitId)); setDirty(false); setTab('Clinical notes'); } }, [selectedPatientId, selectedQueue?.id, selectedQueue?.visitId, savedVisit?.id, missingVisitId]);
  if (visitLinkMismatch) return <><PageHeading eyebrow={`${departmentLabel(department)} · Visit integrity`} title="Visit link needs review" description="No consultation from another patient or department was opened." /><Card><EmptyState title="Visit ID does not match this patient" message="The queue entry has an empty visit ID or points to a consultation assigned to a different patient or department. No changes were made. Reset the fictional demo records in Reception Settings, then reopen this visit." icon={<ClipboardList size={18} />} /></Card></>;
  if (!patient || !selectedPatientId) return <><PageHeading eyebrow={`${departmentLabel(department)} · Consultation`} title="Consultation workspace" description="Select a patient to begin a clinical record." /><Card><EmptyState title="No department patients yet" message="Register or schedule a fictional patient from Reception to start a consultation." icon={<Stethoscope size={18} />} action={<Button onClick={() => navigate('/reception/patients')}>Open patient directory</Button>} /></Card></>;

  const patch = (update: Partial<Consultation>) => { setClinical((current) => ({ ...current, ...update })); setDirty(true); };
  const save = (status: Consultation['status'] = clinical.status) => {
    try { repository.saveConsultation(patient.id, department, { ...clinical, status }); setClinical((current) => ({ ...current, status })); setDirty(false); toast.push(status === 'Finalized' ? 'Consultation finalized in demo data.' : 'Consultation draft saved.'); }
    catch (error) { toast.push(error instanceof Error ? error.message : 'Could not save consultation.', 'error'); }
  };
  const changePatient = (id: string) => {
    if (!id) return;
    if (dirty && !window.confirm('Discard unsaved consultation changes and open another patient?')) return;
    navigate(`/${role}/consultation/${id}`);
  };
  const print = (kind: 'clinical' | 'prescription') => {
    document.body.classList.add(kind === 'clinical' ? 'print-clinical' : 'print-prescription');
    window.setTimeout(() => { window.print(); document.body.classList.remove('print-clinical', 'print-prescription'); }, 60);
  };
  const nextAppointment = state.appointments.filter((item) => item.patientId === patient.id && item.department === department && !['Completed', 'Cancelled'].includes(item.status)).sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];

  return <>
    <PageHeading eyebrow={`${departmentLabel(department)} · Clinical workspace`} title="Consultation" description="Document what the clinician observes and decides; every clinical statement and prescription stays doctor-entered." actions={<><Button variant="secondary" size="small" onClick={() => print('clinical')} icon={<Printer size={14} />}>Print summary</Button><Button variant="secondary" size="small" onClick={() => save('Draft')} icon={<Save size={14} />}>Save draft</Button><Button size="small" onClick={() => { if (window.confirm('Finalize this consultation in demo data? The doctor can still edit it afterward.')) save('Finalized'); }} icon={<CheckCheck size={14} />}>Finalize</Button></>} />
    <div className="doctor-workspace">
      <aside className="stack sticky-card">
        <Card><SectionHeading title="Patient overview" action={<span className="clinical-summary-tag"><FileText size={14} /><Badge tone={clinical.status === 'Finalized' ? 'success' : 'warn'}>{clinical.status}</Badge></span>} /><div className="clinical-patient-name"><PatientAvatar name={patient.fullName} /><div><strong>{patient.fullName}</strong><span>{patient.id}</span></div></div><div className="profile-grid compact-profile"><div className="profile-info"><span>Age / gender</span><strong>{getAge(patient.dateOfBirth) ?? '—'} years · {patient.gender}</strong></div><div className="profile-info"><span>Phone</span><strong>{patient.phone}</strong></div><div className="profile-info"><span>Department</span><strong>{departmentLabel(department)}</strong></div><div className="profile-info"><span>Latest visit</span><strong>{patient.latestVisitAt ? formatDistanceToNow(new Date(patient.latestVisitAt), { addSuffix: true }) : 'First visit'}</strong></div></div><div className="field" style={{ marginTop: 13 }}><label htmlFor="consult-patient">Switch patient</label><select id="consult-patient" className="control" value={patient.id} onChange={(event) => changePatient(event.target.value)}>{patients.map((entry) => <option key={entry.id} value={entry.id}>{entry.fullName} · {entry.id}</option>)}</select></div></Card>
        <Card><SectionHeading title="Reception-entered vitals" subtitle="Review or edit demo measurements in Clinical notes." /><div className="vitals-grid">{[['BP', clinical.vitals.bloodPressure], ['Pulse', clinical.vitals.pulse], ['Temp', clinical.vitals.temperature], ['Height', clinical.vitals.height], ['Weight', clinical.vitals.weight], ['SpO₂', clinical.vitals.oxygenSaturation]].map(([label, value]) => <div className="vital-tile" key={label}><span>{label}</span><strong>{value || '—'}</strong></div>)}</div></Card>
        <Card><SectionHeading title="Visit context" /><div className="metric-list"><div className="metric-line"><span>Allergies</span><strong>{clinical.allergies || 'Not recorded'}</strong></div><div className="metric-line"><span>Next appointment</span><strong>{nextAppointment ? dateLabel(nextAppointment.startsAt, 'd MMM · h:mm a') : 'None scheduled'}</strong></div><div className="metric-line"><span>Follow-up</span><strong>{clinical.followUpDate ? dateLabel(`${clinical.followUpDate}T00:00:00`) : 'Not set'}</strong></div></div></Card>
        {department === 'orthopaedics' && <BodyRegionTemplatesPanel consultation={clinical} onChange={patch} />}
      </aside>
      <section className="clinical-main">
        <Tabs idPrefix="clinical" ariaLabel="Consultation sections" items={tabOptions} selected={tab} onChange={setTab} className="clinical-tabs" />
        {dirty && <div className="status-strip" role="status"><ClipboardList size={14} /> You have unsaved changes. Save draft to keep them in the shared demo record.</div>}
        <TabPanel idPrefix="clinical" selected={tab} className="clinical-tab-content">
          {tab === 'Clinical notes' && <ClinicalNotesPanel department={department} consultation={clinical} onChange={patch} />}
          {tab === 'Prescription' && <PrescriptionPanel consultation={clinical} onChange={patch} onPrint={() => print('prescription')} />}
          {tab === 'Documents' && <DocumentsPanel patientId={patient.id} department={department} documents={clinical.documents} onChange={(documents) => patch({ documents })} />}
          {tab === 'Procedures' && <ProceduresPanel patientId={patient.id} department={department} consultation={clinical} onChange={patch} />}
          {tab === 'Follow-up' && <DoctorFollowUpPanel patientId={patient.id} department={department} doctor={doctorNames[department]} consultation={clinical} onChange={patch} />}
        </TabPanel>
        <div className="clinical-bottom-actions"><span className="field-hint">Saved in frontend demo state only · not a real medical record.</span><div className="button-row"><Button variant="secondary" onClick={() => save('Draft')} icon={<Save size={14} />}>Save draft</Button><Button onClick={() => save('Finalized')} icon={<CheckCheck size={14} />}>Save as finalized</Button></div></div>
      </section>
    </div>
    <section className="print-sheet clinical-print-sheet" aria-label="Printable consultation summary"><PrintHeader department={department} /><h1>Consultation summary</h1><p>{patient.fullName} · {patient.id} · {dateLabel(clinical.visitedAt)}</p><PrintBlock title="Vitals" content={Object.entries(clinical.vitals).map(([key, value]) => `${key}: ${value || '—'}`).join(' · ')} /><PrintBlock title="Symptoms" content={clinical.symptoms} /><PrintBlock title="Medical history" content={clinical.medicalHistory} /><PrintBlock title="Allergies" content={clinical.allergies} /><PrintBlock title="Examination" content={clinical.examination} /><PrintBlock title="Assessment" content={clinical.assessment} /><PrintBlock title="Diagnosis" content={clinical.diagnosis} /><PrintBlock title="Treatment plan" content={clinical.treatmentPlan} />{department === 'orthopaedics' && <PrintBlock title="Body region" content={`${clinical.painLocation || 'Not recorded'} · ${clinical.side || 'Not specified'}`} />}{clinical.prescription.map((item) => <PrintBlock key={item.id} title={item.medicineName} content={`${item.strength} · ${item.dosage} · ${item.route} · ${item.frequency} · ${item.duration}${item.instructions ? ` · ${item.instructions}` : ''}`} />)}<div className="print-signature">Clinician: {doctorNames[department]}<span>Doctor-entered demo record</span></div></section>
    <section className="print-sheet prescription-print-sheet" aria-label="Printable prescription"><PrintHeader department={department} /><h1>Prescription</h1><p>{patient.fullName} · {patient.id} · {dateLabel(clinical.visitedAt)}</p>{clinical.diagnosis && <PrintBlock title="Diagnosis" content={clinical.diagnosis} />}{clinical.prescription.length ? clinical.prescription.map((item) => <div className="print-prescription-row" key={item.id}><h3>{item.medicineName}</h3><p>{item.strength} · {item.dosage} · {item.route}</p><p>{item.frequency} · {item.duration}</p>{item.instructions && <p>{item.instructions}</p>}</div>) : <p>No medication entered by clinician.</p>}<div className="print-signature">Clinician: {doctorNames[department]}<span>Only details entered and approved by the clinician are included.</span></div></section>
  </>;
}

function PrintHeader({ department }: { department: Department }) { return <div className="print-brand"><strong>Northstar Medical</strong><span>{departmentLabel(department)} · Pune</span></div>; }
function PrintBlock({ title, content }: { title: string; content: string }) { return <div className="print-block"><h2>{title}</h2><p>{content || '—'}</p></div>; }
