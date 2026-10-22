import { useEffect, useState } from 'react';
import { Database, RotateCcw, Settings2, ShieldCheck } from 'lucide-react';
import type { Department } from '../../types/domain';
import { useHospitalData } from '../../services/mock/DemoProvider';
import { useToast } from '../../components/ui/Toast';
import { money } from '../../utils/format';
import { PageHeading } from '../../components/shared/Primitives';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, SectionHeading } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';

export function SettingsPage() {
  const { state, repository, mode } = useHospitalData();
  const toast = useToast();
  const [skin, setSkin] = useState(String(state.fees.skin));
  const [ortho, setOrtho] = useState(String(state.fees.orthopaedics));
  useEffect(() => { setSkin(String(state.fees.skin)); setOrtho(String(state.fees.orthopaedics)); }, [state.fees]);
  const saveFee = (department: Department, value: string) => {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) { toast.push('Enter a fee of zero or greater.', 'error'); return; }
    try { repository.updateFee(department, amount); toast.push(`${department === 'skin' ? 'Skin' : 'Orthopaedics'} consultation fee saved for demo visits.`); }
    catch (error) { toast.push(error instanceof Error ? error.message : 'Could not save the fee.', 'error'); }
  };
  const reset = () => {
    if (!window.confirm('Reset all demo records to the original fictional sample data? This cannot be undone.')) return;
    try { repository.resetDemoData(); toast.push('Demo records have been reset to the original sample data.'); }
    catch (error) { toast.push(error instanceof Error ? error.message : 'Could not reset demo data.', 'error'); }
  };
  return <>
    <PageHeading eyebrow="Reception · Configuration" title="Settings" description="Manage demonstration settings. These controls do not configure a production hospital backend." />
    <div className="settings-layout">
      <Card><SectionHeading title="Consultation fees" subtitle="These mock fees are used when new demo visits create invoices." action={<Settings2 size={17} color="#177E89" />} /><div className="fee-editor"><div className="fee-row"><div><strong>Skin / Dermatology</strong><span>Demo fee per visit</span></div><Field id="fee-skin" label="Fee in INR" type="number" min="0" value={skin} onChange={(event) => setSkin(event.target.value)} /></div><div className="fee-row"><div><strong>Orthopaedics</strong><span>Demo fee per visit</span></div><Field id="fee-ortho" label="Fee in INR" type="number" min="0" value={ortho} onChange={(event) => setOrtho(event.target.value)} /></div><div className="button-row"><Button onClick={() => { saveFee('skin', skin); saveFee('orthopaedics', ortho); }}>Save both fees</Button><span className="field-hint">Current: {money(state.fees.skin)} / {money(state.fees.orthopaedics)}</span></div></div></Card>
      <Card><SectionHeading title="Data mode" subtitle="Environment-controlled, never auto-falls back" action={<Database size={17} color="#177E89" />} /><div className="mode-summary"><Badge tone={mode === 'mock' ? 'info' : 'warn'}>{mode === 'mock' ? 'Mock demo mode' : 'API mode'}</Badge><p>{mode === 'mock' ? 'Fictional records are shared across all three portals and saved locally in this browser for demo continuity. Reset is available below.' : 'Mock seed data is disabled. API requests use VITE_API_BASE_URL, and failures remain visible as errors rather than switching to mock records.'}</p><div className="hint-banner"><ShieldCheck size={15} /><span>Do not use real patient data in this frontend demo. Local browser storage is for fictional demo continuity only.</span></div></div></Card>
      <Card className="settings-danger"><SectionHeading title="Reset demo data" subtitle="Return patients, appointments, queue, invoices and follow-ups to their original fictional examples." action={<RotateCcw size={17} color="#B34D4D" />} /><p className="danger-copy">Reset removes local demo changes from this browser and restores the sample data. It does not affect a backend or any real patient record.</p><Button variant="danger" onClick={reset} disabled={mode !== 'mock'} icon={<RotateCcw size={14} />}>Reset demo data</Button></Card>
    </div>
  </>;
}
