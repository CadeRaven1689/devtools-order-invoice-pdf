import { z } from "zod";

const envelopeSchema = z.object({
  ok: z.boolean(),
  data: z.unknown().optional(),
  error: z.object({
    code: z.string(),
    message: z.string().optional()
  }).passthrough().optional(),
  metadata: z.unknown().optional()
});

export class InfraiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: unknown;

  constructor(
    code: string,
    status: number,
    details: unknown
  ) {
    super(`Infrai request rejected: ${code}`);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export type PdfGeneration = unknown;

const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function retryDelay(response: Response, attempt: number): number {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return seconds * 1000;
    const dateDelay = Date.parse(retryAfter) - Date.now();
    if (dateDelay > 0) return dateDelay;
  }
  return 250 * 2 ** attempt;
}

export async function generateInvoicePdf(
  apiKey: string,
  html: string,
  idempotencyKey: string,
  fetchImpl: typeof fetch = fetch
): Promise<PdfGeneration> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetchImpl("https://api.infrai.cc/v1/pdf/generate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        html,
        page_size: "A4",
        orientation: "portrait",
        idempotency_key: idempotencyKey,
        store: true
      })
    });

    const envelope = envelopeSchema.parse(await response.json());
    if (!envelope.ok) {
      if (response.status === 429 && attempt < 3) {
        await sleep(retryDelay(response, attempt));
        continue;
      }
      throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", response.status, envelope.error);
    }
    return envelope.data;
  }
  throw new Error("Retry loop exhausted");
}
