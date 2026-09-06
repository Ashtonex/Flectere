import { createClient } from "@/lib/supabase/server";
import type {
  Expense,
  PerformanceEntry,
  TradingAccount,
  Withdrawal,
} from "@/lib/hub/types";
import { PropTradingClient } from "./PropTradingClient";

export const metadata = {
  title: "ATMcap Trading Desk | Proprietary Capital & Prop Firms",
  description:
    "Live cockpit for proprietary trading evaluations, funded accounts, and personal live capital extraction.",
};

export default async function TradingPage() {
  const supabase = await createClient();

  const [
    { data: accounts },
    { data: entries },
    { data: expenses },
    { data: withdrawals },
  ] = await Promise.all([
    supabase
      .from("trading_accounts")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("performance_entries")
      .select("*")
      .order("entry_date", { ascending: false }),
    supabase
      .from("expenses")
      .select("*")
      .order("incurred_on", { ascending: false }),
    supabase
      .from("withdrawals")
      .select("*")
      .order("withdrawn_on", { ascending: false }),
  ]);

  const accountList = (accounts ?? []) as TradingAccount[];
  const entryList = (entries ?? []) as PerformanceEntry[];
  const expenseList = (expenses ?? []) as Expense[];
  const withdrawalList = (withdrawals ?? []) as Withdrawal[];

  return (
    <div className="w-full space-y-6">
      <PropTradingClient
        accounts={accountList}
        entries={entryList}
        expenses={expenseList}
        withdrawals={withdrawalList}
      />
    </div>
  );
}

