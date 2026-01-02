import React, { useEffect, useState, useRef } from 'react';
import * as api from '../utils/api';
import { logger } from '../utils/logger';

interface WaveformProps {
  audioUrl: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  trimStart?: number;
  trimEnd?: number;
}

export const Waveform: React.FC<WaveformProps> = ({ audioUrl, currentTime, duration, isPlaying, trimStart, trimEnd }) => {
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Track dark mode changes
  useEffect(() => {
    const updateDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    // Initial check
    updateDarkMode();

    // Watch for dark mode changes
    const observer = new MutationObserver(updateDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Extract waveform data from audio file
  useEffect(() => {
    const analyzeAudio = async () => {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioContext = new AudioContextClass();

        // Try to fetch with cors mode
        let arrayBuffer: ArrayBuffer;
        try {
          arrayBuffer = await api.fetchAudioData(audioUrl);
        } catch (fetchError) {
          // Silently use fallback data when fetch fails
          logger.warn("Waveform fetch failed, using fallback", fetchError);
          const fallbackData = Array.from({ length: 80 }, () => Math.random() * 0.5 + 0.2);
          setWaveformData(fallbackData);
          audioContext.close();
          return;
        }

        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const rawData = audioBuffer.getChannelData(0); // Get first channel
        const samples = 80; // Number of bars to display
        const blockSize = Math.floor(rawData.length / samples);
        const filteredData: number[] = [];

        for (let i = 0; i < samples; i++) {
          let blockStart = blockSize * i;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[blockStart + j]);
          }
          filteredData.push(sum / blockSize);
        }

        // Normalize the data
        const max = Math.max(...filteredData);
        const normalizedData = filteredData.map(n => n / max);

        setWaveformData(normalizedData);
        audioContext.close();
      } catch (error) {
        // Silently fallback to random data for visualization
        const fallbackData = Array.from({ length: 80 }, () => Math.random() * 0.5 + 0.2);
        setWaveformData(fallbackData);
      }
    };

    analyzeAudio();
  }, [audioUrl]);

  // Draw waveform on canvas
  useEffect(() => {
    if (!canvasRef.current || waveformData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / waveformData.length;
    const progress = duration > 0 ? currentTime / duration : 0;

    // Calculate trim positions (0-1 range)
    const trimStartRatio = trimStart !== undefined && duration > 0 ? trimStart / duration : 0;
    const trimEndRatio = trimEnd !== undefined && duration > 0 ? trimEnd / duration : 1;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Get colors from CSS variables
    const computedStyle = getComputedStyle(document.documentElement);
    const primaryColor = computedStyle.getPropertyValue('--foreground-primary').trim();
    const mutedColor = computedStyle.getPropertyValue('--foreground-muted').trim();
    const tertiaryColor = computedStyle.getPropertyValue('--foreground-tertiary').trim();

    // Draw bars
    waveformData.forEach((value, index) => {
      const barHeight = value * height * 0.8; // 80% of canvas height
      const x = index * barWidth;
      const y = (height - barHeight) / 2;

      // Calculate bar position in 0-1 range
      const barStart = index / waveformData.length;
      const barEnd = (index + 1) / waveformData.length;
      const barCenter = (barStart + barEnd) / 2;

      // Check if bar is in trimmed range
      const isInTrimRange = barCenter >= trimStartRatio && barCenter <= trimEndRatio;

      // Determine color based on progress and trim range
      if (barCenter <= progress && progress > 0) {
        // Played portion
        if (isInTrimRange) {
          ctx.fillStyle = primaryColor;
        } else {
          // Played but outside trim - use tertiary (very faded)
          ctx.fillStyle = tertiaryColor;
          ctx.globalAlpha = 0.15;
        }
      } else {
        // Unplayed portion
        if (isInTrimRange) {
          ctx.fillStyle = mutedColor;
        } else {
          // Unplayed and outside trim - use tertiary (very faded)
          ctx.fillStyle = tertiaryColor;
          ctx.globalAlpha = 0.15;
        }
      }

      ctx.fillRect(x, y, barWidth - 1, barHeight);
      ctx.globalAlpha = 1; // Reset alpha
    });
  }, [waveformData, currentTime, duration, isPlaying, isDarkMode, trimStart, trimEnd]);

  return (
    <div className="w-full h-12 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={400}
        height={48}
        className="w-full h-full"
        style={{ imageRendering: 'crisp-edges' }}
      />
    </div>
  );
};