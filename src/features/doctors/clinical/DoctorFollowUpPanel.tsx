import { useMemo, useState } from 'react';
import { CalendarPlus, MessageCircle } from 'lucide-react';
import type { Consultation, Department } from '../../../types/domain';
import { useHospitalData } from '../../../services/mock/DemoProvider';
import { useToast } from '../../../components/ui/Toast';
import { dateLabel, departmentLabel } from '../../../utils/format';
import { Badge, statusTone } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card, SectionHeading } from '../../../components/ui/Card';
import { Field, TextAreaField } from '../../../components/ui/Field';

export function DoctorFollowUpPanel({ patientId, department, doctor, consultation, onChange }: { patientId: string; department: Department; doctor: string; consultation: Consultation; onChange: (patch: Partial<Consultation>) => void }) {
  const { state, repository } = useHospitalData();
  const toast = useToast();
  const [date, setDate] = useState(consultation.followUpDate ?? '');
  const [note, setNote] = useState('');
  const followups = useMemo(() => state.followUps.filter((item) => item.patientId === patientId && item.department === department).sort((a, b) => a.date.localeCompare(b.date)), [department, patientId, state.followUps]);
  const add = () => {
    if (!date) { toast.push('Choose a follow-up date.', 'error'); return; }
    try { repository.addFollowUp({ patientId, department, doctor, date, note: note.trim() || undefined }); onChange({ followUpDate: date }); toast.push('Follow-up added to the shared Reception schedule.'); setNote(''); }
    catch (error) { toast.push(error instanceof Error ? error.message : 'Could not add follow-up.', 'error'); }
  };
  return <div className="stack">
    <Card><SectionHeading title="Plan a follow-up" subtitle="The date and note will appear in the Reception follow-up list." /><div className="form-grid"><Field id="doctor-followup-date" label="Follow-up date" type="date" value={date} onChange={(event) => { setDate(event.target.value); onChange({ followUpDate: event.target.value }); }} /><TextAreaField id="doctor-followup-note" label="Clinician-entered instructions (optional)" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Doctor-entered follow-up note" /></div><div className="button-row" style={{ marginTop: 13 }}><Button onClick={add} icon={<CalendarPlus size={14} />}>Add follow-up</Button></div><div className="hint-banner" style={{ marginTop: 13 }}><MessageCircle size={15} /><span>WhatsApp and other reminder actions are demo-only. The interface will never claim a message was sent.</span></div></Card>
    <Card><SectionHeading title="Patient follow-up history" subtitle={`${departmentLabel(department)} · shared demo records`} />{followups.length ? followups.map((item) => <div className="list-row" key={item.id}><div className="list-row-main"><strong>{dateLabel(`${item.date}T00:00:00`)}</strong><span>{item.note || 'No note'} · Reminder {item.reminderStatus}</span></div><Badge tone={statusTone(item.status)}>{item.status}</Badge></div>) : <div className="empty-state"><h3>No follow-up scheduled</h3><p>Choose a date above to create a shared demo follow-up.</p></div>}</Card>
  </div>;
}
