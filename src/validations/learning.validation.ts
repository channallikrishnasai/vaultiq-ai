import { z } from "zod";

export const updateProgressSchema = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().min(1),
  completed: z.boolean(),
});

export const submitQuizSchema = z.object({
  courseId: z.string().min(1),
  answers: z.array(z.number().int().min(0)),
});
