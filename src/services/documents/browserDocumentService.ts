import type { PatientDocument } from '../../types/domain';

const supportedMimeTypes = new Set(['image/jpeg', 'image/png', 'application/pdf']);
const maxSizeBytes = 3 * 1024 * 1024;

function readAsDataUrl(file: File): Promise<string> {
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

/** Browser-only fictional document adapter. Replace with the authorized storage API for real records. */
export async function createBrowserDemoDocument(file: File, patientId: string, category: string): Promise<PatientDocument> {
  if (!supportedMimeTypes.has(file.type)) throw new Error('Choose a JPG, JPEG, PNG, or PDF document.');
  if (file.size > maxSizeBytes) throw new Error('This demo upload is limited to 3 MB per file.');
  const dataUrl = await readAsDataUrl(file);
  return {
    id: `DOC-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    patientId,
    name: file.name,
    mimeType: file.type,
    size: file.size,
    category,
    uploadedAt: new Date().toISOString(),
    dataUrl,
  };
}
