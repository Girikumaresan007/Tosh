import { useRef, useState, useMemo, useEffect, type ChangeEvent, type DragEvent } from 'react';
import { Bone, CheckSquare, Download, Eye, Pill, Plus, Printer, Square, Trash2, UploadCloud } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { prescriptionSchema } from '../../../schemas/forms';
import type { Consultation, PrescriptionImage, PrescriptionItem } from '../../../types/domain';
import { readBodyRegionTemplates } from './bodyRegionTemplates';
import { useToast } from '../../../components/ui/Toast';
import { Button } from '../../../components/ui/Button';
import { Card, SectionHeading } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Field, TextAreaField } from '../../../components/ui/Field';
import { Modal } from '../../../components/ui/Modal';
import { createPrescriptionImage } from '../../../services/documents/browserDocumentService';
import { dateLabel } from '../../../utils/format';

const blank = { medicineName: '', strength: '', dosage: '', route: '', frequency: '', duration: '', instructions: '' };
const labels: Record<keyof Omit<PrescriptionItem, 'id'>, string> = {
  medicineName: 'Medicine',
  strength: 'Strength',
  dosage: 'Dosage',
  route: 'Route',
  frequency: 'Frequency',
  duration: 'Duration',
  instructions: 'Instructions',
};

export function PrescriptionPanel({
  consultation,
  onChange,
  onPrint,
  department,
}: {
  consultation: Consultation;
  onChange: (patch: Partial<Consultation>) => void;
  onPrint: () => void;
  department?: string;
}) {
  const toast = useToast();
  const [addingMed, setAddingMed] = useState(false);
  const [imageDragging, setImageDragging] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<PrescriptionImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const prescriptionImages = consultation.prescriptionImages ?? [];
  const hasPrescriptionContent = consultation.prescription.length > 0 || prescriptionImages.length > 0;

  // Body Region Templates 10 tablets loader
  const bodyRegionTemplates = useMemo(() => readBodyRegionTemplates(), []);
  const initialRegion = consultation.bodyRegionTemplate?.region || 'Knee';
  const [activeTemplateRegion, setActiveTemplateRegion] = useState<string>(initialRegion);
  const activeDef = useMemo(
    () => bodyRegionTemplates.find((t) => t.region === activeTemplateRegion) || bodyRegionTemplates[0],
    [bodyRegionTemplates, activeTemplateRegion]
  );
  const [selectedTemplateMedIds, setSelectedTemplateMedIds] = useState<Set<string>>(new Set());

  // Automatically select all tablets when template region changes
  useEffect(() => {
    if (activeDef?.medications) {
      setSelectedTemplateMedIds(new Set(activeDef.medications.map((m) => m.id)));
    } else {
      setSelectedTemplateMedIds(new Set());
    }
  }, [activeDef]);

  const toggleTemplateMed = (id: string) => {
    setSelectedTemplateMedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllTemplateMeds = () => {
    if (!activeDef?.medications) return;
    if (selectedTemplateMedIds.size === activeDef.medications.length) {
      setSelectedTemplateMedIds(new Set());
    } else {
      setSelectedTemplateMedIds(new Set(activeDef.medications.map((m) => m.id)));
    }
  };

  const addSelectedTemplateMeds = () => {
    if (!activeDef?.medications || selectedTemplateMedIds.size === 0) {
      toast.push('Please select at least one tablet to add to prescription.', 'info');
      return;
    }
    const toAdd = activeDef.medications.filter((m) => selectedTemplateMedIds.has(m.id));
    const newItems: PrescriptionItem[] = toAdd.map((m) => ({
      id: `RX-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      medicineName: m.medicineName,
      strength: m.strength,
      dosage: m.dosage,
      route: m.route,
      frequency: m.frequency,
      duration: m.duration,
      instructions: m.instructions,
    }));
    onChange({ prescription: [...consultation.prescription, ...newItems] });
    toast.push(`Added ${newItems.length} tablet${newItems.length > 1 ? 's' : ''} to prescription for ${activeDef.region}.`);
  };

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: blank,
  });

  const addMed = handleSubmit((values) => {
    const item: PrescriptionItem = { ...values, id: `RX-${Date.now()}` };
    onChange({ prescription: [...consultation.prescription, item] });
    toast.push('Doctor-entered medication added to the draft.');
    reset(blank);
    setAddingMed(false);
  });

  const updateMed = (id: string, key: keyof Omit<PrescriptionItem, 'id'>, value: string) => {
    onChange({
      prescription: consultation.prescription.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    });
  };

  const removeMed = (id: string) => {
    if (!window.confirm('Remove this medication from the consultation draft?')) return;
    onChange({ prescription: consultation.prescription.filter((item) => item.id !== id) });
  };

  const handleImageFiles = async (files: FileList | null) => {
    if (!files || !files.length || uploadingImage) return;
    setUploadingImage(true);
    const newImages: PrescriptionImage[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const rxImg = await createPrescriptionImage(file);
        newImages.push(rxImg);
      }
      onChange({ prescriptionImages: [...prescriptionImages, ...newImages] });
      toast.push(`${newImages.length} prescription image${newImages.length > 1 ? 's' : ''} attached successfully.`);
    } catch (error) {
      toast.push(error instanceof Error ? error.message : 'Could not attach prescription image.', 'error');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    handleImageFiles(event.target.files);
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setImageDragging(true);
  };

  const onDragLeave = () => {
    setImageDragging(false);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setImageDragging(false);
    handleImageFiles(event.dataTransfer.files);
  };

  const removeImage = (id: string, name: string) => {
    if (!window.confirm(`Remove prescription image "${name}"?`)) return;
    onChange({ prescriptionImages: prescriptionImages.filter((img) => img.id !== id) });
    toast.push('Prescription image removed.');
  };

  return (
    <div className="stack">
      <Card>
        <SectionHeading
          title="Prescription"
          subtitle="Add doctor-entered medications and/or upload prescription images (handwritten prescription pads, scanned Rx notes) in any image format."
          action={
            <Button
              variant="secondary"
              size="small"
              disabled={!hasPrescriptionContent}
              onClick={onPrint}
              icon={<Printer size={14} />}
            >
              Print prescription
            </Button>
          }
        />

        {/* Section 1: Prescription Image Upload */}
        <div className="prescription-image-section" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <strong style={{ fontSize: 13, color: 'var(--navy)', display: 'block' }}>Prescription Images / Handwritten Rx</strong>
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                Upload photos or scans of physical prescription sheets in any image format (JPG, PNG, WebP, AVIF, GIF, SVG).
              </span>
            </div>
            <Button
              variant="secondary"
              size="small"
              onClick={() => fileInputRef.current?.click()}
              icon={<Plus size={14} />}
              disabled={uploadingImage}
            >
              {uploadingImage ? 'Uploading…' : 'Upload Rx Image'}
            </Button>
          </div>

          <input
            ref={fileInputRef}
            className="sr-only"
            id="prescription-image-upload"
            type="file"
            accept="image/*,.jpg,.jpeg,.png,.webp,.avif,.gif,.bmp,.svg"
            multiple
            onChange={onImageSelect}
          />

          <div
            className={`upload-drop${imageDragging ? ' dragging' : ''}`}
            style={{
              cursor: 'pointer',
              border: imageDragging ? '2px dashed #177E89' : '1px dashed var(--line)',
              background: imageDragging ? '#EAF3F5' : '#FAFCFC',
              padding: '16px 20px',
              borderRadius: 12,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              marginBottom: 14,
            }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <UploadCloud size={24} color="#177E89" />
            <strong style={{ fontSize: 11, color: 'var(--navy)' }}>
              {uploadingImage ? 'Reading prescription image…' : 'Choose prescription image or drag & drop here'}
            </strong>
            <span style={{ fontSize: 9, color: 'var(--muted)' }}>
              Supports all image formats (JPG, PNG, WebP, AVIF, GIF, BMP, SVG) · Multiple images supported
            </span>
          </div>

          {prescriptionImages.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 12,
                marginTop: 12,
              }}
            >
              {prescriptionImages.map((img, idx) => (
                <div
                  key={img.id}
                  style={{
                    border: '1px solid var(--line)',
                    borderRadius: 10,
                    overflow: 'hidden',
                    background: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div
                    style={{
                      height: 120,
                      background: '#F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      overflow: 'hidden',
                    }}
                    onClick={() => setPreviewImage(img)}
                    title="Click to zoom / preview"
                  >
                    <img
                      src={img.dataUrl}
                      alt={img.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ padding: '8px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <strong
                      style={{
                        fontSize: 10,
                        color: 'var(--navy)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={img.name}
                    >
                      Rx Page {idx + 1}: {img.name}
                    </strong>
                    <span style={{ fontSize: 8, color: 'var(--muted)' }}>
                      {(img.size / 1024).toFixed(0)} KB · {dateLabel(img.uploadedAt, 'd MMM · h:mm a')}
                    </span>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => setPreviewImage(img)}
                        icon={<Eye size={12} />}
                        style={{ padding: '3px 7px', fontSize: 9 }}
                      >
                        Preview
                      </Button>
                      <a
                        href={img.dataUrl}
                        download={img.name}
                        className="btn btn-ghost btn-small"
                        style={{ padding: '3px 7px', fontSize: 9, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Download size={12} />
                        Download
                      </a>
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => removeImage(img.id, img.name)}
                        icon={<Trash2 size={12} />}
                        style={{ padding: '3px 7px', fontSize: 9, marginLeft: 'auto', color: '#BC4D52' }}
                        aria-label="Remove image"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Orthopaedic Body Region Templates & 10 Tablets Quick Loader */}
        {(department === 'orthopaedics' || consultation.bodyRegionTemplate?.region) && (
          <div
            style={{
              border: '1.5px solid #B6D8DC',
              borderRadius: 12,
              padding: 16,
              background: '#F0F8F9',
              marginBottom: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 300px' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#E2F1F0', display: 'grid', placeItems: 'center', color: '#177E89', flexShrink: 0 }}>
                  <Bone size={20} />
                </div>
                <div>
                  <strong style={{ fontSize: 15, color: 'var(--navy)', display: 'block' }}>
                    Body Region Tablets Template ({activeDef?.region})
                  </strong>
                  <span style={{ fontSize: 12.5, color: '#475569', display: 'block', marginTop: 2 }}>
                    Click a body region (e.g. Knee) to load its 10 standard tablets. Toggle Select All or uncheck unwanted tablets before adding.
                  </span>
                </div>
              </div>

              <div className="button-row" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
                <Button
                  size="small"
                  variant="secondary"
                  onClick={toggleSelectAllTemplateMeds}
                  icon={
                    activeDef?.medications && selectedTemplateMedIds.size === activeDef.medications.length ? (
                      <CheckSquare size={15} color="#177E89" />
                    ) : (
                      <Square size={15} />
                    )
                  }
                  style={{ fontSize: 13, fontWeight: 600, padding: '7px 12px', whiteSpace: 'nowrap' }}
                >
                  {activeDef?.medications && selectedTemplateMedIds.size === activeDef.medications.length
                    ? 'Deselect All'
                    : `Select All (${activeDef?.medications.length ?? 10})`}
                </Button>
                <Button
                  size="small"
                  disabled={selectedTemplateMedIds.size === 0}
                  onClick={addSelectedTemplateMeds}
                  icon={<Pill size={15} />}
                  style={{ fontSize: 13, fontWeight: 600, padding: '7px 15px', whiteSpace: 'nowrap' }}
                >
                  Add Selected ({selectedTemplateMedIds.size}) to Prescription
                </Button>
                <Button
                  size="small"
                  variant="secondary"
                  disabled={!hasPrescriptionContent && selectedTemplateMedIds.size === 0}
                  onClick={onPrint}
                  icon={<Printer size={15} />}
                  style={{ fontSize: 13, fontWeight: 600, padding: '7px 12px', whiteSpace: 'nowrap' }}
                >
                  Print Rx
                </Button>
              </div>
            </div>

            {/* Region Selector Pills */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {bodyRegionTemplates.map((item) => (
                <button
                  type="button"
                  key={item.region}
                  style={{
                    padding: '7px 15px',
                    borderRadius: 24,
                    border: activeTemplateRegion === item.region ? '1.5px solid #177E89' : '1px solid #CBD5E1',
                    background: activeTemplateRegion === item.region ? '#177E89' : '#ffffff',
                    color: activeTemplateRegion === item.region ? '#ffffff' : '#334155',
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    transition: 'all 0.15s ease',
                    boxShadow: activeTemplateRegion === item.region ? '0 2px 8px rgba(23,126,137,0.25)' : '0 1px 2px rgba(0,0,0,0.02)',
                  }}
                  onClick={() => setActiveTemplateRegion(item.region)}
                >
                  <span>{item.region}</span>
                  <span
                    style={{
                      fontSize: 11.5,
                      padding: '2px 7px',
                      borderRadius: 12,
                      background: activeTemplateRegion === item.region ? 'rgba(255,255,255,0.28)' : '#F1F5F9',
                      color: activeTemplateRegion === item.region ? '#ffffff' : '#64748B',
                      fontWeight: 700,
                    }}
                  >
                    {item.medications?.length ?? 0}
                  </span>
                </button>
              ))}
            </div>

            {/* 10 Tablets List with Checkboxes */}
            {activeDef?.medications && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: 10,
                  maxHeight: 340,
                  overflowY: 'auto',
                  paddingRight: 4,
                }}
              >
                {activeDef.medications.map((med, idx) => {
                  const isChecked = selectedTemplateMedIds.has(med.id);
                  return (
                    <label
                      key={med.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: '11px 14px',
                        borderRadius: 10,
                        background: isChecked ? '#ffffff' : '#F8FAFC',
                        border: isChecked ? '1.5px solid #177E89' : '1px solid #E2E8F0',
                        cursor: 'pointer',
                        transition: 'background 0.15s, border-color 0.15s',
                        boxShadow: isChecked ? '0 2px 6px rgba(23,126,137,0.1)' : 'none',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleTemplateMed(med.id)}
                        style={{ marginTop: 3, cursor: 'pointer', accentColor: '#177E89', width: 16, height: 16 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>#{idx + 1}</span>
                          <strong style={{ fontSize: 14, color: isChecked ? 'var(--navy)' : '#334155' }}>
                            {med.medicineName}
                          </strong>
                          {med.strength && (
                            <span
                              style={{
                                fontSize: 12,
                                color: '#334155',
                                background: '#EEF2F6',
                                padding: '2px 7px',
                                borderRadius: 5,
                                fontWeight: 600,
                              }}
                            >
                              {med.strength}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>
                          <strong>{med.dosage}</strong> · {med.frequency} · {med.duration} · {med.route}
                        </div>
                        {med.instructions && (
                          <div style={{ fontSize: 12.5, color: '#0F766E', marginTop: 3, fontStyle: 'italic', background: '#F0FDFA', padding: '2px 6px', borderRadius: 4, display: 'inline-block' }}>
                            {med.instructions}
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 18, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <strong style={{ fontSize: 13, color: 'var(--navy)', display: 'block' }}>Medications List (Doctor-entered)</strong>
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                Every medication detail is entered and approved by the doctor.
              </span>
            </div>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setAddingMed((value) => !value)}
              icon={<Plus size={14} />}
            >
              {addingMed ? 'Close entry form' : 'Add medication'}
            </Button>
          </div>

          <div className="alert-banner" style={{ marginBottom: 14 }}>
            <Pill size={15} />
            <span>No medicine, strength, dosage, route, frequency, duration, or quantity is auto-generated. The clinician is responsible for every value.</span>
          </div>

          {consultation.prescription.length ? (
            <div className="prescription-list">
              {consultation.prescription.map((item, index) => (
                <article className="prescription-item" key={item.id}>
                  <div className="prescription-item-header">
                    <strong>Medication {index + 1}</strong>
                    <Button
                      variant="ghost"
                      size="small"
                      aria-label={`Remove ${item.medicineName || 'medication'}`}
                      onClick={() => removeMed(item.id)}
                      icon={<Trash2 size={14} />}
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="form-grid three">
                    <Field
                      id={`${item.id}-medicine`}
                      label={labels.medicineName}
                      value={item.medicineName}
                      onChange={(event) => updateMed(item.id, 'medicineName', event.target.value)}
                    />
                    <Field
                      id={`${item.id}-strength`}
                      label="Strength"
                      value={item.strength}
                      onChange={(event) => updateMed(item.id, 'strength', event.target.value)}
                    />
                    <Field
                      id={`${item.id}-dosage`}
                      label="Dosage"
                      value={item.dosage}
                      onChange={(event) => updateMed(item.id, 'dosage', event.target.value)}
                    />
                    <Field
                      id={`${item.id}-route`}
                      label="Route"
                      value={item.route}
                      onChange={(event) => updateMed(item.id, 'route', event.target.value)}
                    />
                    <Field
                      id={`${item.id}-frequency`}
                      label="Frequency"
                      value={item.frequency}
                      onChange={(event) => updateMed(item.id, 'frequency', event.target.value)}
                    />
                    <Field
                      id={`${item.id}-duration`}
                      label="Duration"
                      value={item.duration}
                      onChange={(event) => updateMed(item.id, 'duration', event.target.value)}
                    />
                    <Field
                      id={`${item.id}-instructions`}
                      label="Instructions"
                      value={item.instructions}
                      onChange={(event) => updateMed(item.id, 'instructions', event.target.value)}
                      className="span-3"
                    />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            !prescriptionImages.length && (
              <EmptyState
                title="No prescription entered yet"
                message="You can either upload handwritten prescription images above or click 'Add medication' to type details manually."
                icon={<Pill size={18} />}
              />
            )
          )}

          {addingMed && (
            <form className="prescription-form" onSubmit={addMed} style={{ marginTop: 14 }}>
              <div className="form-grid three">
                <Field
                  id="rx-medicine"
                  label="Medicine name"
                  required
                  error={errors.medicineName?.message as string}
                  {...register('medicineName')}
                />
                <Field
                  id="rx-strength"
                  label="Strength"
                  required
                  placeholder="Clinician-entered"
                  error={errors.strength?.message as string}
                  {...register('strength')}
                />
                <Field
                  id="rx-dosage"
                  label="Dosage"
                  required
                  error={errors.dosage?.message as string}
                  {...register('dosage')}
                />
                <Field
                  id="rx-route"
                  label="Route"
                  required
                  error={errors.route?.message as string}
                  {...register('route')}
                />
                <Field
                  id="rx-frequency"
                  label="Frequency"
                  required
                  error={errors.frequency?.message as string}
                  {...register('frequency')}
                />
                <Field
                  id="rx-duration"
                  label="Duration"
                  required
                  error={errors.duration?.message as string}
                  {...register('duration')}
                />
                <TextAreaField
                  id="rx-instructions"
                  label="Instructions (optional)"
                  maxLength={240}
                  className="span-3"
                  {...register('instructions')}
                />
              </div>
              <Button type="submit" icon={<Plus size={14} />}>
                Add doctor-entered medication
              </Button>
            </form>
          )}
        </div>
      </Card>

      {/* Prescription Image Modal Preview */}
      <Modal
        open={Boolean(previewImage)}
        title={previewImage?.name ?? 'Prescription Image'}
        subtitle="Prescription image preview"
        onClose={() => setPreviewImage(null)}
        wide
      >
        {previewImage && (
          <div style={{ textAlign: 'center', padding: 8 }}>
            <img
              src={previewImage.dataUrl}
              alt={previewImage.name}
              style={{
                maxWidth: '100%',
                maxHeight: '75vh',
                objectFit: 'contain',
                borderRadius: 8,
                boxShadow: '0 4px 18px rgba(0,0,0,0.12)',
              }}
            />
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 10 }}>
              <a href={previewImage.dataUrl} download={previewImage.name} className="btn btn-secondary">
                <Download size={14} /> Download Original Image
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
