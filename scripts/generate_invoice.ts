export {};

const response = await fetch("http://localhost:3000/invoices", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    orderId: "dev-2026-0042",
    customer: { name: "Platform Team", email: "platform@example.com" },
    currency: "USD",
    buildEvents: [
      { id: "build-81", pipeline: "api-main", state: "succeeded", completedAt: "2026-08-25T07:00:00.000Z", amountCents: 1250 },
      { id: "build-82", pipeline: "api-main", state: "failed", completedAt: "2026-08-25T07:12:00.000Z", amountCents: 1250 }
    ],
    releaseOperations: [
      { id: "release-19", environment: "staging", state: "succeeded", completedAt: "2026-08-25T07:30:00.000Z", amountCents: 800 }
    ],
    diagnostics: [
      { severity: "warning", source: "build-82", message: "Typecheck stopped the build before release." }
    ]
  })
});

console.log(JSON.stringify(await response.json(), null, 2));
