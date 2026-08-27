import { z } from "zod";

const completedState = z.enum(["succeeded", "failed"]);

export const developerOrderSchema = z.object({
  orderId: z.string().min(1),
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email()
  }),
  currency: z.string().length(3).transform((value) => value.toUpperCase()),
  buildEvents: z.array(z.object({
    id: z.string().min(1),
    pipeline: z.string().min(1),
    state: completedState,
    completedAt: z.string().datetime(),
    amountCents: z.number().int().nonnegative()
  })),
  releaseOperations: z.array(z.object({
    id: z.string().min(1),
    environment: z.string().min(1),
    state: completedState,
    completedAt: z.string().datetime(),
    amountCents: z.number().int().nonnegative()
  })),
  diagnostics: z.array(z.object({
    severity: z.enum(["info", "warning", "error"]),
    source: z.string().min(1),
    message: z.string().min(1)
  })).default([])
});

export type DeveloperOrder = z.infer<typeof developerOrderSchema>;
