import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  computeAccountAnalytics,
  computePortfolioTotals,
  formatCurrency,
  formatPercent,
} from "@/lib/hub/analytics";
import type {
  Client,
  ClientDocument,
  Expense,
  PerformanceEntry,
  TradingAccount,
  Withdrawal,
} from "@/lib/hub/types";
import {
  addWithdrawalAction,
  deleteDocumentAction,
  updateClientAction,
  uploadDocumentAction,
} from "../actions";

const inputClasses =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-fog-100 outline-none transition-colors focus:border-gold/50";
const labelClasses = "mb-1.5 block text-xs uppercase tracking-widest2 text-fog-500";
const submitClasses =
  "mt-2 rounded-lg border border-gold/50 bg-ink-900 px-4 py-2 text-sm font-medium text-gold transition-colors hover:border-gold hover:bg-gold hover:text-ink-950";

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!client) notFound();

  const [
    { data: accounts },
    { data: entries },
    { data: expenses },
    { data: withdrawals },
    { data: documents },
  ] = await Promise.all([
    supabase.from("trading_accounts").select("*").eq("client_id", params.id),
    supabase.from("performance_entries").select("*"),
    supabase.from("expenses").select("*"),
    supabase.from("withdrawals").select("*"),
    supabase.from("documents").select("*").eq("client_id", params.id).order("uploaded_at", { ascending: false }),
  ]);

  const accountList = (accounts ?? []) as TradingAccount[];
  const entryList = (entries ?? []) as PerformanceEntry[];
  const expenseList = (expenses ?? []) as Expense[];
  const withdrawalList = (withdrawals ?? []) as Withdrawal[];
  const documentList = (documents ?? []) as ClientDocument[];

  const analytics = accountList.map((account) =>
    computeAccountAnalytics(
      account,
      entryList.filter((e) => e.account_id === account.id),
      expenseList.filter((e) => e.account_id === account.id),
      withdrawalList.filter((w) => w.account_id === account.id)
    )
  );
  const totals = computePortfolioTotals(analytics);

  const documentsWithUrls = await Promise.all(
    documentList.map(async (doc) => {
      const { data } = await supabase.storage
        .from("client-documents")
        .createSignedUrl(doc.storage_path, 60 * 10);
      return { ...doc, url: data?.signedUrl ?? null };
    })
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl text-fog-100">{(client as Client).name}</h1>
        <p className="mt-1 text-sm text-fog-500">Client profile, accounts, and documents.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-widest2 text-fog-500">Total Value</p>
          <p className="mt-2 font-display text-xl text-fog-100">{formatCurrency(totals.totalValue)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-widest2 text-fog-500">Total Spend</p>
          <p className="mt-2 font-display text-xl text-fog-100">{formatCurrency(totals.totalSpend)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-widest2 text-fog-500">Extracted</p>
          <p className="mt-2 font-display text-xl text-fog-100">{formatCurrency(totals.totalExtracted)}</p>
        </div>
        <div className="rounded-xl border border-gold/25 bg-gold/5 p-5">
          <p className="text-xs uppercase tracking-widest2 text-gold">ROI</p>
          <p className="mt-2 font-display text-xl text-fog-100">{formatPercent(totals.roi)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-display text-lg text-fog-100">Contact Info</h2>
          <form action={updateClientAction} className="mt-4 space-y-4">
            <input type="hidden" name="id" value={(client as Client).id} />
            <div>
              <label className={labelClasses}>Name</label>
              <input name="name" required defaultValue={(client as Client).name} className={inputClasses} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Email</label>
                <input
                  name="contact_email"
                  type="email"
                  defaultValue={(client as Client).contact_email ?? ""}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Phone</label>
                <input
                  name="phone"
                  type="tel"
                  defaultValue={(client as Client).phone ?? ""}
                  className={inputClasses}
                  placeholder="+1 555 123 4567"
                />
              </div>
            </div>
            <div>
              <label className={labelClasses}>Notes</label>
              <textarea
                name="notes"
                rows={4}
                defaultValue={(client as Client).notes ?? ""}
                className={inputClasses}
              />
            </div>
            <button type="submit" className={submitClasses}>
              Save
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-display text-lg text-fog-100">Record a Withdrawal</h2>
          <p className="mt-1 text-xs text-fog-500">
            Money paid out of one of this client&apos;s accounts — payouts, profit splits, live
            withdrawals. This is what &quot;extracted value&quot; is built from.
          </p>
          <form action={addWithdrawalAction} className="mt-4 space-y-4">
            <input type="hidden" name="client_id" value={(client as Client).id} />
            <div>
              <label className={labelClasses}>Account</label>
              <select name="account_id" required className={inputClasses}>
                {accountList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Amount</label>
                <input name="amount" type="number" step="0.01" required className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Date</label>
                <input name="withdrawn_on" type="date" required className={inputClasses} />
              </div>
            </div>
            <button type="submit" className={submitClasses} disabled={accountList.length === 0}>
              Record Withdrawal
            </button>
            {accountList.length === 0 && (
              <p className="text-xs text-fog-600">Add an account for this client first, from Trading.</p>
            )}
          </form>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-widest2 text-fog-500">
            <tr>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Equity</th>
              <th className="px-4 py-3">Extracted</th>
              <th className="px-4 py-3">Total Value</th>
              <th className="px-4 py-3">ROI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {accountList.map((account) => {
              const a = analytics.find((x) => x.accountId === account.id)!;
              return (
                <tr key={account.id}>
                  <td className="px-4 py-3 text-fog-100">{account.label}</td>
                  <td className="px-4 py-3 capitalize text-fog-400">{account.account_type}</td>
                  <td className="px-4 py-3 text-fog-400">
                    {formatCurrency(a.latestEquity ?? a.latestBalance)}
                  </td>
                  <td className="px-4 py-3 text-fog-400">{formatCurrency(a.extractedValue)}</td>
                  <td className="px-4 py-3 text-fog-200">{formatCurrency(a.totalValue)}</td>
                  <td className="px-4 py-3 text-fog-200">{formatPercent(a.roi)}</td>
                </tr>
              );
            })}
            {accountList.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-fog-600">
                  No accounts linked to this client yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <h2 className="font-display text-lg text-fog-100">Documents</h2>
        <ul className="mt-4 divide-y divide-white/5">
          {documentsWithUrls.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-4 py-3">
              <div>
                {doc.url ? (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-fog-100 underline decoration-white/20 underline-offset-4 hover:text-gold"
                  >
                    {doc.label}
                  </a>
                ) : (
                  <span className="text-sm text-fog-400">{doc.label}</span>
                )}
                <p className="text-xs text-fog-600">
                  {new Date(doc.uploaded_at).toLocaleDateString()}
                </p>
              </div>
              <form action={deleteDocumentAction}>
                <input type="hidden" name="id" value={doc.id} />
                <input type="hidden" name="storage_path" value={doc.storage_path} />
                <input type="hidden" name="client_id" value={(client as Client).id} />
                <button type="submit" className="text-xs text-fog-500 hover:text-red-400">
                  Remove
                </button>
              </form>
            </li>
          ))}
          {documentsWithUrls.length === 0 && (
            <li className="py-3 text-sm text-fog-600">No documents uploaded yet.</li>
          )}
        </ul>

        <form action={uploadDocumentAction} className="mt-6 flex flex-wrap items-end gap-4 border-t border-white/10 pt-6">
          <input type="hidden" name="client_id" value={(client as Client).id} />
          <div className="flex-1">
            <label className={labelClasses}>Label</label>
            <input name="label" required className={inputClasses} placeholder="e.g. Signed agreement" />
          </div>
          <div className="flex-1">
            <label className={labelClasses}>File</label>
            <input
              name="file"
              type="file"
              required
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
              className="block w-full text-sm text-fog-300 file:mr-3 file:rounded-lg file:border file:border-white/10 file:bg-white/[0.03] file:px-3 file:py-1.5 file:text-sm file:text-fog-200"
            />
          </div>
          <button type="submit" className={submitClasses}>
            Upload
          </button>
        </form>
      </div>
    </div>
  );
}
