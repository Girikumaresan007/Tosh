import { useState } from 'react';
import { Activity, ArrowRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Consultation, Department } from '../../../types/domain';
import { useHospitalData } from '../../../services/mock/DemoProvider';
import { useToast } from '../../../components/ui/Toast';
import { money, dateLabel } from '../../../utils/format';
import { Button } from '../../../components/ui/Button';
import { Card, SectionHeading } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Field } from '../../../components/ui/Field';

export function ProceduresPanel({ patientId, department, consultation, onChange }: { patientId: string; department: Department; consultation: Consultation; onChange: (patch: Partial<Consultation>) => void }) {
  const { repository } = useHospitalData();
  const toast = useToast();
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const add = () => {
    const value = Number(amount);
    if (description.trim().length < 2) { toast.push('Enter a service or procedure description.', 'error'); return; }
    if (!Number.isFinite(value) || value <= 0) { toast.push('Enter an amount greater than zero.', 'error'); return; }
    try {
      repository.addServiceCharge(patientId, department, description.trim(), value, department === 'skin' ? 'Dr. Nisha Kulkarni' : 'Dr. Raghav Menon', consultation.id);
      const item = { id: `CH-${Date.now()}`, description: description.trim(), amount: value, addedBy: department === 'skin' ? 'Dr. Nisha Kulkarni' : 'Dr. Raghav Menon', createdAt: new Date().toISOString() };
      onChange({ procedures: [...consultation.procedures, item] });
      setDescription(''); setAmount(''); toast.push('Procedure charge added to the shared invoice for Reception.');
    } catch (error) { toast.push(error instanceof Error ? error.message : 'Could not add the charge.', 'error'); }
  };
  return <div className="stack">
    <Card><SectionHeading title="Treatments / procedures" subtitle="Charges entered by the clinician are shared with Reception billing." action={<Activity size={17} color="#177E89" />} /><div className="form-grid"><Field id="procedure-description" label="Service or procedure description" placeholder="Clinician-entered item" value={description} onChange={(event) => setDescription(event.target.value)} /><Field id="procedure-amount" label="Amount (INR)" type="number" min="1" step="1" placeholder="0" value={amount} onChange={(event) => setAmount(event.target.value)} /></div><div className="button-row" style={{ marginTop: 13 }}><Button onClick={add} icon={<Plus size={14} />}>Add charge to visit</Button><Button variant="ghost" onClick={() => navigate('/reception/billing')} icon={<ArrowRight size={14} />}>Open billing register</Button></div></Card>
    <Card><SectionHeading title="Visit charges" subtitle="These items are also part of the invoice preview." />{consultation.procedures.length ? consultation.procedures.map((item) => <div className="list-row" key={item.id}><div className="list-row-main"><strong>{item.description}</strong><span>Added by {item.addedBy} · {dateLabel(item.createdAt, 'd MMM yyyy · h:mm a')}</span></div><strong>{money(item.amount)}</strong></div>) : <EmptyState title="No procedures or services added" message="Add an item only when the doctor has entered the service and charge." icon={<Activity size={18} />} />}</Card>
  </div>;
}
