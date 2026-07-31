import { useState, useEffect, useRef, useMemo } from "react";
import { AlertCircle, Maximize2, Minimize2 } from "lucide-react";
import {
  parseYouTubeUrl,
  buildYouTubeEmbedUrl,
} from "@/lib/youtube";

interface VideoPlayerProps {
  url: string;
  title?: string;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  startTime?: number;
  autoPlay?: boolean;
}

export function VideoPlayer({
  url,
  title,
  onEnded,
  startTime,
  autoPlay = false,
}: VideoPlayerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Parse the URL and build the embed URL
  const { embedUrl, isValid } = useMemo(() => {
    const parsed = parseYouTubeUrl(url);
    if (!parsed.isValid) {
      return { embedUrl: "", isValid: false };
    }
    const embedUrl = buildYouTubeEmbedUrl(parsed, {
      autoplay: autoPlay,
      startTime,
    });
    return { embedUrl, isValid: true };
  }, [url, autoPlay, startTime]);

  // Fullscreen
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Fullscreen not supported or denied
    }
  };

  useEffect(() => {
    const handleFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFSChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFSChange);
  }, []);

  // Error state — invalid URL
  if (!isValid) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-red-500/20">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-red-300 mb-2">
            Video Unavailable
          </h3>
          <p className="text-sm text-zinc-400 max-w-md">
            {url
              ? "Invalid YouTube link. Supported formats: youtube.com/watch?v=, youtu.be/, youtube.com/shorts/, and playlist URLs."
              : "No video URL provided."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-zinc-800 shadow-2xl group"
    >
      {/* YouTube iframe with native controls — responsive, fills container */}
      {embedUrl && (
        <div className="absolute inset-0 w-full h-full z-10 group/iframe">
          <iframe
            ref={iframeRef}
            className="w-full h-full"
            src={embedUrl}
            title={title || "YouTube video player"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            sandbox="allow-same-origin allow-scripts allow-presentation allow-popups allow-forms"
          />
          {/* Fallback link for restrictive IDE environments that block iframe scripts */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 right-16 px-4 py-2 bg-black/80 hover:bg-black text-white text-xs font-medium rounded-lg opacity-0 group-hover/iframe:opacity-100 transition-opacity backdrop-blur-sm border border-zinc-700/50"
            title="If video is stuck in this environment, click to watch directly on YouTube"
          >
            Watch on YouTube ↗
          </a>
        </div>
      )}

      {/* Fullscreen toggle — floating, non-blocking, only visible on hover */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-3 right-3 z-30 p-2 rounded-lg bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? (
          <Minimize2 className="w-4 h-4" />
        ) : (
          <Maximize2 className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}