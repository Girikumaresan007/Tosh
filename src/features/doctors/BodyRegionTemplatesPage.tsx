import { useState } from 'react';
import { Bone, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import type { BodyRegionDefinition } from './clinical/bodyRegionTemplates';
import { DEFAULT_BODY_REGION_TEMPLATES, readBodyRegionTemplates, saveBodyRegionTemplates } from './clinical/bodyRegionTemplates';
import { useToast } from '../../components/ui/Toast';
import { PageHeading } from '../../components/shared/Primitives';
import { Button } from '../../components/ui/Button';
import { Card, SectionHeading } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Field } from '../../components/ui/Field';

export function BodyRegionTemplatesPage() {
  const toast = useToast();
  const [templates, setTemplates] = useState<BodyRegionDefinition[]>(readBodyRegionTemplates().map((item) => ({ ...item, fields: [...item.fields] })));
  const [selected, setSelected] = useState(templates[0]?.region ?? 'Knee');
  const active = templates.find((item) => item.region === selected);
  const updateField = (index: number, value: string) => setTemplates((items) => items.map((item) => item.region === selected ? { ...item, fields: item.fields.map((field, fieldIndex) => fieldIndex === index ? value : field) } : item));
  const addField = () => setTemplates((items) => items.map((item) => item.region === selected ? { ...item, fields: [...item.fields, 'New examination field'] } : item));
  const removeField = (index: number) => setTemplates((items) => items.map((item) => item.region === selected ? { ...item, fields: item.fields.filter((_, fieldIndex) => fieldIndex !== index) } : item));
  const save = () => { try { saveBodyRegionTemplates(templates); toast.push('Body-region template configuration saved in this browser.'); } catch { toast.push('Could not save template settings in browser storage.', 'error'); } };
  const reset = () => { if (!window.confirm('Restore the built-in body-region template fields?')) return; setTemplates(DEFAULT_BODY_REGION_TEMPLATES.map((item) => ({ ...item, fields: [...item.fields] }))); setSelected('Knee'); try { localStorage.removeItem('carehub-body-region-templates-v1'); toast.push('Built-in templates restored.'); } catch { toast.push('Templates restored for this session.', 'info'); } };
  return <>
    <PageHeading eyebrow="Orthopaedics · Configuration" title="Body region templates" description="Configure examination field labels for Knee, Shoulder, Hip, Spine, Elbow, Wrist, Ankle, Foot, and Other. Templates never prefill findings, treatment, prescriptions, or quantity instructions." actions={<Button onClick={save} icon={<Save size={14} />}>Save templates</Button>} />
    <div className="body-template-editor">
      <Card><SectionHeading title="Body regions" subtitle="Choose a configurable examination template." action={<Bone size={17} color="#177E89" />} /><div className="template-grid">{templates.map((item) => <button type="button" key={item.region} className={`template-tile${selected === item.region ? ' selected' : ''}`} onClick={() => setSelected(item.region)}><strong>{item.region}</strong><span>{item.fields.length} fields</span></button>)}</div></Card>
      <Card><SectionHeading title={`${active?.region ?? 'Template'} examination fields`} subtitle="Change labels, add a field, or remove a field. Changes apply to future selection in the consultation workspace." />{active ? <div className="template-field-editor">{active.fields.map((field, index) => <div className="template-field-row" key={`${active.region}-${index}`}><Field id={`template-field-${index}`} label={`Field ${index + 1}`} value={field} onChange={(event) => updateField(index, event.target.value)} /><Button variant="ghost" size="small" aria-label={`Remove field ${field}`} onClick={() => removeField(index)} icon={<Trash2 size={14} />}>Remove</Button></div>)}<div className="button-row"><Button variant="secondary" onClick={addField} icon={<Plus size={14} />}>Add field</Button><Button onClick={save} icon={<Save size={14} />}>Save configuration</Button><Button variant="ghost" onClick={reset} icon={<RotateCcw size={14} />}>Restore built-ins</Button></div></div> : <EmptyState title="No region selected" message="Select a region to edit its examination fields." />}</Card>
    </div>
    <div className="hint-banner" style={{ marginTop: 14 }}><Bone size={15} /><span>Template settings are non-sensitive UI configuration stored locally. Patient findings and clinical data remain in separate consultation records.</span></div>
  </>;
}
