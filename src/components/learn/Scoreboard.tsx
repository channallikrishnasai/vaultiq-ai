"use client";

import React from "react";

interface ScoreboardProps {
  progress: {
    videosWatched?: number;
    flashcardsCompleted?: number;
    points?: number;
  };
  onClose?: () => void;
}

export default function Scoreboard({ progress, onClose }: ScoreboardProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-glass p-6 rounded-xl shadow-xl max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4 text-gold">Scoreboard</h2>
        <p className="text-white mb-2">Videos Watched: {progress.videosWatched ?? 0}</p>
        <p className="text-white mb-2">Flashcards Completed: {progress.flashcardsCompleted ?? 0}</p>
        <p className="text-white mb-4">Total Points: {progress.points ?? 0}</p>
        <button
          onClick={onClose}
          className="bg-gold text-black px-4 py-2 rounded hover:bg-opacity-80 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}
