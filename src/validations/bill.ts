import { z } from "zod";

export const createBillSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be 200 characters or less"),
  amount: z.number().positive("Amount must be positive"),
  dueDate: z.coerce.date(),
  category: z.string().min(1, "Category is required").max(100, "Category must be 100 characters or less"),
});
