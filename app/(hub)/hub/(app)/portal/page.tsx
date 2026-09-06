import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/hub/analytics";
import type {
  BusinessArm,
  Client,
  ClientDocument,
  CrmOpportunity,
  Invoice,
  InvoiceItem,
  Service,
} from "@/lib/hub/types";

// No explicit client_id filtering in any query — RLS scopes all data
// to the signed-in client automatically.
export default async function PortalPage() {
  const supabase = await createClient();

  const [
    { data: clientRow },
    { data: opportunities },
    { data: arms },
    { data: services },
    { data: invoices },
    { data: invoiceItems },
    { data: documents },
  ] = await Promise.all([
    // Client's own record — RLS "clients can read their own client row"
    supabase.from("clients").select("*").single(),
    // Won opportunities = active subscriptions
    supabase
      .from("crm_opportunities")
      .select("*")
      .eq("stage", "won")
      .order("created_at", { ascending: false }),
    // Full catalogue: active + planned arms
    supabase
      .from("business_arms")
      .select("*")
      .in("status", ["active", "planned"])
      .order("name"),
    // All active services
    supabase.from("services").select("*").eq("status", "active").order("name"),
    supabase.from("invoices").select("*").order("created_at", { ascending: false }),
    supabase.from("invoice_items").select("*"),
    supabase.from("documents").select("*").order("uploaded_at", { ascending: false }),
  ]);

  const client = clientRow as Client | null;
  const subscriptions = (opportunities ?? []) as CrmOpportunity[];
  const armList = (arms ?? []) as BusinessArm[];
  const serviceList = (services ?? []) as Service[];
  const invoiceList = (invoices ?? []) as Invoice[];
  const invoiceItemList = (invoiceItems ?? []) as InvoiceItem[];
  const documentList = (documents ?? []) as ClientDocument[];

  // Set of service IDs the client is already subscribed to
  const subscribedServiceIds = new Set(
    subscriptions.map((s) => s.service_id).filter(Boolean) as string[]
  );
  // Set of arm IDs the client is already subscribed to
  const subscribedArmIds = new Set(
    subscriptions.map((s) => s.business_arm_id).filter(Boolean) as string[]
  );

  const documentsWithUrls = await Promise.all(
    documentList.map(async (doc) => {
      const { data } = await supabase.storage
        .from("client-documents")
        .createSignedUrl(doc.storage_path, 60 * 10);
      return { ...doc, url: data?.signedUrl ?? null };
    })
  );

  return (
    <div className="space-y-14">

      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest2 text-gold">
          Client Portal
        </p>
        <h1 className="mt-2 font-display text-2xl text-fog-100">
          {client?.name ? `Welcome, ${client.name}` : "Your Portal"}
        </h1>
        <p className="mt-1 text-sm text-fog-500">
          Your active services, available products, invoices, and documents — all in one place.
        </p>
      </div>

      {/* ── My Active Subscriptions ───────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <p className="eyebrow text-fog-500">My Active Subscriptions</p>
          {subscriptions.length > 0 && (
            <span className="rounded-full bg-gold/10 px-2 py-0.5 text-xs font-medium text-gold">
              {subscriptions.length}
            </span>
          )}
        </div>

        {subscriptions.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center">
            <p className="text-sm text-fog-500">No active subscriptions yet.</p>
            <p className="mt-1 text-xs text-fog-600">
              Browse the available products below and request access to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {subscriptions.map((sub) => {
              const arm = armList.find((a) => a.id === sub.business_arm_id) ?? null;
              const service = serviceList.find((s) => s.id === sub.service_id) ?? null;
              // Per-client link takes priority, falls back to service base URL
              const launchUrl = sub.client_access_url ?? service?.access_url ?? null;

              return (
                <div
                  key={sub.id}
                  className="flex flex-col rounded-xl border border-gold/20 bg-gold/[0.03] p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs uppercase tracking-widest2 text-fog-500">
                          {arm?.name ?? "Flectēre"}
                        </span>
                        {arm && (
                          <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-fog-600">
                            {arm.sector}
                          </span>
                        )}
                      </div>
                      <h2 className="mt-1 font-display text-lg text-fog-100">
                        {service?.name ?? sub.title}
                      </h2>
                      {(service?.tagline ?? service?.description) && (
                        <p className="mt-1 text-xs text-fog-500 line-clamp-2">
                          {service?.tagline ?? service?.description}
                        </p>
                      )}
                    </div>
                    <span className="mt-1 flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Active
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/5 pt-4">
                    <p className="text-xs text-fog-600">
                      Since{" "}
                      {new Date(sub.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    {launchUrl ? (
                      <a
                        href={launchUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-ink-950 transition-colors hover:bg-gold-bright"
                      >
                        Launch
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          className="h-3.5 w-3.5"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.914 6.025a.75.75 0 0 1 1.06 0 3.5 3.5 0 0 1 0 4.95l-2 2a3.5 3.5 0 0 1-5.396-4.402.75.75 0 0 1 1.251.827 2 2 0 0 0 3.085 2.514l2-2a2 2 0 0 0 0-2.828.75.75 0 0 1 0-1.06Z"
                            clipRule="evenodd"
                          />
                          <path
                            fillRule="evenodd"
                            d="M7.086 9.975a.75.75 0 0 1-1.06 0 3.5 3.5 0 0 1 0-4.95l2-2a3.5 3.5 0 0 1 5.396 4.402.75.75 0 0 1-1.251-.827 2 2 0 0 0-3.085-2.514l-2 2a2 2 0 0 0 0 2.828.75.75 0 0 1 0 1.06Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </a>
                    ) : (
                      <span className="text-xs text-fog-600">
                        Contact us for access details
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Available Products ────────────────────────────────────── */}
      <section className="space-y-6">
        <div>
          <p className="eyebrow text-fog-500">Available Products</p>
          <p className="mt-1 text-sm text-fog-600">
            Everything Flectēre offers. Request access to any service below.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {armList.map((arm) => {
            const armServices = serviceList.filter(
              (s) => s.business_arm_id === arm.id
            );
            const isPlanned = arm.status === "planned";
            const alreadySubscribed = subscribedArmIds.has(arm.id);

            return (
              <div
                key={arm.id}
                className={[
                  "flex flex-col rounded-xl border p-5",
                  isPlanned
                    ? "border-white/5 bg-white/[0.01] opacity-70"
                    : "border-white/10 bg-white/[0.02]",
                ].join(" ")}
              >
                {/* Arm header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-base text-fog-100">{arm.name}</p>
                    <p className="mt-0.5 text-xs text-fog-500">{arm.sector}</p>
                  </div>
                  {isPlanned ? (
                    <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-xs text-fog-600">
                      Coming Soon
                    </span>
                  ) : alreadySubscribed ? (
                    <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                      Subscribed
                    </span>
                  ) : null}
                </div>

                {arm.description && (
                  <p className="mt-2 text-xs text-fog-600 line-clamp-2">
                    {arm.description}
                  </p>
                )}

                {/* Services under this arm */}
                {armServices.length > 0 && (
                  <ul className="mt-4 space-y-2 border-t border-white/5 pt-4">
                    {armServices.map((svc) => {
                      const isSubscribed = subscribedServiceIds.has(svc.id);
                      return (
                        <li
                          key={svc.id}
                          className="flex items-start justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm text-fog-200">{svc.name}</p>
                            {svc.tagline && (
                              <p className="text-xs text-fog-600 line-clamp-1">
                                {svc.tagline}
                              </p>
                            )}
                          </div>
                          {isSubscribed ? (
                            <span className="shrink-0 text-xs font-medium text-emerald-400">
                              ✓ Active
                            </span>
                          ) : isPlanned ? null : (
                            <a
                              href={`/contact?service=${arm.slug}`}
                              className="shrink-0 text-xs text-gold underline decoration-gold/30 underline-offset-4 hover:decoration-gold"
                            >
                              Request
                            </a>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {armServices.length === 0 && !isPlanned && (
                  <p className="mt-4 border-t border-white/5 pt-4 text-xs text-fog-600">
                    Services coming soon.
                  </p>
                )}

                {!isPlanned && !alreadySubscribed && (
                  <div className="mt-auto pt-4">
                    <a
                      href={`/contact?service=${arm.slug}`}
                      className="block w-full rounded-lg border border-white/10 py-2 text-center text-xs text-fog-300 transition-colors hover:border-gold/40 hover:text-gold"
                    >
                      Request Access
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Invoices ─────────────────────────────────────────────── */}
      <section>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <p className="eyebrow mb-4 text-fog-500">Invoices</p>
          <ul className="divide-y divide-white/5">
            {invoiceList.map((invoice) => {
              const firstItem = invoiceItemList.find(
                (item) => item.invoice_id === invoice.id
              );
              return (
                <li key={invoice.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-fog-100">{invoice.invoice_number}</p>
                      <p className="text-xs text-fog-500">
                        {firstItem?.description ?? invoice.title}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-fog-100">
                        {formatCurrency(invoice.total, invoice.currency)}
                      </p>
                      <p
                        className={[
                          "text-xs capitalize",
                          invoice.status === "paid"
                            ? "text-emerald-400"
                            : invoice.status === "overdue"
                              ? "text-red-400"
                              : "text-fog-500",
                        ].join(" ")}
                      >
                        {invoice.status}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
            {invoiceList.length === 0 && (
              <li className="py-3 text-sm text-fog-600">No invoices issued yet.</li>
            )}
          </ul>
        </div>
      </section>

      {/* ── Documents ────────────────────────────────────────────── */}
      <section>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <p className="eyebrow mb-4 text-fog-500">Documents</p>
          <ul className="divide-y divide-white/5">
            {documentsWithUrls.map((doc) => (
              <li key={doc.id} className="py-3">
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
                <p className="mt-0.5 text-xs text-fog-600">
                  {new Date(doc.uploaded_at).toLocaleDateString()} ·{" "}
                  <span className="capitalize">{doc.document_type}</span>
                </p>
              </li>
            ))}
            {documentsWithUrls.length === 0 && (
              <li className="py-3 text-sm text-fog-600">
                Nothing shared with you yet.
              </li>
            )}
          </ul>
        </div>
      </section>

    </div>
  );
}
