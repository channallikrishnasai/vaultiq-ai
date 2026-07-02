"use client";

import React, { useEffect } from "react";

interface FlashcardModalProps {
  onClose: () => void;
  onComplete: () => void;
}

export default function FlashcardModal({ onClose, onComplete }: FlashcardModalProps) {
  // Simulate completing the flashcard after a short delay for demo purposes
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
      onClose();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onClose, onComplete]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-glass p-6 rounded-xl shadow-xl max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4 text-gold">Flashcard Challenge</h2>
        <p className="text-white mb-6">
          This is a placeholder flashcard modal. In a real implementation, you'd display a question and answer options.
        </p>
        <button
          onClick={() => {
            onComplete();
            onClose();
          }}
          className="bg-gold text-black px-4 py-2 rounded hover:bg-opacity-80 transition"
        >
          Complete
        </button>
      </div>
    </div>
  );
}
