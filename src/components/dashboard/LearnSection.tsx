"use client";

import React, { useState } from "react";
import VideoPlayer from "@/components/learn/VideoPlayer";
import FlashcardModal from "@/components/learn/FlashcardModal";
import Scoreboard from "@/components/learn/Scoreboard";
import { useProgress } from "@/components/learn/ProgressProvider";

export default function LearnSection() {
  const { progress, completeVideo, completeFlashcard } = useProgress();
  const [openVideo, setOpenVideo] = useState(false);
  const [openFlash, setOpenFlash] = useState(false);
  const [openScore, setOpenScore] = useState(false);

  return (
    <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl flex flex-col gap-4">
        <button
          onClick={() => setOpenVideo(true)}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10"
        >
          Video
        </button>
        <button
          onClick={() => setOpenFlash(true)}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10"
        >
          Flashcards
        </button>
        <button
          onClick={() => setOpenScore(true)}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10"
        >
          Score
        </button>
      </div>

      {openVideo && (
        <VideoPlayer onClose={() => setOpenVideo(false)} onComplete={completeVideo} />
      )}
      {openFlash && (
        <FlashcardModal onClose={() => setOpenFlash(false)} onComplete={completeFlashcard} />
      )}
      {openScore && (
        <Scoreboard onClose={() => setOpenScore(false)} progress={progress} />
      )}
    </div>
  );
}
