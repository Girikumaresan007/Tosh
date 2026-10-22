import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Download, Eye, FilePlus2, FileText, Image as ImageIcon, Trash2, UploadCloud } from 'lucide-react';
import type { Department, PatientDocument } from '../../../types/domain';
import { useToast } from '../../../components/ui/Toast';
import { dateLabel } from '../../../utils/format';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card, SectionHeading } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Modal } from '../../../components/ui/Modal';
import { createBrowserDemoDocument } from '../../../services/documents/browserDocumentService';

const categories = ['Clinical photo', 'Imaging', 'Lab report', 'Referral', 'Consent', 'Other'];

export function DocumentsPanel({ patientId, department, documents, onChange }: { patientId: string; department: Department; documents: PatientDocument[]; onChange: (documents: PatientDocument[]) => void }) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState('Other');
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<PatientDocument | null>(null);

  const addFile = async (file: File) => {
    if (busy) return;
    setBusy(true);
    try {
      const document = await createBrowserDemoDocument(file, patientId, category);
      onChange([...documents, document]);
      toast.push('Document added to the local consultation draft. Save the consultation to retain it in demo state.');
    } catch (error) {
      toast.push(error instanceof Error ? error.message : 'Could not read this file in the browser.', 'error');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };
  const onSelect = (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) addFile(file); event.currentTarget.value = ''; };
  const onDragOver = (event: DragEvent<HTMLButtonElement>) => { event.preventDefault(); setDragging(true); };
  const onDrop = (event: DragEvent<HTMLButtonElement>) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files?.[0]; if (file) addFile(file); };
  const remove = (doc: PatientDocument) => {
    if (!window.confirm(`Remove ${doc.name} from this consultation draft?`)) return;
    onChange(documents.filter((item) => item.id !== doc.id)); toast.push('Document removed from the draft.');
  };
  const supported = 'JPG, JPEG, PNG, and PDF are enabled in the demo; edit the allow-list to configure additional types.';

  return <>
    <Card>
      <SectionHeading title="Patient documents" subtitle={`${department === 'skin' ? 'Skin / Dermatology' : 'Orthopaedics'} · Files are read locally for this demo; production storage needs an authenticated, secure backend.`} action={<Badge tone="info">{documents.length} files</Badge>} />
      <div className="document-controls">
        <div className="field"><label htmlFor="doc-category">Document category</label><select id="doc-category" className="control" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></div>
        <input ref={inputRef} className="sr-only" id="document-upload" type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" onChange={onSelect} />
        <button className={`upload-drop${dragging ? ' dragging' : ''}`} style={dragging ? { borderColor: '#177E89', background: '#EAF3F5' } : undefined} type="button" onClick={() => inputRef.current?.click()} onDragOver={onDragOver} onDragLeave={() => setDragging(false)} onDrop={onDrop} disabled={busy} aria-describedby="doc-upload-hint">
          <UploadCloud size={22} color="#177E89" /><strong>{busy ? 'Reading file…' : dragging ? 'Drop the file to attach' : 'Choose a file or drag it here'}</strong><span>Browse your device · Maximum 3 MB</span><span id="doc-upload-hint">{supported}</span>
        </button>
        <div className="hint-banner"><FilePlus2 size={15} /><span>Browser-side checks improve the demo experience; backend validation and access control are still required when connected to real records.</span></div>
      </div>
      {documents.length ? <div className="document-list">{documents.map((doc) => <article className="document-row" key={doc.id}><span className="document-icon">{doc.mimeType.startsWith('image/') ? <ImageIcon size={18} /> : <FileText size={18} />}</span><div className="document-main"><strong>{doc.name}</strong><span>{doc.category} · {dateLabel(doc.uploadedAt, 'd MMM yyyy · h:mm a')} · {(doc.size / 1024).toFixed(0)} KB</span></div><div className="document-actions">{doc.dataUrl && <Button variant="ghost" size="small" aria-label={`Preview ${doc.name}`} onClick={() => setPreview(doc)} icon={<Eye size={14} />}>Preview</Button>}{doc.dataUrl && <a className="btn btn-ghost btn-small" href={doc.dataUrl} download={doc.name} aria-label={`Download ${doc.name}`}><Download size={14} />Download</a>}<Button variant="ghost" size="small" aria-label={`Remove ${doc.name}`} onClick={() => remove(doc)} icon={<Trash2 size={14} />}>Remove</Button></div></article>)}</div> : <EmptyState title="No documents attached" message="Add clinical photos, imaging, laboratory reports, referrals, or consent files to the draft." icon={<FileText size={18} />} />}
    </Card>
    <Modal open={Boolean(preview)} title={preview?.name ?? 'Document preview'} subtitle={`${preview?.category ?? ''} · Local browser preview`} onClose={() => setPreview(null)} wide>{preview?.mimeType.startsWith('image/') ? <img className="document-preview-image" src={preview.dataUrl} alt={`Preview of ${preview.name}`} /> : preview?.mimeType === 'application/pdf' && preview.dataUrl ? <iframe className="document-preview-pdf" title={`Preview of ${preview.name}`} src={preview.dataUrl} /> : <p>This file type has no inline preview.</p>}</Modal>
  </>;
}
