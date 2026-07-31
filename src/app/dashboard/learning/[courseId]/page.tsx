import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { CourseViewerClient } from "@/components/learning/CourseViewerClient";

type Params = {
  courseId: string;
};
export default async function CoursePage(props: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await props.params;


  // Authenticate user
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/data-safe`);
  }

  // Ensure courseId is defined
  if (!courseId) {
    notFound();
  }



  // Fetch course data and user progress in parallel
  const [course, progress] = await Promise.all([
    prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    }),
    prisma.learningProgress.findMany({
      where: { userId: session!.user.id, courseId },
    }),
  ]);

  if (!course) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050505] text-white">
        <h1 className="text-3xl font-bold">Course not found</h1>
      </div>
    );
  }

  // Extract completed lesson IDs
  const completedLessonIds = progress
    .filter((p) => p.completed)
    .map((p) => p.lessonId);

  return <CourseViewerClient course={course} completedLessonIds={completedLessonIds} />;
}
