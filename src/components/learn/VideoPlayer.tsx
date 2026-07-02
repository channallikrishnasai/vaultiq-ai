"use client";

import React, { useEffect } from "react";

interface VideoPlayerProps {
  onClose: () => void;
  onComplete: () => void;
}

export default function VideoPlayer({ onClose, onComplete }: VideoPlayerProps) {
  // Simulate video completion after a short timeout for demo purposes
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose, onComplete]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-glass p-6 rounded-xl shadow-xl max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4 text-gold">Video Player</h2>
        <p className="text-white mb-4">This is a placeholder video player. In a real app, embed a video element here.</p>
        <button
          onClick={() => {
            onComplete();
            onClose();
          }}
          className="bg-gold text-black px-4 py-2 rounded hover:bg-opacity-80 transition"
        >
          Finish Video
        </button>
      </div>
    </div>
  );
}
