/**
 * YouTube URL parsing and embed utilities.
 *
 * Stores only YouTube Video IDs. Converts any supported URL format
 * into a clean embed URL for use in iframes.
 *
 * Supported input formats:
 *  - https://www.youtube.com/watch?v=VIDEO_ID
 *  - https://youtu.be/VIDEO_ID
 *  - https://www.youtube.com/shorts/VIDEO_ID
 *  - https://www.youtube.com/embed/VIDEO_ID
 *  - https://www.youtube.com/live/VIDEO_ID
 *  - https://www.youtube.com/playlist?list=PLAYLIST_ID
 *  - Bare 11-character video ID: VIDEO_ID
 */

export interface ParsedYouTubeUrl {
  videoId: string | null;
  playlistId: string | null;
  start: number | null;
  isValid: boolean;
}

/**
 * Parse any supported YouTube URL (or bare video ID) into its components.
 */
export function parseYouTubeUrl(input: string): ParsedYouTubeUrl {
  const result: ParsedYouTubeUrl = {
    videoId: null,
    playlistId: null,
    start: null,
    isValid: false,
  };

  if (!input || typeof input !== "string") return result;

  const trimmed = input.trim();
  if (!trimmed) return result;

  // Bare 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    result.videoId = trimmed;
    result.isValid = true;
    return result;
  }

  try {
    const urlObj = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const host = urlObj.hostname.replace(/^www\./, "");
    const path = urlObj.pathname;

    // Playlist ID from query param
    const listParam = urlObj.searchParams.get("list");
    if (listParam) result.playlistId = listParam;

    // Start time
    const startParam = urlObj.searchParams.get("start") || urlObj.searchParams.get("t");
    if (startParam) {
      const n = parseInt(startParam, 10);
      if (!isNaN(n) && n >= 0) result.start = n;
    }

    if (host === "youtu.be") {
      const id = path.split("/").filter(Boolean)[0];
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) result.videoId = id;
    } else if (host === "youtube.com" || host === "m.youtube.com") {
      if (path === "/watch") {
        const v = urlObj.searchParams.get("v");
        if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) result.videoId = v;
      } else {
        const segments = path.split("/").filter(Boolean);
        if (segments.length >= 2 && ["embed", "shorts", "live", "v"].includes(segments[0])) {
          if (/^[a-zA-Z0-9_-]{11}$/.test(segments[1])) result.videoId = segments[1];
        }
      }
    }

    result.isValid = result.videoId !== null || result.playlistId !== null;
    return result;
  } catch {
    // Regex fallback
    const m = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (m) {
      result.videoId = m[1];
      result.isValid = true;
    }
    return result;
  }
}

/**
 * Extract just the video ID from any supported YouTube URL or bare ID.
 * Returns null if the input is not a valid YouTube video.
 */
export function extractVideoId(input: string): string | null {
  return parseYouTubeUrl(input).videoId;
}

/**
 * Build a clean YouTube embed URL.
 *
 * Uses https://www.youtube.com/embed/VIDEO_ID with minimal parameters.
 * Does NOT use enablejsapi=1 or origin to avoid Error 153 (player configuration error).
 * Does NOT use rel=0 (deprecated).
 * Does NOT use youtube-nocookie.com — it interferes with the embed API.
 */
export function buildYouTubeEmbedUrl(input: string | ParsedYouTubeUrl, options?: {
  autoplay?: boolean;
  startTime?: number;
}): string {
  const parsed = typeof input === "string" ? parseYouTubeUrl(input) : input;

  if (!parsed.isValid) return "";

  const params = new URLSearchParams();
  params.set("playsinline", "1");

  if (options?.autoplay) {
    params.set("autoplay", "1");
    params.set("mute", "1");
  }

  if (parsed.start !== null) {
    params.set("start", String(parsed.start));
  } else if (options?.startTime) {
    params.set("start", String(Math.floor(options.startTime)));
  }

  if (parsed.playlistId) params.set("list", parsed.playlistId);

  if (parsed.videoId) {
    return `https://www.youtube.com/embed/${parsed.videoId}?${params.toString()}`;
  }

  if (parsed.playlistId) {
    return `https://www.youtube.com/embed/videoseries?${params.toString()}`;
  }

  return "";
}

/**
 * Check if a value is a valid YouTube video ID or URL.
 */
export function isValidYouTubeUrl(input: string): boolean {
  return parseYouTubeUrl(input).isValid;
}

/**
 * Get a YouTube thumbnail URL for a video ID or URL.
 */
export function getYouTubeThumbnail(input: string): string | null {
  const videoId = extractVideoId(input);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}