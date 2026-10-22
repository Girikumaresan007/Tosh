import { differenceInYears, format, isValid, parseISO } from 'date-fns';
import type { Department } from '../types/domain';

export const money = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
export const dateLabel = (value: string | Date, pattern = 'd MMM yyyy') => {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return isValid(date) ? format(date, pattern) : '—';
};
export const timeLabel = (value: string | Date) => dateLabel(value, 'h:mm a');
export const dateTimeLabel = (value: string | Date) => dateLabel(value, 'd MMM, h:mm a');
export const getAge = (birthDate: string) => {
  const date = parseISO(birthDate);
  return isValid(date) ? differenceInYears(new Date(), date) : undefined;
};
export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
export const departmentLabel = (department: Department) => department === 'skin' ? 'Skin & Dermatology' : 'Orthopaedics';
export const shortDepartment = (department: Department) => department === 'skin' ? 'Skin' : 'Orthopaedics';
export const localDateTimeInput = (value = new Date()) => {
  const shifted = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
};
export const patientInvoiceTotals = (invoice: { consultationFee: number; charges: { amount: number }[]; payments: { amount: number }[] }) => {
  const total = invoice.consultationFee + invoice.charges.reduce((sum, item) => sum + item.amount, 0);
  const paid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
  return { total, paid, balance: Math.max(0, total - paid), status: paid >= total ? 'Paid' as const : paid > 0 ? 'Partial' as const : 'Due' as const };
};
