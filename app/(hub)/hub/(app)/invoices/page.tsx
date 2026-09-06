import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/hub/analytics";
import { armName, clientName, labelize, serviceName } from "@/lib/hub/crm";
import { canSendEmail } from "@/lib/hub/email";
import type {
  BusinessArm,
  Client,
  CrmOpportunity,
  EmailMessage,
  Invoice,
  InvoiceItem,
  Service,
} from "@/lib/hub/types";
import { createInvoiceAction, markInvoicePaidAction, sendInvoiceEmailAction } from "./actions";

const inputClasses =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-fog-100 outline-none transition-colors focus:border-gold/50";
const labelClasses = "mb-1.5 block text-xs uppercase tracking-widest2 text-fog-500";
const submitClasses =
  "mt-2 rounded-lg border border-gold/50 bg-ink-900 px-4 py-2 text-sm font-medium text-gold transition-colors hover:border-gold hover:bg-gold hover:text-ink-950";

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
  ] = await Promise.all([
    supabase.from("clients").select("*").order("name"),
    supabase.from("business_arms").select("*").order("name"),
    supabase.from("services").select("*").order("name"),
    supabase.from("crm_opportunities").select("*").order("updated_at", { ascending: false }),
    supabase.from("invoices").select("*").order("created_at", { ascending: false }),
    supabase.from("invoice_items").select("*"),
    supabase.from("email_messages").select("*").order("created_at", { ascending: false }).limit(8),
  ]);

  const clientList = (clients ?? []) as Client[];
  const armList = (arms ?? []) as BusinessArm[];
  const serviceList = (services ?? []) as Service[];
  const opportunityList = (opportunities ?? []) as CrmOpportunity[];
  const invoiceList = (invoices ?? []) as Invoice[];
  const itemList = (items ?? []) as InvoiceItem[];
  const emailList = (emails ?? []) as EmailMessage[];
  const today = new Date().toISOString().slice(0, 10);

  const totals = {
    draft: invoiceList.filter((invoice) => invoice.status === "draft").length,
    sent: invoiceList.filter((invoice) => invoice.status === "sent").reduce((sum, invoice) => sum + Number(invoice.total), 0),
    paid: invoiceList.filter((invoice) => invoice.status === "paid").reduce((sum, invoice) => sum + Number(invoice.total), 0),
    overdue: invoiceList.filter((invoice) => invoice.status === "overdue").reduce((sum, invoice) => sum + Number(invoice.total), 0),
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl text-fog-100">Invoices</h1>
        <p className="mt-1 text-sm text-fog-500">
          Issue invoices, send client emails, and keep billing connected to CRM revenue.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-widest2 text-fog-500">Drafts</p>
          <p className="mt-2 font-display text-2xl text-fog-100">{totals.draft}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-widest2 text-fog-500">Sent</p>
          <p className="mt-2 font-display text-2xl text-fog-100">{formatCurrency(totals.sent)}</p>
        </div>
        <div className="rounded-xl border border-gold/25 bg-gold/5 p-5">
          <p className="text-xs uppercase tracking-widest2 text-gold">Paid</p>
          <p className="mt-2 font-display text-2xl text-fog-100">{formatCurrency(totals.paid)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-widest2 text-fog-500">Overdue</p>
          <p className="mt-2 font-display text-2xl text-fog-100">{formatCurrency(totals.overdue)}</p>
        </div>
      </div>

      {!canSendEmail() && (
        <div className="rounded-xl border border-gold/25 bg-gold/5 p-4 text-sm text-fog-300">
          Email sending is not configured yet. Invoice emails will be logged as failed until
          `RESEND_API_KEY` and `FLECTERE_EMAIL_FROM` are set.
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <h2 className="font-display text-lg text-fog-100">Create Invoice</h2>
        <form action={createInvoiceAction} className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div>
            <label className={labelClasses}>Client</label>
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
            </select>
          </div>
          <div>
            <label className={labelClasses}>Service</label>
            <select name="service_id" className={inputClasses}>
              <option value="">No service</option>
              {serviceList.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClasses}>Opportunity</label>
            <select name="opportunity_id" className={inputClasses}>
              <option value="">No opportunity</option>
              {opportunityList.map((opportunity) => (
                <option key={opportunity.id} value={opportunity.id}>
                  {opportunity.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClasses}>Title</label>
            <input name="title" required className={inputClasses} placeholder="e.g. Strategy retainer" />
          </div>
          <div>
            <label className={labelClasses}>Line Description</label>
            <input name="description" required className={inputClasses} placeholder="e.g. August advisory retainer" />
          </div>
          <div>
            <label className={labelClasses}>Quantity</label>
            <input name="quantity" type="number" step="0.01" defaultValue="1" className={inputClasses} />
          </div>
          <div>
            <label className={labelClasses}>Unit Price</label>
            <input name="unit_price" type="number" step="0.01" required className={inputClasses} />
          </div>
          <div>
            <label className={labelClasses}>Tax</label>
            <input name="tax_amount" type="number" step="0.01" defaultValue="0" className={inputClasses} />
          </div>
          <div>
            <label className={labelClasses}>Issued On</label>
            <input name="issued_on" type="date" required defaultValue={today} className={inputClasses} />
          </div>
          <div>
            <label className={labelClasses}>Due On</label>
            <input name="due_on" type="date" className={inputClasses} />
          </div>
          <div>
            <label className={labelClasses}>Category</label>
            <select name="category" className={inputClasses}>
              <option value="service_fee">Service Fee</option>
              <option value="retainer">Retainer</option>
              <option value="commission">Commission</option>
              <option value="subscription">Subscription</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="lg:col-span-3">
            <label className={labelClasses}>Notes</label>
            <textarea name="notes" rows={3} className={inputClasses} />
          </div>
          <div>
            <button type="submit" className={submitClasses} disabled={clientList.length === 0}>
              Create Invoice
            </button>
          </div>
        </form>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-widest2 text-fog-500">
            <tr>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Arm</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {invoiceList.map((invoice) => {
              const invoiceItems = itemList.filter((item) => item.invoice_id === invoice.id);
              return (
                <tr key={invoice.id}>
                  <td className="px-4 py-3">
                    <p className="text-fog-100">{invoice.invoice_number}</p>
                    <p className="text-xs text-fog-500">{invoice.title}</p>
                    {invoiceItems[0] && (
                      <p className="mt-1 text-xs text-fog-600">{invoiceItems[0].description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-fog-400">{clientName(invoice.client_id, clientList)}</td>
                  <td className="px-4 py-3 text-fog-400">{armName(invoice.business_arm_id, armList)}</td>
                  <td className="px-4 py-3 text-fog-400">{serviceName(invoice.service_id, serviceList)}</td>
                  <td className="px-4 py-3 text-fog-400">{labelize(invoice.status)}</td>
                  <td className="px-4 py-3 text-fog-200">{formatCurrency(invoice.total, invoice.currency)}</td>
                  <td className="px-4 py-3 text-fog-500">
                    {invoice.due_on ? new Date(invoice.due_on).toLocaleDateString() : "On receipt"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <form action={sendInvoiceEmailAction}>
                        <input type="hidden" name="invoice_id" value={invoice.id} />
                        <button type="submit" className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-fog-200 hover:border-gold/40 hover:text-gold">
                          Send
                        </button>
                      </form>
                      {invoice.status !== "paid" && (
                        <form action={markInvoicePaidAction}>
                          <input type="hidden" name="invoice_id" value={invoice.id} />
                          <input type="hidden" name="client_id" value={invoice.client_id} />
                          <input type="hidden" name="revenue_record_id" value={invoice.revenue_record_id ?? ""} />
                          <button type="submit" className="rounded-lg border border-gold/40 px-3 py-1.5 text-xs text-gold hover:bg-gold hover:text-ink-950">
                            Paid
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {invoiceList.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-fog-600">
                  No invoices yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <h2 className="font-display text-lg text-fog-100">Mail Log</h2>
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
