import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, Trash2, Volume2, VolumeX, Edit2, Keyboard, Square, MoreVertical, Scissors } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { Sound } from '../types';
import { toast } from 'sonner@2.0.3';
import { Slider } from './ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Waveform } from './Waveform';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { formatKeyCode, isValidHotkey } from '../utils/keyCodeUtils';
import { WaveformEditor } from './WaveformEditor';
import { SoundControlBtn } from './SoundControlBtn';
import { logger } from '../utils/logger';
import { logAnalyticsEvent } from '../utils/analytics';
import * as api from '../utils/api';

interface SoundCardProps {
  sound: Sound;
  masterVolume?: number;
  onDelete: () => void;
  onVolumeChange?: (volume: number) => void;
  onEdit?: (updates: Partial<Sound>) => void;
  allSounds?: Sound[]; // For duplicate hotkey checking
  isDragging?: boolean; // For custom drag layer
}

export const SoundCard = ({ sound, masterVolume = 1, onDelete, onVolumeChange, onEdit, allSounds, isDragging = false }: SoundCardProps) => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(sound.duration || 0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(sound.title);
  const [editEmoji, setEditEmoji] = useState(sound.emoji || '🎵');
  const [editHotkey, setEditHotkey] = useState(sound.hotkey || '');
  const [isCapturingHotkey, setIsCapturingHotkey] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isMobilePopoverOpen, setIsMobilePopoverOpen] = useState(false);
  const [isDesktopPopoverOpen, setIsDesktopPopoverOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [hotkeyError, setHotkeyError] = useState<string>('');
  const [isWaveformEditorOpen, setIsWaveformEditorOpen] = useState(false);
  const [isHotkeyDialogOpen, setIsHotkeyDialogOpen] = useState(false);
  const startVolumeRef = useRef<number>(sound.volume);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<number | null>(null);

  // Initialize Audio
  useEffect(() => {
    const audio = new Audio(sound.fileUrl);
    audioRef.current = audio;
    audio.volume = sound.volume * masterVolume; // Apply both individual and master volume

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(sound.trimStart || 0);
      stopProgressInterval();
    });

    // Handle trim end during playback
    audio.addEventListener('timeupdate', () => {
      if (sound.trimEnd !== undefined && audio.currentTime >= sound.trimEnd) {
        audio.pause();
        audio.currentTime = sound.trimStart || 0;
        setCurrentTime(sound.trimStart || 0);
        setIsPlaying(false);
        stopProgressInterval();
      }
    });

    // Error handling for audio loading
    audio.addEventListener('error', (e) => {
      logger.error('Audio loading error for', sound.title);
    });

    // Cleanup
    return () => {
      audio.pause();
      audio.src = '';
      stopProgressInterval();
    };
  }, [sound.fileUrl, sound.trimStart, sound.trimEnd]);

  // Update volume when sound.volume or masterVolume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = sound.volume * masterVolume;
    }
  }, [sound.volume, masterVolume]);

  // Listen specifically for play events for this sound
  useEffect(() => {
    const handlePlayEvent = (event: Event) => {
      // Handle custom events which might contain detail
      const customEvent = event as CustomEvent;
      const method = customEvent.detail?.method === 'hotkey' ? 'hotkey' : 'click';
      handleTogglePlayStop(method);
    };

    window.addEventListener(`play-sound-${sound.id}`, handlePlayEvent);
    return () => {
      window.removeEventListener(`play-sound-${sound.id}`, handlePlayEvent);
    };
  }, [sound.id, sound.trimStart, sound.isDefault]); // Add isPlaying to dependencies

  // Auto-start capturing when hotkey dialog opens
  useEffect(() => {
    if (isHotkeyDialogOpen) {
      // Automatically start capturing when dialog opens
      setIsCapturingHotkey(true);
      setHotkeyError('');
      toast.info('Press any key (ESC to cancel)');
    } else {
      // Reset capturing state when dialog closes
      setIsCapturingHotkey(false);
    }
  }, [isHotkeyDialogOpen]);

  // Update edit state when dialog opens
  useEffect(() => {
    if (isEditDialogOpen) {
      setEditTitle(sound.title);
      setEditEmoji(sound.emoji || '🎵');
      setEditHotkey(sound.hotkey || '');

      // Load file size
      if (sound.isDefault) {
        setFileSize(t('soundCard.defaultSound'));
      } else {
        setFileSize(t('common.loading'));
        api.getFileSize(sound.fileUrl)
          .then(size => {
            if (size) {
              const bytes = parseInt(size, 10);
              if (bytes < 1024 * 1024) {
                setFileSize(`${(bytes / 1024).toFixed(1)} KB`);
              } else {
                setFileSize(`${(bytes / (1024 * 1024)).toFixed(2)} MB`);
              }
            } else {
              setFileSize(t('soundCard.unknownSize'));
            }
          })
          .catch(() => setFileSize(t('soundCard.unknownSize')));
      }
    }
  }, [isEditDialogOpen, sound.title, sound.emoji, sound.hotkey, sound.isDefault, sound.fileUrl]);

  // Handle hotkey capture with global listener
  useEffect(() => {
    if (!isCapturingHotkey) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Check for Escape to cancel
      if (e.code === 'Escape') {
        setIsCapturingHotkey(false);
        toast.info('Hotkey capture cancelled');
        return;
      }

      // Use physical key code instead of key value
      const code = e.code;

      // Validate the code
      if (!isValidHotkey(code)) {
        toast.error('Invalid hotkey (modifier keys not allowed)');
        return;
      }

      // Check for duplicate hotkey
      if (allSounds && allSounds.length > 0) {
        const existingSound = allSounds.find(
          s => s.id !== sound.id && s.hotkey === code
        );
        if (existingSound) {
          const displayKey = formatKeyCode(code);
          setHotkeyError(`Hotkey "${displayKey}" is already used by "${existingSound.title}"`);
          return; // Keep capturing mode active
        }
      }

      setEditHotkey(code);
      setIsCapturingHotkey(false);
      setHotkeyError('');
      const displayKey = formatKeyCode(code);
      toast.success(`Hotkey set to: ${displayKey}`);

      // Auto-save hotkey immediately
      if (onEdit) {
        onEdit({ hotkey: code });
        logAnalyticsEvent({
          name: 'event_set_hotkey',
          params: {
            key_combo: displayKey,
            sound_id: sound.id
          }
        });
      }
    };

    const handleClick = (e: MouseEvent) => {
      // Cancel if clicking outside the input
      const target = e.target as HTMLElement;
      if (!target.closest('#hotkey')) {
        setIsCapturingHotkey(false);
        toast.info('Hotkey capture cancelled');
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('click', handleClick, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('click', handleClick, true);
    };
  }, [isCapturingHotkey, allSounds, sound.id]);

  const startProgressInterval = () => {
    stopProgressInterval();
    progressIntervalRef.current = window.setInterval(() => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
    }, 50); // 20fps update for smooth bar
  };

  const stopProgressInterval = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // Play handler specifically for card click (instant restart if playing)
  const handlePlayClick = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      // Restart from trim start for card click (instant re-trigger for soundboard)
      const startTime = sound.trimStart || 0;
      audioRef.current.currentTime = startTime;
      audioRef.current.play().catch(e => logger.error("Play error", e));
      setIsPlaying(true);
      startProgressInterval();

      logAnalyticsEvent({
        name: 'event_play_sound',
        params: {
          method: 'click',
          source_type: sound.isDefault ? 'demo' : 'user_upload'
        }
      });
    } else {
      const startTime = sound.trimStart || 0;
      audioRef.current.currentTime = startTime;
      audioRef.current.play().catch(e => logger.error("Play error", e));
      setIsPlaying(true);
      startProgressInterval();

      logAnalyticsEvent({
        name: 'event_play_sound',
        params: {
          method: 'click',
          source_type: sound.isDefault ? 'demo' : 'user_upload'
        }
      });
    }
  };

  const handleTogglePlayPause = (source: 'click' | 'hotkey' = 'click') => {
    if (!audioRef.current) return;

    if (isPlaying) {
      // Pause when playing
      audioRef.current.pause();
      setIsPlaying(false);
      stopProgressInterval();
    } else {
      // Play when paused - if at 0, start from trim start
      if (audioRef.current.currentTime === 0 || audioRef.current.currentTime < (sound.trimStart || 0)) {
        audioRef.current.currentTime = sound.trimStart || 0;
      }
      audioRef.current.play().catch(e => logger.error("Play error", e));
      setIsPlaying(true);
      startProgressInterval();

      logAnalyticsEvent({
        name: 'event_play_sound',
        params: {
          method: source,
          source_type: sound.isDefault ? 'demo' : 'user_upload'
        }
      });
    }
  };

  const handleTogglePlayStop = (source: 'click' | 'hotkey' = 'click') => {
    if (!audioRef.current) return;

    if (isPlaying) {
      // Stop when playing (reset to start)
      handleStop();
    } else {
      // Play from start when stopped
      const startTime = sound.trimStart || 0;
      audioRef.current.currentTime = startTime;
      audioRef.current.play().catch(e => logger.error("Play error", e));
      setIsPlaying(true);
      startProgressInterval();

      logAnalyticsEvent({
        name: 'event_play_sound',
        params: {
          method: source,
          source_type: sound.isDefault ? 'demo' : 'user_upload'
        }
      });
    }
  };

  const handleStop = () => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    audioRef.current.currentTime = sound.trimStart || 0;
    setCurrentTime(sound.trimStart || 0);
    setIsPlaying(false);
    stopProgressInterval();
  };

  // Check if audio has actually progressed beyond the start position
  const hasProgressed = () => {
    const startPosition = sound.trimStart || 0;
    return currentTime > startPosition;
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    if (audioRef.current) {
      audioRef.current.volume = newVolume * masterVolume;
    }
    if (onVolumeChange) {
      onVolumeChange(newVolume);
    }
  };

  const handleVolumeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string for editing
    if (value === '') return;

    // Parse and validate
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      // Clamp between 0 and 100
      const clampedValue = Math.max(0, Math.min(100, numValue));
      const volumeDecimal = clampedValue / 100;
      handleVolumeChange([volumeDecimal]);
    }
  };

  const handleVolumeInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Ensure we have a valid value on blur
    if (e.target.value === '') {
      handleVolumeChange([sound.volume]);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate effective duration based on trim
  const effectiveDuration =
    sound.trimStart !== undefined && sound.trimEnd !== undefined
      ? sound.trimEnd - sound.trimStart
      : duration;

  const isTrimmed = sound.trimStart !== undefined && sound.trimEnd !== undefined;

  const handleEditDialogOpen = () => {
    setIsEditDialogOpen(true);
    setHotkeyError('');
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    setIsCapturingHotkey(false);
    setHotkeyError('');
  };

  const handleEditDialogOpenChange = (open: boolean) => {
    if (!open) {
      // Prevent event propagation when closing
      setTimeout(() => {
        handleEditDialogClose();
      }, 0);
    } else {
      setIsEditDialogOpen(open);
    }
  };

  const handleEditSubmit = () => {
    // Save any pending changes before closing
    const updates: Partial<Sound> = {};

    if (editEmoji !== sound.emoji) {
      updates.emoji = editEmoji;
    }

    if (editTitle !== sound.title) {
      updates.title = editTitle;
    }

    // Save changes if there are any
    if (onEdit && Object.keys(updates).length > 0) {
      onEdit(updates);
      logAnalyticsEvent({ name: 'event_edit_sound', params: { sound_id: sound.id } });
    }

    // Close the dialog
    setIsCapturingHotkey(false);
    handleEditDialogClose();
  };

  const startHotkeyCapture = () => {
    setIsCapturingHotkey(true);
    setHotkeyError('');
  };

  const cancelHotkeyCapture = () => {
    setIsCapturingHotkey(false);
  };

  const handleHotkeyCapture = (e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const key = e.key;
    if (key === 'Escape') {
      setIsCapturingHotkey(false);
      toast.info(t('toast.hotkeyCaptureCancelled'));
      return;
    }

    // Normalize key display
    let normalizedKey = key;
    if (key.length === 1) {
      normalizedKey = key.toUpperCase();
    }

    setEditHotkey(normalizedKey);
    setIsCapturingHotkey(false);
    setHotkeyError('');
    toast.success(t('toast.hotkeySet', { hotkey: normalizedKey }));

    // Log event
    logAnalyticsEvent({
      name: 'event_set_hotkey',
      params: {
        key_combo: normalizedKey,
        sound_id: sound.id
      }
    });
  };

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-[14px] border transition-all duration-100 overflow-hidden select-none cursor-pointer",
        "bg-card",
        "border-surface-secondary",
        isPlaying ? "ring-1 ring-primary border-primary scale-[1.02]" : "hover:border-surface-border"
      )}
      onClick={(e) => {
        e.stopPropagation();
        handleTogglePlayStop('click');
      }}
      data-sound-card
    >
      {/* Mobile: Background Progress Overlay - REMOVED */}

      {/* Card Content */}
      <div className="relative p-[16px] flex flex-col h-full z-10 bg-[rgba(0,0,0,0)]">

        {/* Content Stack */}
        <div className="flex flex-col gap-0 md:gap-[6px] w-full mb-[12px]">

          {/* Header: Icon & Hotkey */}
          <div className="flex items-center justify-between w-full">
            <span className="text-[20px] leading-[20px] md:text-[24px] md:leading-[24px]">
              {sound.emoji || '🎵'}
            </span>

            <div className="flex items-center gap-2">
              {/* Desktop: Hotkey Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsHotkeyDialogOpen(true);
                  setHotkeyError('');
                }}
                className="hidden md:inline-flex w-[24px] h-[24px] text-[13px] font-bold leading-[16px] font-mono text-center rounded-[4px] bg-surface-secondary text-foreground-secondary border border-surface-border hover:bg-surface-tertiary hover:border-foreground-tertiary transition-all cursor-pointer items-center justify-center"
                title={sound.hotkey ? `Hotkey: ${formatKeyCode(sound.hotkey)}` : t('editModal.hotkeyPlaceholder')}
              >
                {sound.hotkey ? (
                  formatKeyCode(sound.hotkey)
                ) : (
                  <Keyboard size={14} className="text-foreground-tertiary" />
                )}
              </button>

              {/* Mobile: More Button */}
              <Popover open={isMobilePopoverOpen} onOpenChange={setIsMobilePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-[36px] w-[36px] -mr-2 rounded-[8px] text-foreground-secondary hover:text-foreground-primary hover:bg-surface-secondary transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <MoreVertical size={16} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-56 p-2 bg-card border-surface-border"
                  align="end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="space-y-1">
                    {/* Volume Control */}
                    <div className="px-3 py-3 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        {sound.volume === 0 ? <VolumeX size={16} className="text-foreground-secondary" /> : <Volume2 size={16} className="text-foreground-secondary" />}
                        <span className="text-sm text-foreground-primary">{t('soundCard.volume')}</span>
                        <span className="ml-auto text-xs font-mono text-foreground-secondary">
                          {Math.round(sound.volume * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[sound.volume]}
                          min={0}
                          max={1}
                          step={0.05}
                          onValueChange={handleVolumeChange}
                          onPointerDown={() => { startVolumeRef.current = sound.volume; }}
                          onValueCommit={(value) => {
                            logAnalyticsEvent({
                              name: 'event_volume_controlled',
                              params: {
                                volume_type: 'sound_card',
                                source_id: sound.id,
                                prev_vol: startVolumeRef.current,
                                curr_vol: value[0]
                              }
                            });
                          }}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    {/* Edit Button */}
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-primary rounded-md hover:bg-surface-tertiary transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMobilePopoverOpen(false);
                        handleEditDialogOpen();
                      }}
                    >
                      <Edit2 size={16} className="text-foreground-secondary" />
                      <span>{t('soundCard.editInfo')}</span>
                    </button>

                    {/* Waveform Editor Button */}
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-primary rounded-md hover:bg-surface-tertiary transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMobilePopoverOpen(false);
                        setIsWaveformEditorOpen(true);
                      }}
                    >
                      <Scissors size={16} className="text-foreground-secondary" />
                      <span>{t('soundCard.trimRange')}</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMobilePopoverOpen(false);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 size={16} />
                      <span>{t('soundCard.delete')}</span>
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-['Sora'] font-semibold text-[16px] md:text-[18px] leading-[24px] tracking-[-0.3125px] text-foreground-primary truncate w-full" title={sound.title}>
            {sound.title}
          </h3>

          {/* Waveform Visualization - Always Visible */}
          <div className="h-[48px] w-full pointer-events-none">
            <Waveform
              audioUrl={sound.fileUrl}
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              trimStart={sound.trimStart}
              trimEnd={sound.trimEnd}
            />
          </div>

          {/* Time Display */}
          <div className="flex gap-[2px] items-center text-[12px] leading-[16px] font-medium">
            <span className="text-foreground-secondary">{formatTime(currentTime)}</span>
            <span className="text-foreground-tertiary">/</span>
            <span className="text-foreground-secondary">{formatTime(effectiveDuration)}</span>
            {isTrimmed && (
              <span className="text-foreground-tertiary ml-1">{t('soundCard.trimmed')}</span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-[4px] items-start w-full">
          <div className="flex-1">
            <SoundControlBtn
              icon={isPlaying ? Pause : Play}
              label={isPlaying ? t('soundCard.pause') : t('soundCard.play')}
              onClick={(e) => {
                e.stopPropagation();
                handleTogglePlayPause('click');
              }}
            />
          </div>

          <AnimatePresence mode="popLayout">
            {(isPlaying || hasProgressed()) && (
              <motion.div
                initial={{ opacity: 0, x: 8, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 'auto' }}
                exit={{ opacity: 0, x: 8, width: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="flex-1"
              >
                <SoundControlBtn
                  icon={Square}
                  label={t('soundCard.stop')}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStop();
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Desktop: More Button */}
          <Popover open={isDesktopPopoverOpen} onOpenChange={setIsDesktopPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex h-[36px] w-[36px] -mr-2 rounded-[8px] text-foreground-secondary hover:text-foreground-primary hover:bg-surface-secondary transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <MoreVertical size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-56 p-2 bg-card border-surface-border"
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-1">
                {/* Volume Control */}
                <div className="px-3 py-3 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    {sound.volume === 0 ? <VolumeX size={16} className="text-foreground-secondary" /> : <Volume2 size={16} className="text-foreground-secondary" />}
                    <span className="text-sm text-foreground-primary">{t('soundCard.volume')}</span>
                    <span className="ml-auto text-xs font-mono text-foreground-secondary">
                      {Math.round(sound.volume * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[sound.volume]}
                      min={0}
                      max={1}
                      step={0.05}
                      onValueChange={handleVolumeChange}
                      onPointerDown={() => { startVolumeRef.current = sound.volume; }}
                      onValueCommit={(value) => {
                        logAnalyticsEvent({
                          name: 'event_volume_controlled',
                          params: {
                            volume_type: 'sound_card',
                            source_id: sound.id,
                            prev_vol: startVolumeRef.current,
                            curr_vol: value[0]
                          }
                        });
                      }}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Edit Button */}
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-primary rounded-md hover:bg-surface-tertiary transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDesktopPopoverOpen(false);
                    handleEditDialogOpen();
                  }}
                >
                  <Edit2 size={16} className="text-foreground-secondary" />
                  <span>{t('soundCard.editInfo')}</span>
                </button>

                {/* Waveform Editor Button */}
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-primary rounded-md hover:bg-surface-tertiary transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDesktopPopoverOpen(false);
                    setIsWaveformEditorOpen(true);
                  }}
                >
                  <Scissors size={16} className="text-foreground-secondary" />
                  <span>{t('soundCard.trimRange')}</span>
                </button>

                {/* Delete Button */}
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDesktopPopoverOpen(false);
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 size={16} />
                  <span>{t('soundCard.delete')}</span>
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Modals Container - Stop propagation to prevent card click */}
      <div onClick={(e) => e.stopPropagation()}>
        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogOpenChange}>
          <DialogContent
            className="sm:max-w-[425px]"
            onClick={(e) => e.stopPropagation()}
            onPointerDownOutside={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onInteractOutside={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onKeyDown={(e) => {
              // Enter key: Submit (Done)
              if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                // Don't trigger if we're capturing hotkey
                if (!isCapturingHotkey) {
                  e.preventDefault();
                  handleEditSubmit();
                }
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>{t('editModal.title')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="emoji">{t('editModal.labelEmoji')}</Label>
                <Input
                  id="emoji"
                  value={editEmoji}
                  onChange={(e) => {
                    setEditEmoji(e.target.value);
                  }}
                  onBlur={(e) => {
                    // Auto-save emoji when focus is lost
                    if (onEdit && editEmoji !== sound.emoji) {
                      onEdit({ emoji: editEmoji });
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="col-span-3 text-left text-2xl"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title">{t('editModal.labelTitle')}</Label>
                <Input
                  id="title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={(e) => {
                    // Auto-save title when focus is lost
                    if (onEdit && editTitle !== sound.title) {
                      onEdit({ title: editTitle });
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="hotkey" className="pt-2">{t('editModal.labelHotkey')}</Label>
                <div className="col-span-3 space-y-2">
                  {/* Current Hotkey Display - Clickable Input Style */}
                  <div className="relative">
                    <button
                      id="hotkey"
                      className={cn(
                        "w-full px-3 py-2 text-sm font-mono text-left rounded-md border transition-all",
                        "flex items-center justify-between min-h-[40px]",
                        isCapturingHotkey
                          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-400 ring-2 ring-blue-500 dark:ring-blue-400"
                          : editHotkey
                            ? "bg-surface text-foreground-primary border-surface-border hover:border-primary cursor-pointer"
                            : "bg-surface text-foreground-tertiary border-surface-border hover:border-primary cursor-pointer"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isCapturingHotkey) {
                          startHotkeyCapture();
                        }
                      }}
                    >
                      <span className="flex flex-col gap-0.5">
                        {isCapturingHotkey ? (
                          <>
                            {editHotkey && (
                              <span className="text-xs text-foreground-tertiary">
                                {formatKeyCode(editHotkey)}
                              </span>
                            )}
                            <span className="text-blue-600 dark:text-blue-400">{t('editModal.hotkeyLoop')}</span>
                          </>
                        ) : editHotkey ? (
                          formatKeyCode(editHotkey)
                        ) : (
                          t('editModal.hotkeyPlaceholder')
                        )}
                      </span>
                      {isCapturingHotkey && (
                        <Keyboard size={16} className="text-blue-500 dark:text-blue-400 animate-bounce" />
                      )}
                    </button>
                  </div>

                  {/* Helper text */}
                  {isCapturingHotkey && (
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      {t('editModal.pressEc')}
                    </p>
                  )}

                  {/* Error Message */}
                  {hotkeyError && (
                    <div className="flex items-start gap-2 p-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {hotkeyError}
                      </p>
                    </div>
                  )}

                  {/* Clear hotkey button */}
                  {editHotkey && !isCapturingHotkey && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditHotkey('');
                        setHotkeyError('');
                        // Auto-save empty hotkey
                        if (onEdit) {
                          onEdit({ hotkey: '' });
                        }
                        toast.success(t('toast.hotkeyCleared'));
                      }}
                      className="text-xs h-8 text-foreground-tertiary hover:text-red-500"
                    >
                      {t('editModal.clearHotkey')}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* File Size Info */}
            <div className="flex items-center justify-between text-sm text-foreground-secondary px-[0px] py-[12px] border-t border-surface-border mt-[8px] mr-[0px] mb-[0px] ml-[0px] pt-[16px] pr-[0px] pb-[8px] pl-[0px]">
              <span>{t('soundCard.storageUsage')}</span>
              <span className="font-mono bg-surface-secondary px-2 py-0.5 rounded text-xs">{fileSize}</span>
            </div>

            <Button
              type="submit"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                handleEditSubmit();
              }}
            >
              {t('editModal.done')}
            </Button>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="sm:max-w-[425px]" onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('confirmModal.deleteSoundTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('confirmModal.deleteSoundDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="!flex-col gap-2 sm:!flex-col">
              <AlertDialogAction
                className="w-full m-0 bg-destructive/10 text-destructive hover:bg-destructive/20 dark:bg-destructive/20 dark:text-destructive dark:hover:bg-destructive/30 border border-destructive/20 shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                {t('soundCard.delete')}
              </AlertDialogAction>
              <AlertDialogCancel
                className="w-full m-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteDialogOpen(false);
                }}
              >
                {t('confirmModal.cancel')}
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Waveform Editor Dialog */}
        {isWaveformEditorOpen && (
          <WaveformEditor
            sound={sound}
            masterVolume={masterVolume}
            onClose={() => setIsWaveformEditorOpen(false)}
            onSave={(trimStart, trimEnd) => {
              if (onEdit) {
                // If clearing (no selection), remove trim properties
                if (trimStart === 0 && trimEnd === sound.duration) {
                  onEdit({ trimStart: undefined, trimEnd: undefined });
                  toast.success(t('toast.trimCleared'));
                } else {
                  onEdit({ trimStart, trimEnd });
                  toast.success(t('toast.trimSaved'));
                }
              }
            }}
          />
        )}

        {/* Hotkey Setting Dialog */}
        <Dialog open={isHotkeyDialogOpen} onOpenChange={(open) => {
          setIsHotkeyDialogOpen(open);
          if (!open) {
            setIsCapturingHotkey(false);
            setHotkeyError('');
          }
        }}>
          <DialogContent className="sm:max-w-[400px]" onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle>{t('hotkeyDialog.title')}</DialogTitle>
              <DialogDescription>
                {t('hotkeyDialog.description', { title: sound.title })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Current Hotkey Display - Clickable */}
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="text-sm text-foreground-secondary">{t('hotkeyDialog.current')}</div>
                <button
                  className={cn(
                    "px-6 py-3 text-2xl font-bold font-mono text-center rounded-lg min-w-[100px] border-2 transition-all",
                    isCapturingHotkey
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-400 animate-pulse"
                      : "bg-surface-tertiary text-foreground-primary border-surface-border hover:border-primary hover:bg-surface-secondary cursor-pointer"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isCapturingHotkey) {
                      setIsCapturingHotkey(true);
                      setHotkeyError('');
                      toast.info(t('editModal.hotkeyLoop'));
                    }
                  }}
                >
                  {sound.hotkey ? formatKeyCode(sound.hotkey) : '−'}
                </button>
                <div className="flex items-center gap-2 text-xs text-center">
                  {isCapturingHotkey ? (
                    <>
                      <Keyboard size={14} className="text-blue-500 dark:text-blue-400 animate-bounce" />
                      <span className="text-blue-600 dark:text-blue-400 font-medium">{t('editModal.hotkeyLoop')} {t('editModal.pressEc')}</span>
                    </>
                  ) : (
                    <span className="text-foreground-tertiary">{t('hotkeyDialog.clickToSet')}</span>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {hotkeyError && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {hotkeyError}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                {sound.hotkey && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onEdit) {
                        onEdit({ hotkey: '' });
                      }
                      setEditHotkey('');
                      setHotkeyError('');
                      toast.success(t('toast.hotkeyCleared'));
                    }}
                  >
                    {t('editModal.clearHotkey')}
                  </Button>
                )}
                <Button
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsHotkeyDialogOpen(false);
                    setIsCapturingHotkey(false);
                    setHotkeyError('');
                  }}
                >
                  {t('editModal.done')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};