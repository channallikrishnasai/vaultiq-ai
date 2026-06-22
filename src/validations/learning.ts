import { z } from "zod";

export const learningProgressSchema = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().min(1),
  completed: z.boolean(),
});

export const quizSubmitSchema = z.object({
  courseId: z.string().min(1),
  answers: z.array(
    z.object({
      questionId: z.string(),
      answerIndex: z.number().int().min(0),
    }),
  ),
});

export type LearningProgressInput = z.infer<typeof learningProgressSchema>;
export type QuizSubmitInput = z.infer<typeof quizSubmitSchema>;
