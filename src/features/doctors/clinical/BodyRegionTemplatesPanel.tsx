import { useMemo, useState } from 'react';
import { Bone, Printer, Save } from 'lucide-react';
import type { BodyRegionTemplateData, Consultation } from '../../../types/domain';
import { readBodyRegionTemplates } from './bodyRegionTemplates';
import { useToast } from '../../../components/ui/Toast';
import { dateLabel } from '../../../utils/format';
import { Button } from '../../../components/ui/Button';
import { Card, SectionHeading } from '../../../components/ui/Card';
import { Field, TextAreaField } from '../../../components/ui/Field';
import { Modal } from '../../../components/ui/Modal';

const emptyTemplate = (region: string, side: BodyRegionTemplateData['side']): BodyRegionTemplateData => ({ region, side, examinationFields: {}, findings: '', treatmentAdvice: '', prescription: '', followUpInstructions: '' });

export function BodyRegionTemplatesPanel({ consultation, onChange }: { consultation: Consultation; onChange: (patch: Partial<Consultation>) => void }) {
  const toast = useToast();
  const templates = readBodyRegionTemplates();
  const [preview, setPreview] = useState(false);
  const selectedRegion = consultation.bodyRegionTemplate?.region ?? '';
  const definition = useMemo(() => templates.find((item) => item.region === selectedRegion), [selectedRegion, templates]);
  const current = consultation.bodyRegionTemplate;
  const chooseRegion = (region: string) => {
    if (current && Object.values(current.examinationFields).some(Boolean) && !window.confirm('Switch region and start a new template section? Unsaved template field values will be replaced.')) return;
    const side = consultation.side ?? 'Not applicable';
    onChange({ painLocation: region, bodyRegionTemplate: emptyTemplate(region, side) });
  };
  const updateTemplate = (patch: Partial<BodyRegionTemplateData>) => {
    if (!current) return;
    onChange({ bodyRegionTemplate: { ...current, ...patch }, ...(patch.side ? { side: patch.side } : {}) });
  };
  const updateField = (field: string, value: string) => {
    if (!current) return;
    updateTemplate({ examinationFields: { ...current.examinationFields, [field]: value } });
  };
  const print = () => {
    if (!current) { toast.push('Choose a body region before previewing instructions.', 'error'); return; }
    setPreview(true);
  };
  return <>
    <Card><SectionHeading title="Body-region template" subtitle="Configurable examination fields; this section does not auto-create clinical findings." action={<span className="template-draft-status" title="Changes are included in the consultation draft"><Bone size={17} color="#177E89" /><Save size={13} color="#64748B" /></span>} />
      <div className="body-region-grid">{templates.map((item) => <button type="button" key={item.region} className={`template-tile${selectedRegion === item.region ? ' selected' : ''}`} onClick={() => chooseRegion(item.region)}><strong>{item.region}</strong><span>{item.fields.length} configurable examination fields</span></button>)}</div>
      {current && <div className="body-region-form"><div className="form-grid"><div className="field"><label htmlFor="template-side">Side</label><select id="template-side" className="control" value={current.side} onChange={(event) => updateTemplate({ side: event.target.value as BodyRegionTemplateData['side'] })}>{['Left', 'Right', 'Bilateral', 'Not applicable'].map((value) => <option key={value}>{value}</option>)}</select></div><div className="field"><label>Selected region</label><div className="field-static">{current.region}</div></div></div>
        <div className="body-region-fields">{(definition?.fields ?? []).map((field, index) => <Field key={`${current.region}-${field}-${index}`} id={`region-${current.region}-${index}`} label={field} value={current.examinationFields[field] ?? ''} onChange={(event) => updateField(field, event.target.value)} placeholder="Doctor-entered examination" />)}</div>
        <TextAreaField id="region-findings" label="Doctor findings" value={current.findings} onChange={(event) => updateTemplate({ findings: event.target.value })} placeholder="Findings entered by clinician" rows={3} />
        <TextAreaField id="region-advice" label="Treatment / advice" value={current.treatmentAdvice} onChange={(event) => updateTemplate({ treatmentAdvice: event.target.value })} placeholder="Clinician-entered treatment and advice" rows={3} />
        <TextAreaField id="region-prescription" label="Prescription details" value={current.prescription} onChange={(event) => updateTemplate({ prescription: event.target.value })} placeholder="Only details explicitly entered and approved by the doctor" rows={3} />
        <TextAreaField id="region-followup" label="Follow-up instructions" value={current.followUpInstructions} onChange={(event) => updateTemplate({ followUpInstructions: event.target.value })} placeholder="Clinician-entered review instructions" rows={3} />
        <Button variant="secondary" onClick={print} icon={<Printer size={14} />}>Preview printable instructions</Button>
      </div>}
    </Card>
    <Modal open={preview} title={`${current?.region ?? 'Body region'} instructions`} subtitle="Review the clinician-entered body-region details before printing." onClose={() => setPreview(false)} footer={<><Button variant="secondary" onClick={() => setPreview(false)}>Close</Button><Button onClick={() => { document.body.classList.add('print-body-template'); window.setTimeout(() => { window.print(); document.body.classList.remove('print-body-template'); }, 60); }} icon={<Printer size={14} />}>Print</Button></>}>
      {current && <article className="body-template-print"><div className="print-brand"><strong>Northstar Medical</strong><span>Orthopaedics · Pune</span></div><h2>{current.region} · {current.side}</h2><p>Patient consultation · {dateLabel(consultation.visitedAt)}</p>{Object.entries(current.examinationFields).map(([label, value]) => <div className="print-block" key={label}><h3>{label}</h3><p>{value || '—'}</p></div>)}<div className="print-block"><h3>Doctor findings</h3><p>{current.findings || '—'}</p></div><div className="print-block"><h3>Treatment / advice</h3><p>{current.treatmentAdvice || '—'}</p></div><div className="print-block"><h3>Prescription details</h3><p>{current.prescription || '—'}</p></div><div className="print-block"><h3>Follow-up instructions</h3><p>{current.followUpInstructions || '—'}</p></div><div className="print-signature">Clinician entered · demo only<span>No medication or quantity is automatically selected.</span></div></article>}
    </Modal>
  </>;
}
