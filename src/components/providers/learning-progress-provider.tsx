"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type LearningProgress = {
  videosWatched: number;
  flashcardsCompleted: number;
  points: number;
};

type LearningProgressContextType = {
  progress: LearningProgress;
  setProgress: React.Dispatch<React.SetStateAction<LearningProgress>>;
};

const LearningProgressContext = createContext<LearningProgressContextType | undefined>(undefined);

export const LearningProgressProvider = ({ children }: { children: ReactNode }) => {
  const [progress, setProgress] = useState<LearningProgress>({
    videosWatched: 0,
    flashcardsCompleted: 0,
    points: 0,
  });

  return (
    <LearningProgressContext.Provider value={{ progress, setProgress }}>
      {children}
    </LearningProgressContext.Provider>
  );
};

export const useLearningProgress = () => {
  const context = useContext(LearningProgressContext);
  if (!context) {
    throw new Error('useLearningProgress must be used within a LearningProgressProvider');
  }
  return context;
};

export default LearningProgressProvider;
