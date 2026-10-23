import { ArrowRight, Bone, ShieldCheck, Stethoscope, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DATA_MODE } from '../../services/repositories/mode';

const roles = [
  { id: 'reception', title: 'Reception portal', text: 'Check in patients, manage the queue and billing.', icon: Users, path: '/reception/dashboard' },
  { id: 'skin', title: 'Skin doctor portal', text: 'Review appointments and work through consultations.', icon: Stethoscope, path: '/skin/dashboard' },
  { id: 'orthopaedics', title: 'Orthopaedic doctor portal', text: 'Consult patients and use body-region templates.', icon: Bone, path: '/ortho/dashboard' },
] as const;

export function LoginPage() {
  const navigate = useNavigate();
  const demoMode = DATA_MODE === 'mock';
  const enter = (role: string, path: string) => {
    if (!demoMode) return;
    sessionStorage.setItem('carehub-demo-role', role);
    navigate(path);
  };
  return <div className="login-page">
    <main className="login-panel">
      <div className="login-brand"><span className="brand-mark"><img className="brand-logo" src="/tosh-icon-circle.png" alt="TOSH Foundation" /></span><div><strong>TOSH Foundation</strong><span>Care operations · Demo workspace</span></div></div>
      <div className="eyebrow">Skin & Orthopaedics</div>
      <h1>Care, clearly<br />in motion.</h1>
      <p>A connected workspace for the people who welcome, assess and support every patient visit.</p>
      {demoMode ? <>
        <div className="hint-banner" style={{ marginBottom: 14 }}><ShieldCheck size={16} /><span>Choose a demo portal. This frontend uses fictional records and does not provide secure production authentication.</span></div>
        <div className="login-portal-list" aria-label="Demo sign-in portals">{roles.map((role) => {
          const Icon = role.icon;
          return <button type="button" key={role.id} className="login-portal" onClick={() => enter(role.id, role.path)}><span className="login-portal-icon"><Icon size={18} /></span><span className="login-portal-copy"><strong>{role.title}</strong><span>{role.text}</span></span><ArrowRight size={17} color="#64748B" /></button>;
        })}</div>
      </> : <div className="alert-banner"><ShieldCheck size={16} /><span>API mode is selected. Demo records are not loaded, and API requests do not fall back to mock data. Connect a backend using the documented API contracts to enable sign-in.</span></div>}
      <p className="login-footnote">Demonstration only · No real patient records, messages, payments, or clinical guidance are generated.</p>
    </main>
    <aside className="login-photo" aria-label="Clinic interior"><img src="/images/clinic-sidebar.jpeg" alt="Bright contemporary clinic waiting room" onError={(event) => { event.currentTarget.style.display = 'none'; }} /><div className="login-photo-copy"><span>One shared care journey</span><h2>From first hello to follow-up.</h2><p>Keep the details of every visit in view, with calm tools for the front desk and the clinical team.</p></div></aside>
  </div>;
}
