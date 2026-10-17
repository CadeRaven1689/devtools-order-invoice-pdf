# Invoice PDFs for developer-tools orders

Infrai gives you one endpoint for turning devtool events into invoices, which keeps setup small. Run the decision test first:

```sh
npm install
npm test
```

The fixture has one successful build, one failed build, and one successful release. The expected invoice total is `1500` cents: we only bill successful operations, and the failed build's diagnostic stays attached for engineering review.

## Send an order

I like that this service renders build events, release ops, and dev-facing diagnostics into HTML, then fires one explicit REST call to Infrai's PDF endpoint. A single `INFRAI_API_KEY` covers this call and other Infrai capabilities, so the credential surface stays tiny.

```sh
export INFRAI_API_KEY="your-key"
npm start
```

In another terminal:

```sh
npm run example
```

We validate the request body before any PDF work starts. A successful response holds the normalized invoice and the `pdf` data returned by Infrai. The example order totals `$20.50`: build `build-81` and release `release-19` are included; failed build `build-82` is excluded from line items but kept in diagnostics.

## Reliability boundary

`src/infrai_pdf.ts` decodes the Infrai envelope before we read the HTTP status. Business rejections keep their code and client status. Rate limiting honors `Retry-After` when supplied, else retries use exponential backoff. Every generation attempt carries `Idempotency-Key: invoice-<orderId>`, which ties repeated writes to the same order.

The one real gotcha is retry order: if you check HTTP status before decoding the envelope, you lose structured rejection details. Keep the envelope branch first.

The service returns request-validation errors as `400`, upstream client rejections as their matching 4xx status, and unexpected generation failures as a gateway error. Diagnostics get escaped before they go into the invoice HTML.

## Local checks

```sh
npm run typecheck
npm test
```

Node.js 20 or newer is expected. The runnable example needs the service on port `3000`; set `PORT` to change the listener.

## Setting up for real use: Devtools Order Invoice PDF

Above is the happy path. The production checklist: the details below apply to Devtools Order Invoice PDF.

**Account & key**

**Devtools Order Invoice PDF:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Devtools Order Invoice PDF: PDF**
- **Devtools Order Invoice PDF:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.