import { logger } from "@/lib/logger";
import type { VoiceConfig, VoiceTranscript, VoiceResponse } from "@/types/financial-hub";

const TAG = "VoiceService";

export interface VoiceServiceConfig extends VoiceConfig {
  wakeWord?: string;
  silenceTimeout?: number;
  maxRecordingLength?: number;
}

const DEFAULT_CONFIG: VoiceServiceConfig = {
  language: "en-IN",
  continuous: true,
  interimResults: true,
  maxAlternatives: 3,
  wakeWord: "hey vaultiq",
  silenceTimeout: 5000,
  maxRecordingLength: 60000,
};

export interface StreamingTranscript {
  text: string;
  confidence: number;
  isFinal: boolean;
  timestamp: string;
  speaker?: "user" | "assistant";
}

export interface VoiceConversationTurn {
  id: string;
  role: "user" | "assistant";
  content: string;
  audioUrl?: string;
  timestamp: string;
  transcript?: VoiceTranscript;
}

export interface VoiceConversationSession {
  id: string;
  userId: string;
  turns: VoiceConversationTurn[];
  startedAt: string;
  lastActiveAt: string;
  isActive: boolean;
}

class VoiceServiceImpl {
  private sessions = new Map<string, VoiceConversationSession>();
  private transcriptionQueue = new Map<string, StreamingTranscript[]>();

  getConfig(overrides?: Partial<VoiceServiceConfig>): VoiceServiceConfig {
    return { ...DEFAULT_CONFIG, ...overrides };
  }

  createSession(userId: string): VoiceConversationSession {
    const session: VoiceConversationSession = {
      id: `voice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId,
      turns: [],
      startedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      isActive: true,
    };
    this.sessions.set(session.id, session);
    logger.info(TAG, `Created voice session ${session.id} for user ${userId}`);
    return session;
  }

  getSession(sessionId: string): VoiceConversationSession | undefined {
    return this.sessions.get(sessionId);
  }

  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.transcriptionQueue.delete(sessionId);
      logger.info(TAG, `Ended voice session ${sessionId}`);
    }
  }

  addTurn(
    sessionId: string,
    role: "user" | "assistant",
    content: string,
    audioUrl?: string,
    transcript?: VoiceTranscript,
  ): VoiceConversationTurn | null {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) return null;

    const turn: VoiceConversationTurn = {
      id: `turn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      role,
      content,
      audioUrl,
      timestamp: new Date().toISOString(),
      transcript,
    };

    session.turns.push(turn);
    session.lastActiveAt = turn.timestamp;
    return turn;
  }

  processStreamingTranscript(
    sessionId: string,
    rawText: string,
    confidence: number,
    isFinal: boolean,
  ): StreamingTranscript {
    const transcript: StreamingTranscript = {
      text: rawText,
      confidence,
      isFinal,
      timestamp: new Date().toISOString(),
      speaker: "user",
    };

    if (!this.transcriptionQueue.has(sessionId)) {
      this.transcriptionQueue.set(sessionId, []);
    }
    this.transcriptionQueue.get(sessionId)!.push(transcript);

    if (isFinal) {
      const queue = this.transcriptionQueue.get(sessionId) ?? [];
      this.transcriptionQueue.set(sessionId, queue.filter((t) => !t.isFinal));
    }

    return transcript;
  }

  detectWakeWord(text: string): boolean {
    const lower = text.toLowerCase().trim();
    const wakeWords = ["hey vaultiq", "ok vaultiq", "vaultiq", "hey vault"];
    return wakeWords.some((w) => lower.startsWith(w));
  }

  stripWakeWord(text: string): string {
    const lower = text.toLowerCase().trim();
    const wakeWords = ["hey vaultiq", "ok vaultiq", "vaultiq", "hey vault"];
    for (const w of wakeWords) {
      if (lower.startsWith(w)) {
        return text.slice(w.length).trim();
      }
    }
    return text;
  }

  formatTTSResponse(text: string): { ssml: string; plainText: string } {
    const plainText = text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\n+/g, ". ")
      .replace(/[📊📈💼🎯⚠️✅]/g, "")
      .trim();

    const ssml = `<speak>
      <p>${plainText}</p>
    </speak>`;

    return { ssml, plainText };
  }

  getConversationHistory(sessionId: string): VoiceConversationTurn[] {
    return this.sessions.get(sessionId)?.turns ?? [];
  }

  getActiveSessionsForUser(userId: string): VoiceConversationSession[] {
    return Array.from(this.sessions.values()).filter(
      (s) => s.userId === userId && s.isActive,
    );
  }
}

export const voiceService = new VoiceServiceImpl();
