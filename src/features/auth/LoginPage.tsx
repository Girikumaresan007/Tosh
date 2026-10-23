import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { PortalRole } from '../../types/domain';
import { useToast } from '../../components/ui/Toast';

interface RoleOption {
  id: PortalRole;
  label: string;
  emoji: string;
  email: string;
  path: string;
}

const roles: RoleOption[] = [
  {
    id: 'reception',
    label: 'Reception',
    emoji: '👩‍💼',
    email: 'reception@northstar.demo',
    path: '/reception/dashboard',
  },
  {
    id: 'skin',
    label: 'Skin',
    emoji: '🩺',
    email: 'skin@gmail.com',
    path: '/skin/dashboard',
  },
  {
    id: 'orthopaedics',
    label: 'Ortho',
    emoji: '🦴',
    email: 'ortho@gmail.com',
    path: '/ortho/dashboard',
  },
];

export function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [selectedRole, setSelectedRole] = useState<PortalRole>('reception');
  const [email, setEmail] = useState('reception@northstar.demo');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);

  const handleRoleSelect = (role: RoleOption) => {
    setSelectedRole(role.id);
    setEmail(role.email);
    setPassword('password123');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.push('Please enter your staff email or user ID.', 'error');
      return;
    }
    if (!password.trim()) {
      toast.push('Please enter your password.', 'error');
      return;
    }

    const target = roles.find((r) => r.id === selectedRole) ?? roles[0];
    sessionStorage.setItem('carehub-demo-role', target.id);
    toast.push(`Welcome! Signing in to ${target.label}…`);
    navigate(target.path);
  };

  const handleForgotPassword = () => {
    const target = roles.find((r) => r.id === selectedRole);
    toast.push(`Demo login: Use password123 with ${target?.email ?? 'staff email'}.`, 'info');
  };

  return (
    <div className="login-page">
      <main className="login-panel">
        <div className="login-brand">
          <span className="brand-mark login-brand-mark">
            <img
              className="brand-logo login-brand-logo"
              src="/tosh-icon-circle.png"
              alt="Trichy Ortho & Skin Logo"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('/images/image.png')) {
                  target.src = '/images/image.png';
                }
              }}
            />
          </span>
          <div className="login-brand-text">
            <strong>TRICHY ORTHO & SKIN</strong>
            <span>HEALTH FOUNDATION</span>
          </div>
        </div>
        <div className="eyebrow">Skin & Orthopaedics</div>
        <h1>Care, clearly<br />in motion.</h1>
        <p>A connected workspace for the people who welcome, assess and support every patient visit.</p>

        <div className="login-card">
          <div className="login-card-head">
            <div className="login-card-badge">
              <ShieldCheck size={13} />
              <span>Staff Authentication</span>
            </div>
            <h2 className="login-card-title">Sign in to your portal</h2>
            <p className="login-card-subtitle">Select your clinic role to access your assigned care workspace</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="login-role-selector">
              <label className="login-field-label">Department Role</label>
              <div className="role-pills-row" role="radiogroup" aria-label="Select staff role">
                {roles.map((role) => {
                  const isSelected = selectedRole === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      className={`role-pill-btn${isSelected ? ' active' : ''}`}
                      onClick={() => handleRoleSelect(role)}
                    >
                      <span className="role-pill-icon">{role.emoji}</span>
                      <span>{role.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="login-field-group">
              <label htmlFor="login-email" className="login-field-label">Staff Email / User ID</label>
              <div className="login-input-wrap">
                <Mail size={17} className="login-input-icon" />
                <input
                  id="login-email"
                  type="text"
                  className="login-input-field"
                  placeholder="Enter staff email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="login-field-group">
              <div className="login-password-header">
                <label htmlFor="login-password" className="login-field-label">Password</label>
                <button
                  type="button"
                  className="login-forgot-link"
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </button>
              </div>
              <div className="login-input-wrap">
                <Lock size={17} className="login-input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input-field"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-submit-btn">
              <span>Sign In to Clinic Workspace</span>
              <ArrowRight size={17} />
            </button>
          </form>
        </div>

        <p className="login-footnote">Demonstration only · No real patient records, messages, payments, or clinical guidance are generated.</p>
      </main>
      <aside className="login-photo" aria-label="Clinic interior">
        <img
          src="/images/clinic-sidebar.jpeg"
          alt="Bright contemporary clinic waiting room"
          onError={(event) => { event.currentTarget.style.display = 'none'; }}
        />
        <div className="login-photo-copy">
          <span>One shared care journey</span>
          <h2 className="login-hero-title">
            <span className="login-hero-line1">From first hello</span>
            <span className="login-hero-line2">to follow-up.</span>
          </h2>
          <p>Keep the details of every visit in view, with calm tools for the front desk and the clinical team.</p>
        </div>
      </aside>
    </div>
  );
}
