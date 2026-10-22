import { createContext, useContext, useMemo, useSyncExternalStore, type PropsWithChildren } from 'react';
import { DATA_MODE } from '../repositories/mode';
import { demoRepository } from './demoRepository';

const DataContext = createContext<ReturnType<typeof useDataValue> | null>(null);
function useDataValue() {
  const state = useSyncExternalStore(demoRepository.subscribe, demoRepository.getSnapshot, demoRepository.getSnapshot);
  return useMemo(() => ({ state, repository: demoRepository, mode: DATA_MODE }), [state]);
}

export function DemoProvider({ children }: PropsWithChildren) {
  if (DATA_MODE === 'api') return <ApiModeUnavailable />;
  return <MockDataProvider>{children}</MockDataProvider>;
}

function MockDataProvider({ children }: PropsWithChildren) {
  const value = useDataValue();
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

function ApiModeUnavailable() {
  return <main className="api-mode-error" role="alert"><section className="api-mode-card"><span className="brand-mark">API</span><div className="eyebrow">Backend connection required</div><h1>API mode is not wired yet.</h1><p>No demo records have been loaded. This frontend intentionally does not fall back to fictional data while API mode is selected.</p><p>Connect and implement the backend contracts in <strong>API_INTEGRATION.md</strong>, then replace the mock provider with the real API repository.</p></section></main>;
}

export function useHospitalData() {
  const value = useContext(DataContext);
  if (!value) throw new Error('useHospitalData is available only after the demo provider is active. API mode intentionally blocks demo data.');
  return value;
}
