import { z } from "zod";

export const createEbookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  description: z.string().optional()
});

export const updateEbookSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").optional(),
  author: z.string().min(1, "Author cannot be empty").optional(),
  description: z.string().optional()
});

export const listEbooksQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  title: z.string().optional(),
  author: z.string().optional()
});


export type CreateEbookInput = z.infer<typeof createEbookSchema>;
export type UpdateEbookInput = z.infer<typeof updateEbookSchema>;
export type ListEbooksQuery = z.infer<typeof listEbooksQuerySchema>;