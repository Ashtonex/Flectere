import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/hub/analytics";
import { armName, clientName, labelize, serviceName } from "@/lib/hub/crm";
import { canSendEmail } from "@/lib/hub/email";
import { revenueStatusToInvoiceStatus } from "@/lib/hub/invoices";
import type {
  BusinessArm,
  Client,
  CrmOpportunity,
  EmailMessage,
  Invoice,
  InvoiceItem,
  RevenueRecord,
  Service,
} from "@/lib/hub/types";
import {
  createInvoiceAction,
  uploadPaymentInvoiceAction,
  sendInvoiceEmailAction,
} from "./actions";
import { InvoiceStatusSelector } from "./InvoiceStatusSelector";

const inputClasses =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-fog-100 outline-none transition-colors focus:border-gold/50";
const labelClasses = "mb-1.5 block text-xs uppercase tracking-widest2 text-fog-500 font-medium";
const submitClasses =
  "mt-2 rounded-lg border border-gold/50 bg-gold px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-bright cursor-pointer";

export default async function InvoicesPage() {
  const supabase = await createClient();

  const [
    { data: clients },
    { data: arms },
    { data: services },
    { data: opportunities },
    { data: invoices },
    { data: items },
    { data: emails },
    { data: revenue },
  ] = await Promise.all([
    supabase.from("clients").select("*").order("name"),
    supabase.from("business_arms").select("*").order("name"),
    supabase.from("services").select("*").order("name"),
    supabase.from("crm_opportunities").select("*").order("updated_at", { ascending: false }),
    supabase.from("invoices").select("*").order("created_at", { ascending: false }),
    supabase.from("invoice_items").select("*"),
    supabase.from("email_messages").select("*").order("created_at", { ascending: false }).limit(8),
    supabase.from("revenue_records").select("*"),
  ]);

  const clientList = (clients ?? []) as Client[];
  const armList = (arms ?? []) as BusinessArm[];
  const serviceList = (services ?? []) as Service[];
  const opportunityList = (opportunities ?? []) as CrmOpportunity[];
  const rawInvoiceList = (invoices ?? []) as Invoice[];
  const itemList = (items ?? []) as InvoiceItem[];
  const emailList = (emails ?? []) as EmailMessage[];
  const revenueList = (revenue ?? []) as RevenueRecord[];
  const today = new Date().toISOString().slice(0, 10);

  // Self-healing synchronization: synthesize any revenue record that doesn't yet have an invoice
  const missingFromInvoices = revenueList.filter(
    (rev) => !rawInvoiceList.some((inv) => inv.revenue_record_id === rev.id)
  );

  const synthesizedInvoices: Invoice[] = missingFromInvoices.map((rev) => {
    const invNumMatch = rev.notes?.match(/(INV-\d{4}-\d+|FLC-[A-Z0-9-]+)/i);
    const recDate = rev.recorded_on || today;
    const recId = rev.id || "rev";
    const invNum = invNumMatch
      ? invNumMatch[1].toUpperCase()
      : `FLE-${recDate.replace(/-/g, "")}-${recId.slice(0, 4).toUpperCase()}`;
    return {
      id: `rev-${rev.id}`,
      invoice_number: invNum,
      client_id: rev.client_id ?? "",
      business_arm_id: rev.business_arm_id,
      service_id: rev.service_id,
      opportunity_id: rev.opportunity_id,
      revenue_record_id: rev.id,
      title: rev.notes || `Revenue Record (${recDate})`,
      status: revenueStatusToInvoiceStatus(rev.status),
      currency: rev.currency || "USD",
      subtotal: Number(rev.amount),
      tax_amount: 0,
      total: Number(rev.amount),
      issued_on: recDate,
      due_on: recDate,
      notes: rev.notes,
      created_at: rev.created_at || new Date().toISOString(),
      updated_at: rev.created_at || new Date().toISOString(),
    };
  });

  const invoiceList = [...rawInvoiceList, ...synthesizedInvoices].sort(
    (a, b) => new Date(b.issued_on || today).getTime() - new Date(a.issued_on || today).getTime()
  );

  const totals = {
    draft: invoiceList.filter((invoice) => invoice.status === "draft").length,
    sent: invoiceList
      .filter((invoice) => invoice.status === "sent")
      .reduce((sum, invoice) => sum + Number(invoice.total), 0),
    paid: invoiceList
      .filter((invoice) => invoice.status === "paid")
      .reduce((sum, invoice) => sum + Number(invoice.total), 0),
    overdue: invoiceList
      .filter((invoice) => invoice.status === "overdue")
      .reduce((sum, invoice) => sum + Number(invoice.total), 0),
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl md:text-3xl text-fog-100 tracking-tight">Billing & Invoices</h1>
        <p className="mt-1 text-sm text-fog-500">
          Issue automated invoices, upload third-party/client payable bills, validate payments, and sync to CRM revenue.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-widest2 text-fog-500">Draft Invoices</p>
          <p className="mt-2 font-display text-2xl text-fog-100">{totals.draft}</p>
          <p className="text-[10px] text-fog-500 font-mono mt-1">Pending issuance</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-widest2 text-fog-500">Sent & Pending</p>
          <p className="mt-2 font-display text-2xl text-fog-100">{formatCurrency(totals.sent)}</p>
          <p className="text-[10px] text-fog-500 font-mono mt-1">Awaiting client payment</p>
        </div>
        <div className="rounded-xl border border-gold/25 bg-gold/5 p-5">
          <p className="text-xs uppercase tracking-widest2 text-gold font-bold">Validated & Paid</p>
          <p className="mt-2 font-display text-2xl text-fog-100">{formatCurrency(totals.paid)}</p>
          <p className="text-[10px] text-fog-500 font-mono mt-1">Credited to revenue ledger</p>
        </div>
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-5">
          <p className="text-xs uppercase tracking-widest2 text-rose-400">Overdue</p>
          <p className="mt-2 font-display text-2xl text-rose-300">{formatCurrency(totals.overdue)}</p>
          <p className="text-[10px] text-fog-500 font-mono mt-1">Requires payment reminder</p>
        </div>
      </div>

      {!canSendEmail() && (
        <div className="rounded-xl border border-gold/25 bg-gold/5 p-4 text-xs text-fog-300">
          Email sending is not configured yet. Invoice emails will be logged as failed until
          `RESEND_API_KEY` and `FLECTERE_EMAIL_FROM` are set in production environment variables.
        </div>
      )}

      {/* Two Primary Action Panels: Generate Invoice vs Upload Payment Invoice */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Panel 1: Generate Standard Invoice */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
          <div>
            <h2 className="font-display text-lg text-fog-100">Issue Flectēre Invoice</h2>
            <p className="text-xs text-fog-500">Generate a branded client invoice linked to arm and service.</p>
          </div>
          <form action={createInvoiceAction} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Client *</label>
                <select name="client_id" required className={inputClasses}>
                  <option value="">Select client</option>
                  {clientList.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Business Arm</label>
                <select name="business_arm_id" className={inputClasses}>
                  <option value="">No arm</option>
                  {armList.map((arm) => (
                    <option key={arm.id} value={arm.id}>
                      {arm.name}
                    </option>
                  ))}
                  {!armList.some((a) => a.name.toLowerCase() === "custom") && (
                    <option value="custom">Custom</option>
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Service Offering</label>
                <select name="service_id" className={inputClasses}>
                  <option value="">No service</option>
                  {serviceList.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                  {!serviceList.some((s) => s.name.toLowerCase() === "custom") && (
                    <option value="custom">Custom</option>
                  )}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Link Opportunity / Deal</label>
                <select name="opportunity_id" className={inputClasses}>
                  <option value="">No opportunity</option>
                  {opportunityList.map((opportunity) => (
                    <option key={opportunity.id} value={opportunity.id}>
                      {opportunity.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClasses}>Invoice Title *</label>
              <input name="title" required className={inputClasses} placeholder="e.g. Infrastructure Modernization Retainer" />
            </div>

            <div>
              <label className={labelClasses}>Line Item Description *</label>
              <input name="description" required className={inputClasses} placeholder="e.g. Monthly systems audit & optimization" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClasses}>Quantity</label>
                <input name="quantity" type="number" step="0.01" defaultValue="1" className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Unit Price ($) *</label>
                <input name="unit_price" type="number" step="0.01" required className={inputClasses} placeholder="e.g. 3500" />
              </div>
              <div>
                <label className={labelClasses}>Tax ($)</label>
                <input name="tax_amount" type="number" step="0.01" defaultValue="0" className={inputClasses} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Issue Date *</label>
                <input name="issued_on" type="date" required defaultValue={today} className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Due Date</label>
                <input name="due_on" type="date" className={inputClasses} />
              </div>
            </div>

            <button type="submit" className={submitClasses}>
              Generate & Issue Invoice
            </button>
          </form>
        </div>

        {/* Panel 2: Upload Payment / Payable Invoice & Validate */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
          <div>
            <h2 className="font-display text-lg text-fog-100">Upload & Validate Client Bill</h2>
            <p className="text-xs text-fog-500">
              Attach client-supplied PDF or vendor invoice, validate amount, and record to recovery metrics.
            </p>
          </div>

          <form action={uploadPaymentInvoiceAction} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClasses}>Client *</label>
                <select name="client_id" required className={inputClasses}>
                  <option value="">Select client</option>
                  {clientList.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Business Arm</label>
                <select name="business_arm_id" className={inputClasses}>
                  <option value="">No arm</option>
                  {armList.map((arm) => (
                    <option key={arm.id} value={arm.id}>
                      {arm.name}
                    </option>
                  ))}
                  {!armList.some((a) => a.name.toLowerCase() === "custom") && (
                    <option value="custom">Custom</option>
                  )}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Service Offering</label>
                <select name="service_id" className={inputClasses}>
                  <option value="">No service</option>
                  {serviceList.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                  {!serviceList.some((s) => s.name.toLowerCase() === "custom") && (
                    <option value="custom">Custom</option>
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Invoice Label / Title *</label>
                <input name="title" required className={inputClasses} placeholder="e.g. Client Milestone 1 Invoice" />
              </div>
              <div>
                <label className={labelClasses}>Payable Amount ($) *</label>
                <input name="amount" type="number" step="0.01" required className={inputClasses} placeholder="e.g. 7500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Link Opportunity (Tracks Recovery)</label>
                <select name="opportunity_id" className={inputClasses}>
                  <option value="">No opportunity linked</option>
                  {opportunityList.map((opp) => (
                    <option key={opp.id} value={opp.id}>
                      {opp.title} ({formatCurrency(Number(opp.value ?? 0))})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Due Date</label>
                <input name="due_on" type="date" className={inputClasses} />
              </div>
            </div>

            <div>
              <label className={labelClasses}>Upload Invoice File (PDF, DOCX, PNG) *</label>
              <input
                name="file"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                className="block w-full text-xs text-fog-300 file:mr-3 file:rounded-lg file:border file:border-white/10 file:bg-white/[0.05] file:px-3 file:py-1.5 file:text-xs file:text-fog-200"
              />
            </div>

            <div>
              <label className={labelClasses}>Verification Notes & Terms</label>
              <textarea
                name="notes"
                rows={2}
                className={inputClasses}
                placeholder="Proof of execution, contract milestone details..."
              />
            </div>

            <button
              type="submit"
              className="mt-2 rounded-lg border border-emerald-500/50 bg-emerald-500 px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-emerald-400 cursor-pointer"
            >
              Upload & Record Invoice
            </button>
          </form>
        </div>
      </div>

      {/* Comprehensive Invoices Table with Validation Controls */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-widest2 text-fog-500">
            <tr>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Arm</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Total Amount</th>
              <th className="px-4 py-3">Due Date</th>
              <th className="px-4 py-3">Validation & Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {invoiceList.map((invoice) => {
              const invoiceItems = itemList.filter((item) => item.invoice_id === invoice.id);
              return (
                <tr key={invoice.id} className="hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3">
                    <p className="text-fog-100 font-mono font-medium">{invoice.invoice_number}</p>
                    <p className="text-xs text-fog-400">{invoice.title}</p>
                    {invoiceItems[0] && (
                      <p className="mt-0.5 text-[11px] text-fog-500">{invoiceItems[0].description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-fog-300 font-medium">
                    {clientName(invoice.client_id, clientList)}
                  </td>
                  <td className="px-4 py-3 text-fog-400">{armName(invoice.business_arm_id, armList)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        invoice.status === "paid"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : invoice.status === "sent"
                          ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                          : invoice.status === "overdue"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : "bg-white/5 text-fog-400 border border-white/10"
                      }`}
                    >
                      {labelize(invoice.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-white">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </td>
                  <td className="px-4 py-3 text-fog-400 text-xs">
                    {invoice.due_on && !isNaN(new Date(invoice.due_on).getTime())
                      ? new Date(invoice.due_on).toLocaleDateString()
                      : "On receipt"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Status Validation Selector */}
                      <InvoiceStatusSelector
                        invoiceId={invoice.id}
                        clientId={invoice.client_id}
                        revenueRecordId={invoice.revenue_record_id}
                        currentStatus={invoice.status}
                      />

                      {/* Email Send button */}
                      <form action={sendInvoiceEmailAction} className="inline-block">
                        <input type="hidden" name="invoice_id" value={invoice.id} />
                        <button
                          type="submit"
                          className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-fog-300 hover:border-gold/40 hover:text-gold cursor-pointer"
                        >
                          Email
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {invoiceList.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-fog-600">
                  No invoices generated or uploaded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Email Log */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <h2 className="font-display text-lg text-fog-100">Mail & Delivery Log</h2>
        <ul className="mt-4 divide-y divide-white/5">
          {emailList.map((email) => (
            <li key={email.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-fog-100">{email.subject}</p>
                <span className="text-xs text-fog-500">{labelize(email.status)}</span>
              </div>
              <p className="mt-1 text-xs text-fog-500">
                To {email.to_email} · {new Date(email.created_at).toLocaleString()}
              </p>
              {email.error_message && <p className="mt-1 text-xs text-red-400">{email.error_message}</p>}
            </li>
          ))}
          {emailList.length === 0 && (
            <li className="py-3 text-sm text-fog-600">No invoice emails sent yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
