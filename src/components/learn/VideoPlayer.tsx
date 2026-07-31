"use client";

import { VideoPlayer as RealVideoPlayer } from "@/components/learning/VideoPlayer";

interface VideoPlayerProps {
  onClose: () => void;
  onComplete: () => void;
}

export default function VideoPlayer({ onClose, onComplete }: VideoPlayerProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
      <div className="relative w-full max-w-4xl mx-4">
        <div className="bg-zinc-900 rounded-xl p-2 border border-zinc-800 shadow-2xl">
          <RealVideoPlayer
            url="https://www.youtube.com/watch?v=WEDIj9JBTC8"
            title="How does the stock market work?"
          />
        </div>
        <div className="flex justify-end gap-3 mt-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-medium transition"
          >
            Close
          </button>
          <button
            onClick={() => {
              onComplete();
              onClose();
            }}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-lg font-medium transition shadow-lg shadow-cyan-500/20"
          >
            Mark Complete
          </button>
        </div>
      </div>
    </div>
  );
}