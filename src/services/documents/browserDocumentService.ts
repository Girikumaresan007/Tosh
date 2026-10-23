import type { PatientDocument, PrescriptionImage } from '../../types/domain';

const maxSizeBytes = 25 * 1024 * 1024;

export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read this file in the browser.'));
    reader.onload = () => {
      if (typeof reader.result !== 'string') reject(new Error('The selected file could not be previewed.'));
      else resolve(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/** Check if file is any supported image format */
export function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  return /\.(jpg|jpeg|png|webp|avif|gif|bmp|svg|tiff|ico|heic|heif)$/i.test(file.name);
}

/** Browser-only fictional document adapter. */
export async function createBrowserDemoDocument(
  file: File,
  patientId: string,
  category: string,
  customName?: string
): Promise<PatientDocument> {
  if (file.size > maxSizeBytes) {
    throw new Error('This file exceeds the 25 MB demo size limit.');
  }
  const dataUrl = await readAsDataUrl(file);
  const resolvedName = customName?.trim() || file.name;
  return {
    id: `DOC-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    patientId,
    name: resolvedName,
    mimeType: file.type || (isImageFile(file) ? 'image/jpeg' : 'application/octet-stream'),
    size: file.size,
    category: category || 'Other',
    uploadedAt: new Date().toISOString(),
    dataUrl,
  };
}

/** Browser-only helper for prescription images in any format. */
export async function createPrescriptionImage(file: File, customName?: string): Promise<PrescriptionImage> {
  if (!isImageFile(file)) {
    throw new Error('Please select a valid image file (JPG, PNG, WebP, GIF, BMP, AVIF, SVG, etc.).');
  }
  if (file.size > maxSizeBytes) {
    throw new Error('Prescription image exceeds the 25 MB limit.');
  }
  const dataUrl = await readAsDataUrl(file);
  return {
    id: `RX-IMG-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: customName?.trim() || file.name,
    mimeType: file.type || 'image/jpeg',
    size: file.size,
    uploadedAt: new Date().toISOString(),
    dataUrl,
  };
}
