"use client";

import React, { useState, useRef, useEffect } from "react";
import MuxPlayer from "@mux/mux-player-react";
import { Loader2 } from "lucide-react";

interface MuxVideoPlayerProps {
  playbackId: string;
  onComplete?: () => void;
  onProgress?: (percentComplete: number) => void;
  title?: string;
}

export const MuxVideoPlayer = ({
  playbackId,
  onComplete,
  onProgress,
  title,
}: MuxVideoPlayerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const playerRef = useRef<any>(null);
  const [hasTrackedCompletion, setHasTrackedCompletion] = useState(false);

  useEffect(() => {
    setHasTrackedCompletion(false);
  }, [playbackId]);

  const handleLoadedData = () => {
    setIsLoading(false);
  };

  const handleTimeUpdate = () => {
    if (!playerRef.current) return;

    const video = playerRef.current;
    const currentTime = video.currentTime || 0;
    const duration = video.duration || 0;

    if (duration > 0) {
      const percentComplete = (currentTime / duration) * 100;

      if (onProgress) {
        onProgress(percentComplete);
      }

      // Mark as complete when 90% watched (to account for users skipping credits/outro)
      if (!hasTrackedCompletion && percentComplete >= 90 && onComplete) {
        setHasTrackedCompletion(true);
        onComplete();
      }
    }
  };

  const handleEnded = () => {
    // Also trigger completion when video naturally ends
    if (!hasTrackedCompletion && onComplete) {
      setHasTrackedCompletion(true);
      onComplete();
    }
  };

  if (!playbackId) {
    return (
      <div className="aspect-video bg-gray-200 flex items-center justify-center">
        <p className="text-muted-foreground">No video available</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      )}
      <MuxPlayer
        ref={playerRef}
        playbackId={playbackId}
        metadata={{
          video_title: title || "Course Video",
        }}
        streamType="on-demand"
        onLoadedData={handleLoadedData}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};
