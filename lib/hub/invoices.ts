import { formatCurrency } from "./analytics";
import type { BusinessArm, Client, Invoice, InvoiceItem, Service } from "./types";

export const invoiceStatuses: Invoice["status"][] = ["draft", "sent", "paid", "overdue", "void"];
export const documentTypes = ["general", "contract", "invoice", "statement", "report", "identity", "other"];

export function invoiceNumber() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `FLE-${stamp}-${suffix}`;
}

export function invoiceEmailText(
  invoice: Invoice,
  items: InvoiceItem[],
  client: Client,
  arm: BusinessArm | null,
  service: Service | null
) {
  const due = invoice.due_on ? new Date(invoice.due_on).toLocaleDateString() : "on receipt";
  const lines = items
    .map(
      (item) =>
        `- ${item.description}: ${item.quantity} x ${formatCurrency(Number(item.unit_price), invoice.currency)} = ${formatCurrency(Number(item.line_total), invoice.currency)}`
    )
    .join("\n");

  return `Hello ${client.name},

Please find invoice ${invoice.invoice_number} for ${invoice.title}.

Business arm: ${arm?.name ?? "Flectere"}
Service: ${service?.name ?? invoice.title}
Due: ${due}

${lines}

Subtotal: ${formatCurrency(Number(invoice.subtotal), invoice.currency)}
Tax: ${formatCurrency(Number(invoice.tax_amount), invoice.currency)}
Total: ${formatCurrency(Number(invoice.total), invoice.currency)}

${invoice.notes ? `${invoice.notes}\n\n` : ""}Regards,
Flectere`;
}

export function invoiceEmailHtml(text: string) {
  return text
    .split("\n")
    .map((line) => `<p>${line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") || "&nbsp;"}</p>`)
    .join("");
}
