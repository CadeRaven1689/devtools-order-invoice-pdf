import { createServer } from "node:http";
import { ZodError } from "zod";
import { createInvoice, renderInvoiceHtml } from "./invoice_document.js";
import { generateInvoicePdf, InfraiError } from "./infrai_pdf.js";
import { developerOrderSchema } from "./order_contract.js";

const port = Number(process.env.PORT ?? 3000);
const apiKey = process.env.INFRAI_API_KEY;

function reply(response: import("node:http").ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/invoices") {
    reply(response, 404, { error: "Route not found" });
    return;
  }
  if (!apiKey) {
    reply(response, 503, { error: "INFRAI_API_KEY is required" });
    return;
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const order = developerOrderSchema.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    const invoice = createInvoice(order);
    const pdf = await generateInvoicePdf(apiKey, renderInvoiceHtml(invoice), `invoice-${order.orderId}`);
    reply(response, 201, { invoice, pdf });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      reply(response, 400, { error: "Invalid developer-tools order" });
      return;
    }
    if (error instanceof InfraiError) {
      reply(response, error.status >= 400 && error.status < 500 ? error.status : 502, {
        error: error.code,
        details: error.details
      });
      return;
    }
    reply(response, 500, { error: "Invoice generation failed" });
  }
});

server.listen(port, () => console.log(`Invoice service listening on http://localhost:${port}`));
