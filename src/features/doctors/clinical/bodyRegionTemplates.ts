export interface BodyRegionDefinition { region: string; fields: string[]; }
export const TEMPLATE_STORAGE_KEY = 'carehub-body-region-templates-v1';
export const DEFAULT_BODY_REGION_TEMPLATES: BodyRegionDefinition[] = [
  { region: 'Knee', fields: ['Range of motion', 'Stability', 'Swelling / effusion', 'Gait / weight bearing'] },
  { region: 'Shoulder', fields: ['Range of motion', 'Strength', 'Tenderness', 'Functional movement'] },
  { region: 'Hip', fields: ['Range of motion', 'Gait', 'Tenderness', 'Functional movement'] },
  { region: 'Spine', fields: ['Region / level', 'Range of motion', 'Neurological examination', 'Tenderness'] },
  { region: 'Elbow', fields: ['Range of motion', 'Stability', 'Tenderness', 'Strength'] },
  { region: 'Wrist', fields: ['Range of motion', 'Grip / function', 'Tenderness', 'Swelling'] },
  { region: 'Ankle', fields: ['Range of motion', 'Stability', 'Swelling', 'Weight bearing'] },
  { region: 'Foot', fields: ['Location', 'Range of motion', 'Gait / weight bearing', 'Skin / soft tissue'] },
  { region: 'Other', fields: ['Location', 'Range of motion', 'Relevant findings'] },
];

export function readBodyRegionTemplates(): BodyRegionDefinition[] {
  if (typeof window === 'undefined') return DEFAULT_BODY_REGION_TEMPLATES;
  try {
    const raw = window.localStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (!raw) return DEFAULT_BODY_REGION_TEMPLATES;
    const candidate = JSON.parse(raw) as unknown;
    if (Array.isArray(candidate) && candidate.every((item) => item && typeof item.region === 'string' && Array.isArray(item.fields) && item.fields.every((field: unknown) => typeof field === 'string'))) return candidate as BodyRegionDefinition[];
  } catch { /* Use the built-in template configuration when local settings are unavailable. */ }
  return DEFAULT_BODY_REGION_TEMPLATES;
}

export function saveBodyRegionTemplates(value: BodyRegionDefinition[]) {
  if (typeof window !== 'undefined') window.localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(value));
}
