"use client";

import { useLearningProgress } from "@/components/providers/learning-progress-provider";

export const useProgress = () => {
  const { progress, setProgress } = useLearningProgress();

  const completeVideo = () => {
    setProgress(prev => ({
      ...prev,
      videosWatched: (prev.videosWatched ?? 0) + 1,
      points: (prev.points ?? 0) + 10,
    }));
  };

  const completeFlashcard = () => {
    setProgress(prev => ({
      ...prev,
      flashcardsCompleted: (prev.flashcardsCompleted ?? 0) + 1,
      points: (prev.points ?? 0) + 5,
    }));
  };

  return { progress, completeVideo, completeFlashcard };
};

export default useProgress;
