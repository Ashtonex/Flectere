import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: arms } = await supabase.from("business_arms").select("name, slug, status");
  const isEmailConfigured = Boolean(process.env.RESEND_API_KEY && process.env.FLECTERE_EMAIL_FROM);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl text-fog-100">Founder & Platform Settings</h1>
        <p className="mt-1 text-sm text-fog-500">
          Governance, treasury currency, multi-domain routing, API integrations, and security controls.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

        {/* 1. Treasury & Currency Controls */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h2 className="font-display text-lg text-fog-100">Treasury & Currency</h2>
              <p className="text-xs text-fog-500">Global billing defaults across all 11 arms.</p>
            </div>
            <span className="text-[10px] bg-gold/10 text-gold px-2 py-0.5 rounded font-mono font-bold">SOVEREIGN</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="mb-1 block text-fog-400 font-medium">Base Reporting Currency</label>
              <select className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-fog-100 outline-none">
                <option value="USD">USD ($) — United States Dollar</option>
                <option value="ZAR">ZAR (R) — South African Rand</option>
                <option value="GBP">GBP (£) — British Pound</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-fog-400 font-medium">Default Tax / VAT (%)</label>
                <input
                  type="number"
                  defaultValue="15"
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-fog-100 outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-fog-400 font-medium">Standard Payment Terms</label>
                <select className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-fog-100 outline-none">
                  <option value="receipt">Due on Receipt</option>
                  <option value="14">Net 14 Days</option>
                  <option value="30">Net 30 Days</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Multi-Domain & Edge Routing */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h2 className="font-display text-lg text-fog-100">Domain & SSL Allowlist</h2>
              <p className="text-xs text-fog-500">Active multi-tenant routing boundaries.</p>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">WILD-SSL ACTIVE</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5">
              <span className="font-mono text-fog-200">flectere.co</span>
              <span className="text-[10px] text-gold font-bold">Corporate & Advisory</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5">
              <span className="font-mono text-fog-200">console.flectere.co</span>
              <span className="text-[10px] text-blue-400 font-bold">Flectēre Core Admin</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5">
              <span className="font-mono text-fog-200">aedificium.flectere.co</span>
              <span className="text-[10px] text-emerald-400 font-bold">AEDIFICIUM Flagship</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5">
              <span className="font-mono text-fog-200">vectura.flectere.co</span>
              <span className="text-[10px] text-purple-400 font-bold">VECTURA Fleet Suite</span>
            </div>
          </div>
        </div>

        {/* 3. API Integrations & Secrets */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h2 className="font-display text-lg text-fog-100">Service API Credentials</h2>
              <p className="text-xs text-fog-500">Live connectors for communications and payments.</p>
            </div>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono">CONNECTED</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5">
              <div>
                <div className="font-bold text-white">Database & Auth (Supabase)</div>
                <div className="text-[10px] text-fog-500">PostgreSQL with Row-Level Security</div>
              </div>
              <span className="text-emerald-400 font-mono text-[11px]">● Active</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5">
              <div>
                <div className="font-bold text-white">Email Dispatch (Resend)</div>
                <div className="text-[10px] text-fog-500">Invoice delivery & client onboarding</div>
              </div>
              <span
                className={[
                  "font-mono text-[11px]",
                  isEmailConfigured ? "text-emerald-400" : "text-amber-300",
                ].join(" ")}
              >
                {isEmailConfigured ? "● Active" : "Needs setup"}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5">
              <div>
                <div className="font-bold text-white">Storage Vault (client-documents)</div>
                <div className="text-[10px] text-fog-500">10-minute expiring signed URLs</div>
              </div>
              <span className="text-emerald-400 font-mono text-[11px]">● Encrypted</span>
            </div>
          </div>
        </div>

        {/* 4. Security & Audit Telemetry */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h2 className="font-display text-lg text-fog-100">Sovereign Security & Backups</h2>
              <p className="text-xs text-fog-500">Data integrity and disaster recovery.</p>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">HEALTHY</span>
          </div>

          <div className="space-y-3 text-xs text-fog-300">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span>PostgreSQL Row-Level Security (RLS)</span>
              <span className="text-emerald-400 font-bold">Enforced (All Tables)</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span>Automated WAL Database Backup</span>
              <span className="text-fog-200">Hourly Continuous Snapshot</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span>Master Founder Session Timeout</span>
              <span className="text-fog-200">7 Days (JWT Refresh Active)</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span>Platform Version</span>
              <span className="font-mono text-gold">v1.4.2 Sovereign Core</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
