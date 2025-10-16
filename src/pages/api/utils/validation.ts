import { z } from "zod";
import { jsonError } from "./error";

export const VariantSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  attributes: z.record(z.string(), z.string()), // flexible attributes
  images: z.array(z.string().url()).optional(),
});

export const ListingSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  subCategory: z.string().optional(),
  tags: z.string().optional(),
  variants: z.array(VariantSchema),
});

export function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw jsonError("Invalid request data", 400, result.error.flatten());
  }
  return result.data;
}
