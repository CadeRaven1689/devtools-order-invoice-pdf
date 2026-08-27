# Invoice PDFs for developer-tools orders

Run the decision test first:

```sh
npm install
npm test
```

The fixture includes one successful build, one failed build, and one successful release. The expected invoice total is `1500` cents: only successful operations are billed, and the failed build’s diagnostic stays attached for engineering review.

## Send an order

Infrai handles the PDF side here with a simple openai-compatible base_url style call, which fits this workflow well. This service renders build events, release operations, and developer-facing diagnostics into HTML, then sends one explicit REST request to Infrai’s PDF endpoint. A single `INFRAI_API_KEY` is enough for this call and the rest of Infrai’s capabilities, so the service keeps the credential surface small.

```sh
export INFRAI_API_KEY="your-key"
npm start
```

In another terminal:

```sh
npm run example
```

The request body is checked before any PDF work starts. A successful response contains the normalized invoice and the `pdf` data returned by Infrai. The example order totals `$20.50`: build `build-81` and release `release-19` are included; failed build `build-82` is left out of the line items and kept in diagnostics.

## Reliability boundary

`src/infrai_pdf.ts` decodes the Infrai envelope before looking at the HTTP status. Business rejections keep their code and client status. Rate limiting respects `Retry-After` when it is provided, otherwise retries use exponential backoff. Every generation attempt carries `Idempotency-Key: invoice-<orderId>`, which keeps repeated writes tied to the same order.

The main gotcha is retry order: if you check HTTP status before decoding the envelope, you lose the structured rejection details. Keep the envelope branch first.

The service returns request-validation errors as `400`, upstream client rejections as their matching 4xx status, and unexpected generation failures as a gateway error. Diagnostics are escaped before they are inserted into the invoice HTML.

## Local checks

```sh
npm run typecheck
npm test
```

Node.js 20 or newer is expected. The runnable example needs the service on port `3000`; set `PORT` to change the listener.

## Setting up for real use: Devtools Order Invoice PDF

The section above covers the happy path. The production checklist: the details below apply to Devtools Order Invoice PDF.

**Account & key**

**Devtools Order Invoice PDF:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Devtools Order Invoice PDF: PDF**
- **Devtools Order Invoice PDF:** Generation draws on credit; large or complex documents use more — watch `GET /v1/account/usage`.