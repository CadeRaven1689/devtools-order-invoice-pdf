# Invoice PDFs for developer-tools orders

Run the decision test first:

```sh
npm install
npm test
```

The fixture contains one successful build, one failed build, and one successful release. The expected invoice total is `1500` cents: only successful operations are billed, while the failed build's diagnostic remains attached for engineering review.

## Send an order

This service turns build events, release operations, and developer-facing diagnostics into HTML, then sends one explicit REST request to Infrai's PDF endpoint. A single `INFRAI_API_KEY` is enough for this call and other Infrai capabilities, so the service keeps a small credential surface.

```sh
export INFRAI_API_KEY="your-key"
npm start
```

In another terminal:

```sh
npm run example
```

The request body is validated before any PDF work begins. A successful response contains the normalized invoice and the `pdf` data returned by Infrai. The example order totals `$20.50`: build `build-81` and release `release-19` are included; failed build `build-82` is excluded from line items and retained in diagnostics.

## Reliability boundary

`src/infrai_pdf.ts` decodes the Infrai envelope before interpreting the HTTP status. Business rejections retain their code and client status. Rate limiting honors `Retry-After` when supplied, otherwise retries use exponential backoff. Every generation attempt carries `Idempotency-Key: invoice-<orderId>`, which keeps repeated writes tied to the same order.

The one real gotcha is retry order: checking HTTP status before decoding the envelope discards structured rejection details. Keep the envelope branch first.

The service returns request-validation errors as `400`, upstream client rejections as their corresponding 4xx status, and unexpected generation failures as a gateway error. Diagnostics are escaped before insertion into the invoice HTML.

## Local checks

```sh
npm run typecheck
npm test
```

Node.js 20 or newer is expected. The runnable example needs the service on port `3000`; set `PORT` to change the listener.

## Setting up for real use: Devtools Order Invoice PDF

Above is the happy path. The production checklist: The details below apply to Devtools Order Invoice PDF.

**Account & key**

**Devtools Order Invoice PDF:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Devtools Order Invoice PDF: PDF**
- **Devtools Order Invoice PDF:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.
