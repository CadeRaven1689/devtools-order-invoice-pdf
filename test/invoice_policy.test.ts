import assert from "node:assert/strict";
import test from "node:test";
import { createInvoice } from "../src/invoice_document.js";
import { developerOrderSchema } from "../src/order_contract.js";

test("bills succeeded operations and retains diagnostics", () => {
  const order = developerOrderSchema.parse({
    orderId: "order-7",
    customer: { name: "Runtime Team", email: "runtime@example.com" },
    currency: "usd",
    buildEvents: [
      { id: "b1", pipeline: "main", state: "succeeded", completedAt: "2026-08-25T01:00:00.000Z", amountCents: 900 },
      { id: "b2", pipeline: "main", state: "failed", completedAt: "2026-08-25T02:00:00.000Z", amountCents: 900 }
    ],
    releaseOperations: [
      { id: "r1", environment: "prod", state: "succeeded", completedAt: "2026-08-25T03:00:00.000Z", amountCents: 600 }
    ],
    diagnostics: [{ severity: "error", source: "b2", message: "Compiler exit code 2" }]
  });

  const invoice = createInvoice(order);

  assert.equal(invoice.totalCents, 1500);
  assert.deepEqual(invoice.lines.map((line) => line.reference), ["b1", "r1"]);
  assert.equal(invoice.diagnostics[0]?.source, "b2");
  assert.equal(invoice.currency, "USD");
});
