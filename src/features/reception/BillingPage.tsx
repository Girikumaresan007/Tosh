import { useMemo, useState } from 'react';
import { CreditCard, FileText, Printer, Search, Wallet } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { paymentSchema } from '../../schemas/forms';
import type { Invoice, Payment } from '../../types/domain';
import { useHospitalData } from '../../services/mock/DemoProvider';
import { useToast } from '../../components/ui/Toast';
import { dateLabel, getAge, money, patientInvoiceTotals } from '../../utils/format';
import { PageHeading, PatientAvatar } from '../../components/shared/Primitives';
import { Badge, statusTone } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, SectionHeading, StatCard } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Field } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';

const methods: Payment['method'][] = ['Cash', 'UPI', 'GPay', 'PhonePe', 'Card', 'Other'];

export function BillingPage() {
  const { state } = useHospitalData();
  const today = new Date().toDateString();
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');
  const [status, setStatus] = useState('all');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const rows = useMemo(() => state.invoices.map((invoice) => ({ invoice, patient: state.patients.find((person) => person.id === invoice.patientId), totals: patientInvoiceTotals(invoice) })).filter(({ invoice, patient, totals }) => {
    const matchesSearch = !search || `${invoice.id} ${patient?.fullName ?? ''} ${patient?.id ?? ''} ${patient?.phone ?? ''}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (department === 'all' || invoice.department === department) && (status === 'all' || totals.status === status);
  }).sort((a, b) => b.invoice.date.localeCompare(a.invoice.date)), [department, search, state.invoices, state.patients, status]);
  const collectionToday = state.invoices.reduce((sum, invoice) => sum + invoice.payments.filter((payment) => new Date(payment.paidAt).toDateString() === today).reduce((subtotal, payment) => subtotal + payment.amount, 0), 0);
  const openBalance = state.invoices.reduce((sum, invoice) => sum + patientInvoiceTotals(invoice).balance, 0);
  const selected = state.invoices.find((invoice) => invoice.id === selectedInvoiceId) ?? null;
  const totalValue = state.invoices.reduce((sum, invoice) => sum + patientInvoiceTotals(invoice).total, 0);
  return <>
    <PageHeading eyebrow="Reception · Finance" title="Payments & invoices" description="Configurable demo fees, transparent balances, and itemized printable records." />
    <div className="stats-grid"><StatCard label="Today's collections" value={money(collectionToday)} hint="Mock payments recorded today" icon={<Wallet size={16} />} /><StatCard label="Outstanding balance" value={money(openBalance)} hint="Across unpaid and partial invoices" icon={<CreditCard size={16} />} /><StatCard label="Invoices" value={state.invoices.length} hint="Shared visit billing records" icon={<FileText size={16} />} /><StatCard label="Invoice value" value={money(totalValue)} hint="Consultations plus added services" icon={<Wallet size={16} />} /></div>
    <Card padded={false}><div style={{ padding: '18px 20px 0' }}><SectionHeading title="Invoice register" subtitle="Doctor-added charges appear here from the same shared demo store." /></div><div className="toolbar" style={{ padding: '0 20px' }}><div className="search-field"><Search size={15} /><input aria-label="Search invoices" placeholder="Patient, ID, phone, or invoice number" value={search} onChange={(event) => setSearch(event.target.value)} /></div><select className="select-field" aria-label="Filter invoices by department" value={department} onChange={(event) => setDepartment(event.target.value)}><option value="all">All departments</option><option value="skin">Skin</option><option value="orthopaedics">Orthopaedics</option></select><select className="select-field" aria-label="Filter invoices by payment status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All payment statuses</option><option>Due</option><option>Partial</option><option>Paid</option></select><span className="result-count">{rows.length} invoices</span></div>
      {rows.length ? <><div className="table-wrap responsive-cards"><table className="data-table"><thead><tr><th>Invoice / Patient</th><th>Visit / Department</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th /></tr></thead><tbody>{rows.map(({ invoice, patient, totals }) => <tr key={invoice.id}><td><div className="patient-cell"><PatientAvatar name={patient?.fullName ?? 'Patient'} small /><div><strong>{invoice.id}</strong><span>{patient?.fullName ?? 'Patient'} · {patient?.id ?? invoice.patientId}</span></div></div></td><td>{invoice.visitLabel}<span className="table-subtext">{invoice.department === 'skin' ? 'Skin' : 'Orthopaedics'} · {dateLabel(invoice.date)}</span></td><td>{money(totals.total)}</td><td>{money(totals.paid)}</td><td><strong>{money(totals.balance)}</strong></td><td><Badge tone={statusTone(totals.status)}>{totals.status}</Badge></td><td><Button variant="secondary" size="small" onClick={() => setSelectedInvoiceId(invoice.id)}>View / pay</Button></td></tr>)}</tbody></table></div>
      <div className="patient-card-list invoice-card-list">{rows.map(({ invoice, patient, totals }) => <article className="patient-card" key={invoice.id}><div className="patient-card-head"><div className="patient-card-name"><PatientAvatar name={patient?.fullName ?? 'Patient'} /><div><strong>{patient?.fullName ?? 'Patient'}</strong><span>{invoice.id} · {invoice.department === 'skin' ? 'Skin' : 'Orthopaedics'}</span></div></div><Badge tone={statusTone(totals.status)}>{totals.status}</Badge></div><div className="patient-card-meta"><div><small>Total / Paid</small><strong>{money(totals.total)} / {money(totals.paid)}</strong></div><div><small>Balance</small><strong>{money(totals.balance)}</strong></div></div><Button variant="secondary" size="small" style={{ marginTop: 12 }} onClick={() => setSelectedInvoiceId(invoice.id)}>View invoice / record payment</Button></article>)}</div></> : <EmptyState title="No invoices match" message="Invoices are created for demo visits added to the queue. Adjust filters or add a patient visit." icon={<FileText size={18} />} />}
    </Card>
    <InvoiceModal invoice={selected} onClose={() => setSelectedInvoiceId(null)} />
  </>;
}

function InvoiceModal({ invoice, onClose }: { invoice: Invoice | null; onClose: () => void }) {
  const { state, repository } = useHospitalData();
  const toast = useToast();
  const [printKind, setPrintKind] = useState<'invoice' | 'receipt'>('invoice');
  const patient = invoice ? state.patients.find((person) => person.id === invoice.patientId) : undefined;
  const totals = invoice ? patientInvoiceTotals(invoice) : null;
  const { register, handleSubmit, formState: { errors }, reset } = useForm({ resolver: zodResolver(paymentSchema), defaultValues: { amount: totals?.balance ?? 0, method: 'Cash' as Payment['method'], transactionReference: '' } });
  const refreshForm = () => reset({ amount: totals?.balance ?? 0, method: 'Cash', transactionReference: '' });
  const pay = handleSubmit((values) => {
    if (!invoice) return;
    try { repository.recordPayment(invoice.id, { ...values, amount: Number(values.amount), transactionReference: values.transactionReference || undefined }); toast.push('Demo payment recorded; invoice balance updated.'); refreshForm(); }
    catch (error) { toast.push(error instanceof Error ? error.message : 'Could not record payment.', 'error'); }
  });
  const print = (kind: 'invoice' | 'receipt') => {
    if (kind === 'receipt' && !invoice?.payments.length) { toast.push('Record a payment before printing a receipt.', 'error'); return; }
    setPrintKind(kind); document.body.classList.add(kind === 'receipt' ? 'print-receipt' : 'print-invoice');
    window.setTimeout(() => { window.print(); document.body.classList.remove('print-receipt', 'print-invoice'); }, 60);
  };
  if (!invoice || !totals) return null;
  const latestPayment = invoice.payments[invoice.payments.length - 1];
  return <Modal open title={`Invoice ${invoice.id}`} subtitle={`${patient?.fullName ?? 'Patient'} · ${dateLabel(invoice.date)}`} onClose={onClose} wide footer={<><Button variant="secondary" onClick={() => print('invoice')} icon={<Printer size={14} />}>Print invoice</Button><Button variant="secondary" onClick={() => print('receipt')} icon={<Printer size={14} />}>Print receipt</Button></>}>
    <div className="billing-modal-grid">
      <div><InvoicePreview invoice={invoice} patient={patient} totals={totals} mode={printKind} latestPayment={latestPayment} /></div>
      <div className="payment-panel no-print"><SectionHeading title="Record a demo payment" subtitle="No payment gateway is connected." /><div className="invoice-balance-box"><span>Balance due</span><strong>{money(totals.balance)}</strong></div>{totals.balance > 0 ? <form onSubmit={pay} className="stack-sm"><Field id="payment-amount" label="Payment amount" type="number" min="1" max={totals.balance} step="1" required error={errors.amount?.message as string} {...register('amount')} /><div className="field"><label htmlFor="payment-method">Payment method</label><select id="payment-method" className="control" {...register('method')}>{methods.map((method) => <option key={method}>{method}</option>)}</select></div><Field id="transaction-reference" label="Transaction reference (optional)" placeholder="Demo reference only" {...register('transactionReference')} /><div className="button-row"><Button type="button" variant="secondary" size="small" onClick={() => reset({ amount: totals.balance, method: 'Cash', transactionReference: '' })}>Set full balance</Button><Button type="submit" size="small">Record payment</Button></div></form> : <div className="hint-banner">This demo invoice is fully paid.</div>}<hr className="divider" /><div className="payment-history"><strong>Payment history</strong>{invoice.payments.length ? invoice.payments.map((payment) => <div className="list-row" key={payment.id}><div className="list-row-main"><strong>{money(payment.amount)} · {payment.method}</strong><span>{dateLabel(payment.paidAt, 'd MMM · h:mm a')}{payment.transactionReference ? ` · ${payment.transactionReference}` : ''}</span></div></div>) : <span className="field-hint">No payments recorded yet.</span>}</div></div>
    </div>
  </Modal>;
}

function InvoicePreview({
  invoice,
  patient,
  totals,
  mode,
  latestPayment,
}: {
  invoice: Invoice;
  patient?: { fullName: string; id: string; phone: string; address: string; dateOfBirth?: string; gender?: string };
  totals: ReturnType<typeof patientInvoiceTotals>;
  mode: 'invoice' | 'receipt';
  latestPayment?: Payment;
}) {
  const receipt = mode === 'receipt';
  const doctorName = invoice.department === 'skin' ? 'Dr. Sangamitra' : 'Dr. Sundarprakash';
  const departmentName = invoice.department === 'skin' ? 'Skin & Dermatology' : 'Orthopaedics & Joint Surgery';
  const ageDisplay = patient?.dateOfBirth ? `${getAge(patient.dateOfBirth)} Yrs` : '';
  const receiptNumber = latestPayment ? `RCPT-${latestPayment.id}` : `RCPT-${invoice.id.replace('INV-', '')}`;

  return (
    <article className={`invoice-paper printable${receipt ? ' receipt-print' : ''}`}>
      {/* Hospital Official Letterhead */}
      <div className="print-letterhead print-letterhead-invoice">
        <div className="print-letterhead-top">
          <div className="print-letterhead-brand">
            <img src="/tosh-icon-circle.png" alt="TOSH Foundation Logo" className="print-letterhead-logo" />
            <div className="print-letterhead-info">
              <h1 className="print-letterhead-title">TOSH FOUNDATION</h1>
              <p className="print-letterhead-tagline">Multispeciality Hospital & Care Institute</p>
              <p className="print-letterhead-dept">Central Billing & Accounts Section · Pune</p>
            </div>
          </div>

          <div className="print-letterhead-contacts">
            <div>Plot 14, Senapati Bapat Road, Pune - 411016</div>
            <div>GSTIN: 27AABCT8921P1Z5 · PAN: AAACT8921P</div>
            <div>Phone: +91 20 6700 8000 · billing@toshfoundation.org</div>
            <div className="print-letterhead-reg">Hosp. Reg. No: MAH/PUN/HOSP/2018/4891</div>
          </div>
        </div>

        <div className="print-letterhead-bar">
          <div className="print-doc-heading">
            <h2>{receipt ? 'OFFICIAL PAYMENT RECEIPT' : 'OPD TAX INVOICE / HOSPITAL BILL'}</h2>
            <span>{receipt ? 'Payment Acknowledgement Voucher' : 'Original for Recipient · Outpatient Care'}</span>
          </div>
        </div>
      </div>

      {/* Invoice / Receipt Meta Grid */}
      <div className="invoice-parties-box">
        <div className="invoice-party-col">
          <div className="invoice-party-item">
            <span className="invoice-meta-label">Billed To (Patient Name):</span>
            <strong className="invoice-meta-val">{patient?.fullName ?? 'Patient'}</strong>
          </div>
          <div className="invoice-party-item">
            <span className="invoice-meta-label">UHID / Patient ID:</span>
            <span className="invoice-meta-val">{patient?.id ?? invoice.patientId}</span>
          </div>
          <div className="invoice-party-item">
            <span className="invoice-meta-label">Age / Gender:</span>
            <span className="invoice-meta-val">
              {ageDisplay} {patient?.gender ? `/ ${patient.gender}` : ''}
            </span>
          </div>
          <div className="invoice-party-item">
            <span className="invoice-meta-label">Contact / Phone:</span>
            <span className="invoice-meta-val">{patient?.phone || '—'}</span>
          </div>
          <div className="invoice-party-item">
            <span className="invoice-meta-label">Patient Address:</span>
            <span className="invoice-meta-val">{patient?.address || 'Pune, Maharashtra'}</span>
          </div>
        </div>

        <div className="invoice-party-col">
          <div className="invoice-party-item">
            <span className="invoice-meta-label">{receipt ? 'Receipt Voucher No:' : 'Invoice Number:'}</span>
            <strong className="invoice-meta-val">{receipt ? receiptNumber : invoice.id}</strong>
          </div>
          <div className="invoice-party-item">
            <span className="invoice-meta-label">{receipt ? 'Payment Date & Time:' : 'Invoice Date:'}</span>
            <span className="invoice-meta-val">
              {dateLabel(receipt ? (latestPayment?.paidAt ?? invoice.date) : invoice.date, 'd MMM yyyy, h:mm a')}
            </span>
          </div>
          <div className="invoice-party-item">
            <span className="invoice-meta-label">Department / Care Unit:</span>
            <span className="invoice-meta-val">{departmentName}</span>
          </div>
          <div className="invoice-party-item">
            <span className="invoice-meta-label">Consulting Clinician:</span>
            <span className="invoice-meta-val">{doctorName}</span>
          </div>
          <div className="invoice-party-item">
            <span className="invoice-meta-label">Episode / Visit Type:</span>
            <span className="invoice-meta-val">{invoice.visitLabel || 'Outpatient Consultation'}</span>
          </div>
        </div>
      </div>

      {/* Tax Invoice Table */}
      {!receipt ? (
        <div className="invoice-table-wrapper">
          <table className="invoice-table">
            <thead>
              <tr>
                <th style={{ width: '5%', textAlign: 'center' }}>#</th>
                <th style={{ width: '45%' }}>Service & Procedure Description</th>
                <th style={{ width: '15%' }}>SAC Code</th>
                <th style={{ width: '10%', textAlign: 'center' }}>Qty</th>
                <th style={{ width: '12%', textAlign: 'right' }}>Rate (₹)</th>
                <th style={{ width: '13%', textAlign: 'right' }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ textAlign: 'center' }}>1</td>
                <td>
                  <strong>Specialist Consultation Fee</strong>
                  <div className="invoice-item-sub">Consultant: {doctorName} ({departmentName})</div>
                </td>
                <td>999312</td>
                <td style={{ textAlign: 'center' }}>1</td>
                <td style={{ textAlign: 'right' }}>{money(invoice.consultationFee)}</td>
                <td style={{ textAlign: 'right' }}><strong>{money(invoice.consultationFee)}</strong></td>
              </tr>
              {invoice.charges.map((charge, idx) => (
                <tr key={charge.id}>
                  <td style={{ textAlign: 'center' }}>{idx + 2}</td>
                  <td>
                    <strong>{charge.description}</strong>
                    <div className="invoice-item-sub">Authorized by: {charge.addedBy}</div>
                  </td>
                  <td>999312</td>
                  <td style={{ textAlign: 'center' }}>1</td>
                  <td style={{ textAlign: 'right' }}>{money(charge.amount)}</td>
                  <td style={{ textAlign: 'right' }}><strong>{money(charge.amount)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Summary */}
          <div className="invoice-totals-wrapper">
            <div className="invoice-totals-table">
              <div className="invoice-total-row">
                <span>Subtotal (Gross Charges)</span>
                <strong>{money(totals.total)}</strong>
              </div>
              <div className="invoice-total-row">
                <span>Healthcare Service Tax (GST 0%)</span>
                <span>₹0.00 (Exempt)</span>
              </div>
              <div className="invoice-total-row">
                <span>Total Invoice Value</span>
                <strong>{money(totals.total)}</strong>
              </div>
              <div className="invoice-total-row print-highlight-row">
                <span>Total Amount Paid</span>
                <strong style={{ color: '#107E5B' }}>{money(totals.paid)}</strong>
              </div>
              <div className="invoice-total-row grand">
                <span>Net Balance Due</span>
                <strong style={{ color: totals.balance > 0 ? '#C0392B' : '#107E5B' }}>
                  {money(totals.balance)}
                </strong>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Payment Receipt View */
        <div className="receipt-voucher-card">
          <div className="receipt-voucher-header">
            <h3>Payment Acknowledgement Details</h3>
            <span className="receipt-voucher-status">TRANSACTION VERIFIED</span>
          </div>

          <div className="receipt-voucher-grid">
            <div className="receipt-voucher-item">
              <span>Receipt Number</span>
              <strong>{receiptNumber}</strong>
            </div>
            <div className="receipt-voucher-item">
              <span>Amount Received</span>
              <strong className="receipt-amount-highlight">{money(latestPayment?.amount ?? totals.paid)}</strong>
            </div>
            <div className="receipt-voucher-item">
              <span>Payment Mode</span>
              <strong>{latestPayment?.method ?? 'Cash'}</strong>
            </div>
            <div className="receipt-voucher-item">
              <span>Transaction Reference</span>
              <span>{latestPayment?.transactionReference || 'Counter Cash Desk'}</span>
            </div>
            <div className="receipt-voucher-item">
              <span>Payment Timestamp</span>
              <span>{dateLabel(latestPayment?.paidAt ?? invoice.date, 'd MMM yyyy, h:mm a')}</span>
            </div>
            <div className="receipt-voucher-item">
              <span>Remaining Balance</span>
              <strong style={{ color: totals.balance > 0 ? '#C0392B' : '#107E5B' }}>
                {money(totals.balance)}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Bill Footer & Signatory */}
      <div className="invoice-print-footer">
        <div className="invoice-terms-notes">
          <strong>Statutory & Billing Notes:</strong>
          <ol>
            <li>Healthcare services provided by clinical establishments are exempt from GST under Notification No. 12/2017-Central Tax (Rate).</li>
            <li>Fees once received are non-refundable. Please preserve this invoice/receipt for insurance and mediclaim reimbursement.</li>
            <li>This is a computer-generated tax invoice/receipt issued by TOSH Foundation.</li>
          </ol>
        </div>

        <div className="invoice-signatory-box">
          <div className="invoice-signatory-space">
            <div className="invoice-signatory-line" />
          </div>
          <strong>For TOSH Foundation</strong>
          <span>Authorized Billing Officer / Cashier</span>
          <small>Shivajinagar OPD Counter · Pune</small>
        </div>
      </div>
    </article>
  );
}
