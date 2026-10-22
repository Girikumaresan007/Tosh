import { useState } from 'react';
import { Pill, Plus, Printer, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { prescriptionSchema } from '../../../schemas/forms';
import type { Consultation, PrescriptionItem } from '../../../types/domain';
import { useToast } from '../../../components/ui/Toast';
import { Button } from '../../../components/ui/Button';
import { Card, SectionHeading } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Field, TextAreaField } from '../../../components/ui/Field';

const blank = { medicineName: '', strength: '', dosage: '', route: '', frequency: '', duration: '', instructions: '' };
const labels: Record<keyof Omit<PrescriptionItem, 'id'>, string> = { medicineName: 'Medicine', strength: 'Strength', dosage: 'Dosage', route: 'Route', frequency: 'Frequency', duration: 'Duration', instructions: 'Instructions' };

export function PrescriptionPanel({ consultation, onChange, onPrint }: { consultation: Consultation; onChange: (patch: Partial<Consultation>) => void; onPrint: () => void }) {
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm({ resolver: zodResolver(prescriptionSchema), defaultValues: blank });
  const add = handleSubmit((values) => { const item: PrescriptionItem = { ...values, id: `RX-${Date.now()}` }; onChange({ prescription: [...consultation.prescription, item] }); toast.push('Doctor-entered medication added to the draft.'); reset(blank); setAdding(false); });
  const update = (id: string, key: keyof Omit<PrescriptionItem, 'id'>, value: string) => onChange({ prescription: consultation.prescription.map((item) => item.id === id ? { ...item, [key]: value } : item) });
  const remove = (id: string) => { if (!window.confirm('Remove this medication from the consultation draft?')) return; onChange({ prescription: consultation.prescription.filter((item) => item.id !== id) }); };
  return <div className="stack">
    <Card><SectionHeading title="Prescription" subtitle="Every medication detail is entered and approved by the doctor. This tool does not recommend medicines." action={<Button variant="secondary" size="small" disabled={!consultation.prescription.length} onClick={onPrint} icon={<Printer size={14} />}>Print prescription</Button>} /><div className="alert-banner"><Pill size={15} /><span>No medicine, strength, dosage, route, frequency, duration, or quantity is auto-generated. The clinician is responsible for every value.</span></div>
      {consultation.prescription.length ? <div className="prescription-list">{consultation.prescription.map((item, index) => <article className="prescription-item" key={item.id}><div className="prescription-item-header"><strong>Medication {index + 1}</strong><Button variant="ghost" size="small" aria-label={`Remove ${item.medicineName || 'medication'}`} onClick={() => remove(item.id)} icon={<Trash2 size={14} />}>Remove</Button></div><div className="form-grid three"><Field id={`${item.id}-medicine`} label={labels.medicineName} value={item.medicineName} onChange={(event) => update(item.id, 'medicineName', event.target.value)} /><Field id={`${item.id}-strength`} label="Strength" value={item.strength} onChange={(event) => update(item.id, 'strength', event.target.value)} /><Field id={`${item.id}-dosage`} label="Dosage" value={item.dosage} onChange={(event) => update(item.id, 'dosage', event.target.value)} /><Field id={`${item.id}-route`} label="Route" value={item.route} onChange={(event) => update(item.id, 'route', event.target.value)} /><Field id={`${item.id}-frequency`} label="Frequency" value={item.frequency} onChange={(event) => update(item.id, 'frequency', event.target.value)} /><Field id={`${item.id}-duration`} label="Duration" value={item.duration} onChange={(event) => update(item.id, 'duration', event.target.value)} /><Field id={`${item.id}-instructions`} label="Instructions" value={item.instructions} onChange={(event) => update(item.id, 'instructions', event.target.value)} className="span-3" /></div></article>)}</div> : <EmptyState title="No prescription entered" message="Add a medication only after the clinician has chosen and reviewed its details." icon={<Pill size={18} />} />}
      <Button variant="secondary" onClick={() => setAdding((value) => !value)} icon={<Plus size={14} />}>{adding ? 'Close entry form' : 'Add medication'}</Button>
      {adding && <form className="prescription-form" onSubmit={add}><div className="form-grid three"><Field id="rx-medicine" label="Medicine name" required error={errors.medicineName?.message as string} {...register('medicineName')} /><Field id="rx-strength" label="Strength" required placeholder="Clinician-entered" error={errors.strength?.message as string} {...register('strength')} /><Field id="rx-dosage" label="Dosage" required error={errors.dosage?.message as string} {...register('dosage')} /><Field id="rx-route" label="Route" required error={errors.route?.message as string} {...register('route')} /><Field id="rx-frequency" label="Frequency" required error={errors.frequency?.message as string} {...register('frequency')} /><Field id="rx-duration" label="Duration" required error={errors.duration?.message as string} {...register('duration')} /><TextAreaField id="rx-instructions" label="Instructions (optional)" maxLength={240} className="span-3" {...register('instructions')} /></div><Button type="submit" icon={<Plus size={14} />}>Add doctor-entered medication</Button></form>}
    </Card>
  </div>;
}
