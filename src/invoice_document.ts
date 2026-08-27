import type { DeveloperOrder } from "./order_contract.js";

export type InvoiceLine = {
  reference: string;
  description: string;
  amountCents: number;
};

export type Invoice = {
  invoiceNumber: string;
  currency: string;
  customer: DeveloperOrder["customer"];
  lines: InvoiceLine[];
  totalCents: number;
  diagnostics: DeveloperOrder["diagnostics"];
};

export function createInvoice(order: DeveloperOrder): Invoice {
  const builds: InvoiceLine[] = order.buildEvents
    .filter((event) => event.state === "succeeded")
    .map((event) => ({
      reference: event.id,
      description: `Build: ${event.pipeline}`,
      amountCents: event.amountCents
    }));
  const releases: InvoiceLine[] = order.releaseOperations
    .filter((operation) => operation.state === "succeeded")
    .map((operation) => ({
      reference: operation.id,
      description: `Release: ${operation.environment}`,
      amountCents: operation.amountCents
    }));
  const lines = [...builds, ...releases];

  return {
    invoiceNumber: `INV-${order.orderId}`,
    currency: order.currency,
    customer: order.customer,
    lines,
    totalCents: lines.reduce((sum, line) => sum + line.amountCents, 0),
    diagnostics: order.diagnostics
  };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character] ?? character);
}

export function renderInvoiceHtml(invoice: Invoice): string {
  const money = new Intl.NumberFormat("en", {
    style: "currency",
    currency: invoice.currency
  });
  const rows = invoice.lines.map((line) => `
    <tr><td>${escapeHtml(line.reference)}</td><td>${escapeHtml(line.description)}</td><td>${money.format(line.amountCents / 100)}</td></tr>`).join("");
  const diagnostics = invoice.diagnostics.map((item) => `
    <li><strong>${escapeHtml(item.severity)}</strong> ${escapeHtml(item.source)}: ${escapeHtml(item.message)}</li>`).join("");

  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
body{font:14px system-ui;color:#18212b;margin:40px}h1{font-size:24px}table{width:100%;border-collapse:collapse}th,td{padding:10px;border-bottom:1px solid #ccd3da;text-align:left}th:last-child,td:last-child{text-align:right}.total{font-size:18px;text-align:right}.diagnostics{margin-top:32px;color:#46515c}
</style></head><body>
<h1>Invoice ${escapeHtml(invoice.invoiceNumber)}</h1>
<p>${escapeHtml(invoice.customer.name)} &lt;${escapeHtml(invoice.customer.email)}&gt;</p>
<table><thead><tr><th>Reference</th><th>Operation</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table>
<p class="total"><strong>Total ${money.format(invoice.totalCents / 100)}</strong></p>
<section class="diagnostics"><h2>Developer diagnostics</h2><ul>${diagnostics || "<li>No diagnostics recorded.</li>"}</ul></section>
</body></html>`;
}
