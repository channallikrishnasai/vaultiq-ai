import { z } from "zod";

export const createBillSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.number().positive("Amount must be positive"),
  dueDate: z.coerce.date(),
  category: z.string().min(1, "Category is required"),
});
