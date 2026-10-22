import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';

const LoginPage = lazy(() => import('../features/auth/LoginPage').then((module) => ({ default: module.LoginPage })));
const ReceptionDashboard = lazy(() => import('../features/reception/ReceptionDashboard').then((module) => ({ default: module.ReceptionDashboard })));
const QueuePage = lazy(() => import('../features/reception/QueuePage').then((module) => ({ default: module.QueuePage })));
const AppointmentsPage = lazy(() => import('../features/reception/AppointmentsPage').then((module) => ({ default: module.AppointmentsPage })));
const PatientDirectoryPage = lazy(() => import('../features/reception/PatientDirectoryPage').then((module) => ({ default: module.PatientDirectoryPage })));
const BillingPage = lazy(() => import('../features/reception/BillingPage').then((module) => ({ default: module.BillingPage })));
const FollowUpsPage = lazy(() => import('../features/reception/FollowUpsPage').then((module) => ({ default: module.FollowUpsPage })));
const ReportsPage = lazy(() => import('../features/reception/ReportsPage').then((module) => ({ default: module.ReportsPage })));
const SettingsPage = lazy(() => import('../features/reception/SettingsPage').then((module) => ({ default: module.SettingsPage })));
const DoctorDashboard = lazy(() => import('../features/doctors/DoctorDashboard').then((module) => ({ default: module.DoctorDashboard })));
const DoctorAppointmentsPage = lazy(() => import('../features/doctors/DoctorAppointmentsPage').then((module) => ({ default: module.DoctorAppointmentsPage })));
const DoctorPatientsPage = lazy(() => import('../features/doctors/DoctorPatientsPage').then((module) => ({ default: module.DoctorPatientsPage })));
const ClinicalWorkspace = lazy(() => import('../features/doctors/ClinicalWorkspace').then((module) => ({ default: module.ClinicalWorkspace })));
const BodyRegionTemplatesPage = lazy(() => import('../features/doctors/BodyRegionTemplatesPage').then((module) => ({ default: module.BodyRegionTemplatesPage })));
const DoctorPrescriptionsPage = lazy(() => import('../features/doctors/DoctorRecordPages').then((module) => ({ default: module.DoctorPrescriptionsPage })));
const DoctorTreatmentsPage = lazy(() => import('../features/doctors/DoctorRecordPages').then((module) => ({ default: module.DoctorTreatmentsPage })));
const DoctorHistoryPage = lazy(() => import('../features/doctors/DoctorRecordPages').then((module) => ({ default: module.DoctorHistoryPage })));

function RouteLoadingState() { return <div className="route-loading" role="status"><span className="loading-spinner" />Loading workspace…</div>; }

export function App() {
  return <Suspense fallback={<RouteLoadingState />}><Routes>
    <Route path="/" element={<LoginPage />} />
    <Route path="/reception" element={<AppShell />}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<ReceptionDashboard />} />
      <Route path="queue" element={<QueuePage />} />
      <Route path="appointments" element={<AppointmentsPage />} />
      <Route path="patients" element={<PatientDirectoryPage />} />
      <Route path="billing" element={<BillingPage />} />
      <Route path="follow-ups" element={<FollowUpsPage />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="settings" element={<SettingsPage />} />
    </Route>
    <Route path="/skin" element={<AppShell />}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DoctorDashboard department="skin" />} />
      <Route path="appointments" element={<DoctorAppointmentsPage department="skin" />} />
      <Route path="patients" element={<DoctorPatientsPage department="skin" />} />
      <Route path="consultation" element={<ClinicalWorkspace department="skin" />} />
      <Route path="consultation/:patientId" element={<ClinicalWorkspace department="skin" />} />
      <Route path="prescriptions" element={<DoctorPrescriptionsPage department="skin" />} />
      <Route path="treatments" element={<DoctorTreatmentsPage department="skin" />} />
      <Route path="follow-ups" element={<FollowUpsPage department="skin" />} />
      <Route path="history" element={<DoctorHistoryPage department="skin" />} />
    </Route>
    <Route path="/ortho" element={<AppShell />}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DoctorDashboard department="orthopaedics" />} />
      <Route path="appointments" element={<DoctorAppointmentsPage department="orthopaedics" />} />
      <Route path="patients" element={<DoctorPatientsPage department="orthopaedics" />} />
      <Route path="consultation" element={<ClinicalWorkspace department="orthopaedics" />} />
      <Route path="consultation/:patientId" element={<ClinicalWorkspace department="orthopaedics" />} />
      <Route path="templates" element={<BodyRegionTemplatesPage />} />
      <Route path="prescriptions" element={<DoctorPrescriptionsPage department="orthopaedics" />} />
      <Route path="treatments" element={<DoctorTreatmentsPage department="orthopaedics" />} />
      <Route path="follow-ups" element={<FollowUpsPage department="orthopaedics" />} />
      <Route path="history" element={<DoctorHistoryPage department="orthopaedics" />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense>;
}
