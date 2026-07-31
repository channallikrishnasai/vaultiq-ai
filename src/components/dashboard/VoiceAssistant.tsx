"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, Loader2 } from "lucide-react";

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface VoiceAssistantProps {
  userId: string;
  onTranscript?: (text: string) => void;
  onResponse?: (response: string) => void;
}

export default function VoiceAssistant({ userId, onTranscript, onResponse }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new (SpeechRecognition as new () => SpeechRecognition)();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = (event: { resultIndex: number; results: { length: number; [index: number]: { isFinal: boolean; 0: { transcript: string } } } }) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t;
        } else {
          interim += t;
        }
      }
      if (final) {
        setTranscript(final);
        setInterimTranscript("");
      } else {
        setInterimTranscript(interim);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (transcript) {
        processVoiceCommand(transcript);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setError("Voice recognition failed. Please try again.");
    };

    recognitionRef.current = recognition;

    return () => { recognition.abort(); };
  }, [transcript]);

  const startListening = useCallback(() => {
    setError(null);
    setTranscript("");
    setInterimTranscript("");
    try {
      recognitionRef.current?.start();
      setIsListening(true);
    } catch {
      setError("Could not start voice recognition.");
    }
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const processVoiceCommand = async (text: string) => {
    setIsProcessing(true);
    onTranscript?.(text);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, userId }),
      });

      if (res.ok) {
        const data = await res.json();
        onResponse?.(data.message);

        if ("speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(
            data.message.replace(/[📊📈💼🎯⚠️✅]/g, "").slice(0, 300),
          );
          utterance.lang = "en-IN";
          utterance.rate = 1;
          speechSynthesis.speak(utterance);
        }
      }
    } catch {
      setError("Failed to process voice command.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!supported) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm text-white/40">
        Voice assistant is not supported in this browser.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <motion.button
          onClick={isListening ? stopListening : startListening}
          disabled={isProcessing}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-full transition-all ${
            isListening
              ? "bg-red-500/20 text-red-400 border border-red-500/30"
              : isProcessing
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "bg-white/10 text-white border border-white/20 hover:bg-white/15"
          }`}
        >
          {isProcessing ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : isListening ? (
            <MicOff className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </motion.button>

        <AnimatePresence>
          {isListening && (
            <>
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: [1, 1.8 + i * 0.3],
                    opacity: [0.3, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                  className="absolute inset-0 rounded-full border border-red-400/30"
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </div>

      <div className="text-center">
        {isListening && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-white/60"
          >
            {interimTranscript || "Listening..."}
          </motion.p>
        )}
        {isProcessing && (
          <p className="text-sm text-blue-400">Processing...</p>
        )}
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
        {!isListening && !isProcessing && !error && (
          <p className="text-sm text-white/30">
            Tap to speak. Try: &quot;Show my budget&quot; or &quot;Add Reliance&quot;
          </p>
        )}
      </div>

      {transcript && (
        <div className="rounded-lg bg-white/5 px-3 py-2 text-xs text-white/50">
          <Volume2 className="mr-1 inline h-3 w-3" />
          {transcript}
        </div>
      )}
    </div>
  );
}
