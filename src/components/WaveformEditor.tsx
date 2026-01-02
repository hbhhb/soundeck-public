import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { logAnalyticsEvent } from "../utils/analytics";
import { Button } from "./ui/button";
import { Play, Pause, SkipBack, X } from "lucide-react";
import { Sound } from "./SoundboardApp";
import { Dialog, DialogOverlay, DialogPortal } from "./ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog@1.1.6";

interface WaveformEditorProps {
  sound: Sound;
  masterVolume: number;
  onClose: () => void;
  onSave: (trimStart: number, trimEnd: number) => void;
}

export const WaveformEditor: React.FC<WaveformEditorProps> = ({
  sound,
  masterVolume,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Use a local state for the true audio duration derived from the buffer
  // Initialize with sound.duration as a fallback, but update it once audio loads
  const [audioDuration, setAudioDuration] = useState<number>(sound.duration || 0);

  const initialSelection = sound.trimStart !== undefined && sound.trimEnd !== undefined
    ? { start: sound.trimStart, end: sound.trimEnd }
    : null;
  const [selection, setSelection] = useState<{
    start: number;
    end: number;
  } | null>(initialSelection);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 200 });

  // Track if there are unsaved changes
  const hasChanges = (() => {
    // If both are null, no changes
    if (selection === null && initialSelection === null) return false;
    // If one is null and other isn't, there are changes
    if (selection === null || initialSelection === null) return true;
    // Compare values
    return selection.start !== initialSelection.start || selection.end !== initialSelection.end;
  })();

  // Load and analyze audio
  useEffect(() => {
    const loadAudio = async () => {
      try {
        const response = await fetch(sound.fileUrl);
        const arrayBuffer = await response.arrayBuffer();

        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Update the duration with the actual length from the audio buffer
        setAudioDuration(audioBuffer.duration);

        // Extract waveform data
        const rawData = audioBuffer.getChannelData(0);
        const samples = 500; // Number of bars to display
        const blockSize = Math.floor(rawData.length / samples);
        const filteredData: number[] = [];

        for (let i = 0; i < samples; i++) {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[i * blockSize + j]);
          }
          filteredData.push(sum / blockSize);
        }

        // Normalize
        const max = Math.max(...filteredData);
        const normalized = filteredData.map((v) => v / max);
        setWaveformData(normalized);
      } catch (error) {
        // Silently fail
      }
    };

    loadAudio();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [sound.fileUrl]);

  // Update canvas size based on container size
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const padding = 48; // p-6 = 24px * 2 sides
        const actualWidth = containerWidth - padding;

        setCanvasSize({
          width: actualWidth > 0 ? actualWidth : 800, // Fallback to 800px
          height: 200,
        });
      }
    };

    // Initial size
    updateCanvasSize();

    // Update on window resize
    window.addEventListener('resize', updateCanvasSize);

    // Use ResizeObserver for more accurate container size changes
    const resizeObserver = new ResizeObserver(updateCanvasSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      resizeObserver.disconnect();
    };
  }, []);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / waveformData.length;

    // Clear canvas
    ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-surface-secondary")
      .trim() || "#1a1a1b";
    ctx.fillRect(0, 0, width, height);

    // Use audioDuration for calculations to ensure sync with visual waveform
    const duration = audioDuration > 0 ? audioDuration : 1; // Prevent division by zero

    // Draw selection background
    if (selection) {
      const startX = (selection.start / duration) * width;
      const endX = (selection.end / duration) * width;
      ctx.fillStyle = "rgba(59, 130, 246, 0.2)"; // Blue overlay
      ctx.fillRect(startX, 0, endX - startX, height);
    }

    // Draw waveform bars
    waveformData.forEach((value, index) => {
      const x = index * barWidth;
      const barHeight = value * height * 0.8;
      const y = (height - barHeight) / 2;

      // Color based on selection
      let inSelection = false;
      if (selection) {
        const time = (index / waveformData.length) * duration;
        inSelection = time >= selection.start && time <= selection.end;
      }

      ctx.fillStyle = inSelection
        ? "#3b82f6" // Blue for selection
        : getComputedStyle(document.documentElement)
          .getPropertyValue("--color-foreground-tertiary")
          .trim() || "#666";
      ctx.fillRect(x, y, Math.max(1, barWidth - 1), barHeight);
    });

    // Draw playhead
    if (isPlaying || currentTime > 0) {
      const playheadX = (currentTime / duration) * width;
      // Clamp playheadX to be within canvas
      const clampedPlayheadX = Math.max(0, Math.min(width, playheadX));

      const playheadColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--color-foreground-primary")
        .trim() || "#ffffff";
      ctx.strokeStyle = playheadColor; // Semantic foreground primary color
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(clampedPlayheadX, 0);
      ctx.lineTo(clampedPlayheadX, height);
      ctx.stroke();
    }
  }, [waveformData, selection, currentTime, isPlaying, audioDuration]);

  // Update current time during playback
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const updateTime = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);

        // Stop if reached selection end
        if (selection && audioRef.current.currentTime >= selection.end) {
          audioRef.current.pause();
          audioRef.current.currentTime = selection.start;
          setIsPlaying(false);
          return;
        }
      }
      animationFrameRef.current = requestAnimationFrame(updateTime);
    };

    animationFrameRef.current = requestAnimationFrame(updateTime);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, selection]);

  // Handle canvas mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.stopPropagation(); // Prevent event propagation
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const duration = audioDuration > 0 ? audioDuration : 1;
    const time = (x / rect.width) * duration;

    setIsDragging(true);
    setDragStart(time);
    setSelection({ start: time, end: time });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.stopPropagation(); // Prevent event propagation
    if (!isDragging || dragStart === null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const duration = audioDuration > 0 ? audioDuration : 1;
    const time = (x / rect.width) * duration;

    // Clamp time to duration
    const clampedTime = Math.max(0, Math.min(duration, time));

    setSelection({
      start: Math.min(dragStart, clampedTime),
      end: Math.max(dragStart, clampedTime),
    });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.stopPropagation(); // Prevent event propagation
    e.preventDefault(); // Prevent any default behavior

    if (!isDragging || dragStart === null) {
      setIsDragging(false);
      setDragStart(null);
      return;
    }

    // Calculate the current selection directly from dragStart and current position
    const canvas = canvasRef.current;
    if (!canvas) {
      setIsDragging(false);
      setDragStart(null);
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const duration = audioDuration > 0 ? audioDuration : 1;
    const currentTimeAtMouseUp = (x / rect.width) * duration;

    // Clamp time to duration
    const clampedTimeAtMouseUp = Math.max(0, Math.min(duration, currentTimeAtMouseUp));

    const selectionStart = Math.min(dragStart, clampedTimeAtMouseUp);
    const selectionEnd = Math.max(dragStart, clampedTimeAtMouseUp);

    setIsDragging(false);
    setDragStart(null);

    // Auto-play the selected range when drag completes (only if there's an actual selection)
    if (selectionStart !== selectionEnd) {
      // Stop current playback if any
      if (audioRef.current) {
        audioRef.current.pause();
      }

      // Create new audio if needed
      if (!audioRef.current) {
        const audio = new Audio(sound.fileUrl);
        audio.volume = sound.volume * masterVolume;
        audioRef.current = audio;
        audio.onended = () => {
          setIsPlaying(false);
          setCurrentTime(0);
        };
      }

      // Start playing from selection start
      audioRef.current.currentTime = selectionStart;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Play/Pause
  const togglePlay = () => {
    if (!audioRef.current) {
      // Create audio element
      const audio = new Audio(sound.fileUrl);
      audio.volume = sound.volume * masterVolume;
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // If there's a selection, start from selection start
      if (selection) {
        audioRef.current.currentTime = selection.start;
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Reset to start
  const resetToStart = () => {
    if (audioRef.current) {
      const startTime = selection ? selection.start : 0;
      audioRef.current.currentTime = startTime;
      setCurrentTime(startTime);
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelection(null);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Space key for play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        // Toggle play state directly instead of calling togglePlay
        setIsPlaying(prev => {
          const newIsPlaying = !prev;
          if (newIsPlaying) {
            // Start playing
            if (!audioRef.current) {
              const audio = new Audio(sound.fileUrl);
              audio.volume = sound.volume * masterVolume;
              audioRef.current = audio;
              audio.onended = () => {
                setIsPlaying(false);
                setCurrentTime(0);
              };
            }
            // If there's a selection, start from selection start
            const startTime = selection ? selection.start : 0;
            audioRef.current.currentTime = startTime;
            audioRef.current.play();
          } else {
            // Pause
            if (audioRef.current) {
              audioRef.current.pause();
            }
          }
          return newIsPlaying;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sound.fileUrl, sound.volume, masterVolume, selection]);

  // Set a global flag that waveform editor is open
  useEffect(() => {
    document.body.setAttribute('data-waveform-editor-open', 'true');
    return () => {
      document.body.removeAttribute('data-waveform-editor-open');
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const content = (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay
          className="bg-black/60"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
        />
        <DialogPrimitive.Content
          className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] rounded-xl shadow-2xl duration-200 border border-surface-border overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6">
            <div>
              <h2 className="text-xl font-semibold">{sound.title}</h2>
              <p className="text-sm text-foreground-secondary mt-1">
                {selection
                  ? `${formatTime(selection.start)} - ${formatTime(selection.end)} (${formatTime(selection.end - selection.start)})`
                  : `${t('waveEditor.total')}: ${formatTime(audioDuration)}`}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X size={20} />
            </Button>
          </div>

          {/* Waveform Canvas */}
          <div ref={containerRef} className="flex-1 p-6 overflow-auto">
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="w-full bg-surface-secondary rounded-lg cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            <p className="text-xs text-foreground-tertiary text-center mt-3">
              {t('waveEditor.dragToSelect')}
            </p>
          </div>

          {/* Controls */}
          <div className="p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={resetToStart}
                disabled={!isPlaying && currentTime === 0}
                className="h-[36px] w-[36px] rounded-[12px] bg-surface-secondary hover:bg-surface-tertiary border-surface-border"
              >
                <SkipBack size={16} />
              </Button>
              <Button
                variant="outline"
                onClick={togglePlay}
                className="gap-2 min-w-[100px] h-[36px] rounded-[12px] bg-surface-secondary text-foreground-primary hover:bg-surface-tertiary border-surface-border"
              >
                {isPlaying ? (
                  <>
                    <Pause size={16} className="fill-current" />
                    <span className="font-semibold text-[14px]">{t('waveEditor.pause')}</span>
                  </>
                ) : (
                  <>
                    <Play size={16} className="fill-current" />
                    <span className="font-semibold text-[14px]">{t('waveEditor.play')}</span>
                  </>
                )}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {selection && (
                <Button variant="outline" onClick={clearSelection}>
                  {t('waveEditor.clear')}
                </Button>
              )}
              {hasChanges && (
                <Button
                  onClick={() => {
                    if (selection) {
                      onSave(selection.start, selection.end);
                    } else {
                      // Clear the trim by setting to 0 and duration
                      onSave(0, audioDuration);
                    }
                    logAnalyticsEvent({ name: 'event_trim_sound', params: { sound_id: sound.id } });
                    onClose();
                  }}
                >
                  {t('waveEditor.saveRange')}
                </Button>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );

  return content;
};