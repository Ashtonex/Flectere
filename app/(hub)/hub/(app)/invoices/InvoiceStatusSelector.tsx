"use client";

import { useTransition } from "react";
import { validateInvoiceAction } from "./actions";

export function InvoiceStatusSelector({
  invoiceId,
  clientId,
  revenueRecordId,
  currentStatus,
}: {
  invoiceId: string;
  clientId: string | null | undefined;
  revenueRecordId: string | null | undefined;
  currentStatus: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await validateInvoiceAction(formData);
        });
      }}
      className="inline-block"
    >
      <input type="hidden" name="invoice_id" value={invoiceId} />
      <input type="hidden" name="client_id" value={clientId ?? ""} />
      <input type="hidden" name="revenue_record_id" value={revenueRecordId ?? ""} />
      <select
        name="status"
        defaultValue={currentStatus}
        disabled={isPending}
        onChange={(e) => e.target.form?.requestSubmit()}
        className="text-[11px] bg-black/60 border border-white/15 rounded px-2 py-1 text-fog-200 outline-none focus:border-gold/50 cursor-pointer disabled:opacity-50 transition-opacity"
      >
        <option value="draft">Draft</option>
        <option value="sent">Sent / Pending</option>
        <option value="paid">✓ Validate & Paid</option>
        <option value="overdue">Mark Overdue</option>
        <option value="void">Void / Cancel</option>
      </select>
    </form>
  );
}
