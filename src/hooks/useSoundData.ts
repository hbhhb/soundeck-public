import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { type Sound } from "../types";
import * as api from "../utils/api";
import { logger } from "../utils/logger";
import { logAnalyticsEvent } from "../utils/analytics";
import { toast } from "sonner@2.0.3";
import { getDefaultSounds } from "../constants/sounds";
import { supabase } from "../utils/supabase/client";
import { type StorageUsage, type User } from "../types";

export const useSoundData = (user: User | null) => {
    const { i18n, t } = useTranslation();
    const [sounds, setSounds] = useState<Sound[]>(() => getDefaultSounds(i18n.language));
    const [masterVolume, setMasterVolume] = useState(0.5);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [storageUsage, setStorageUsage] = useState<StorageUsage>({ currentUsage: 0, maxStorage: 15 * 1024 * 1024, usagePercent: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    // Ref to track if this is the first load
    const isInitialLoadRef = useRef(true);
    const settingsSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const soundsSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Track the last loaded data from server to avoid saving back what we just loaded
    const lastLoadedSoundsRef = useRef<Sound[] | null>(null);
    const lastLoadedSettingsRef = useRef<{ masterVolume: number; isDarkMode: boolean } | null>(null);

    const loadStorageUsage = async () => {
        try {
            const usage = await api.getStorageUsage();
            setStorageUsage(usage);
        } catch (error) {
            logger.error('Error loading storage usage:', error);
        }
    };

    const loadUserData = useCallback(async (userId: string, showLoadingScreen = true) => {
        try {
            // Verify session exists before making requests to avoid "Auth session missing" errors
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                logger.warn('⚠️ No active session found during data load, aborting');
                return;
            }

            // Only show loading skeleton on initial load
            if (showLoadingScreen && isInitialLoadRef.current) {
                setIsLoading(true);
            }

            logger.log('📥 Loading user data from server...');
            logger.log('📥 User ID:', userId);

            // Load settings
            const { settings } = await api.getSettings();
            if (settings) {
                const settingsData = {
                    masterVolume: settings.masterVolume ?? 0.5,
                    isDarkMode: settings.isDarkMode ?? true
                };
                lastLoadedSettingsRef.current = settingsData;
                setMasterVolume(settingsData.masterVolume);
                setIsDarkMode(settingsData.isDarkMode);
                logger.log('✅ Settings loaded:', settings);
            }

            // Load sounds - use server data as-is (preserves order, edits, etc.)
            const { sounds: userSounds } = await api.getSounds();
            logger.log('📦 Raw response from server:', { sounds: userSounds });
            logger.log('📦 Number of sounds received:', userSounds?.length || 0);
            logger.log('📦 Custom sounds received:', userSounds?.filter((s) => !s.isDefault).length || 0);
            logger.log('📦 Custom sounds details:', userSounds?.filter((s) => !s.isDefault));

            if (userSounds && Array.isArray(userSounds) && userSounds.length > 0) {
                // Server has saved data - use it completely (includes order, edits, custom sounds)
                lastLoadedSoundsRef.current = userSounds;
                setSounds(userSounds);
                logger.log(`✅ Loaded ${userSounds.length} sounds from server`);
            } else {
                logger.log('ℹ️ No saved sounds found, keeping defaults');
            }

            // Load storage usage
            await loadStorageUsage();

            // Mark data as fully loaded to enable auto-save
            setIsDataLoaded(true);
        } catch (error) {
            logger.error('❌ Error loading user data:', error);
            if (isInitialLoadRef.current) {
                toast.error(t('toast.failedToLoadData'));
            }
        } finally {


            // Always set loading to false after data load attempt
            setIsLoading(false);
            isInitialLoadRef.current = false; // Mark that initial load is complete
        }
    }, []);

    // Auto-save settings with debounce
    useEffect(() => {
        if (!user || !isDataLoaded) return;

        // Check if current state matches safe-to-ignore server state
        const lastSettings = lastLoadedSettingsRef.current;
        if (lastSettings &&
            lastSettings.masterVolume === masterVolume &&
            lastSettings.isDarkMode === isDarkMode) {
            // This change matches what we just loaded from server. Skip save.
            return;
        }

        // Clear existing timeout
        if (settingsSaveTimeoutRef.current) {
            clearTimeout(settingsSaveTimeoutRef.current);
        }

        // Set new timeout
        settingsSaveTimeoutRef.current = setTimeout(async () => {
            try {
                await api.saveSettings({ masterVolume, isDarkMode });
                logger.log('✅ Settings auto-saved');
                // notifyOtherTabs(); // Removed to avoid loops? No, keep logic same, just logging text.
                // Actually this log isn't a toast. 
                // Wait, line 125 is logger.log. 
                // Ah, I scanned useSoundData and saw toasts.
                // Let's look at lines 221, 228, 237, 241, 246, 254, 265, 269.
                notifyOtherTabs();
                settingsSaveTimeoutRef.current = null;
            } catch (error) {
                logger.error('Failed to auto-save settings:', error);
                settingsSaveTimeoutRef.current = null;
            }
        }, 1000);

        return () => {
            if (settingsSaveTimeoutRef.current) {
                clearTimeout(settingsSaveTimeoutRef.current);
            }
        };
    }, [masterVolume, isDarkMode, user, isDataLoaded]);

    // Auto-save sounds with debounce
    useEffect(() => {
        if (!user || !isDataLoaded) return;

        // Reference check: If the current sounds array is EXACTLY the same reference 
        // as what we loaded from server, it means NO user changes happened.
        if (sounds === lastLoadedSoundsRef.current) {
            return;
        }

        // Clear existing timeout
        if (soundsSaveTimeoutRef.current) {
            clearTimeout(soundsSaveTimeoutRef.current);
        }

        // Set new timeout
        soundsSaveTimeoutRef.current = setTimeout(async () => {
            try {
                await api.saveSounds(sounds);
                logger.log('✅ Sounds auto-saved');
                notifyOtherTabs();
                soundsSaveTimeoutRef.current = null;
            } catch (error) {
                logger.error('Failed to auto-save sounds:', error);
                soundsSaveTimeoutRef.current = null;
            }
        }, 1000);

        return () => {
            if (soundsSaveTimeoutRef.current) {
                clearTimeout(soundsSaveTimeoutRef.current);
            }
        };
    }, [sounds, user, isDataLoaded]);

    // Handle drag and drop reordering
    const moveCard = useCallback(
        (dragIndex: number, hoverIndex: number) => {
            setSounds((prevSounds: Sound[]) => {
                const newSounds = [...prevSounds];
                const [draggedItem] = newSounds.splice(dragIndex, 1);
                newSounds.splice(hoverIndex, 0, draggedItem);
                return newSounds;
            });
        },
        [],
    );

    // Handle volume change
    const updateVolume = useCallback(
        (id: string, volume: number) => {
            setSounds((prevSounds: Sound[]) =>
                prevSounds.map((sound: Sound) =>
                    sound.id === id ? { ...sound, volume } : sound,
                ),
            );
        },
        [],
    );

    // Handle sound update (title, emoji, etc.)
    const updateSound = useCallback(
        (id: string, updates: Partial<Sound>) => {
            setSounds((prevSounds: Sound[]) =>
                prevSounds.map((sound: Sound) =>
                    sound.id === id ? { ...sound, ...updates } : sound,
                ),
            );
        },
        [],
    );

    const deleteSound = async (id: string) => {
        // Find the sound to delete
        const soundToDelete = sounds.find((s: Sound) => s.id === id);
        if (!soundToDelete) return;

        // If it's a default sound, just remove from local state
        if (soundToDelete.isDefault) {
            setSounds((prev: Sound[]) => prev.filter((s: Sound) => s.id !== id));
            toast.info(t('toast.soundRemoved'));
            logAnalyticsEvent({ name: 'event_delete_sound', params: { sound_id: id } });
            return;
        }

        // If it's a user-uploaded sound and user is logged in, delete from server
        if (user) {
            try {
                toast.loading(t('toast.deletingSound'), { id: `delete-${id}` });
                await api.deleteSound(id);

                // Remove from local state
                setSounds((prev: Sound[]) => prev.filter((s: Sound) => s.id !== id));

                // Refresh storage usage
                await loadStorageUsage();

                toast.success(t('toast.soundDeleted'), { id: `delete-${id}` });

                logAnalyticsEvent({ name: 'event_delete_sound', params: { sound_id: id } });

                notifyOtherTabs();
            } catch (error) {
                logger.error('Error deleting sound:', error);
                toast.error(t('toast.failedToDeleteSound'), { id: `delete-${id}` });
            }
        } else {
            // User not logged in, just remove from local state
            setSounds((prev: Sound[]) => prev.filter((s: Sound) => s.id !== id));
            toast.info(t('toast.soundRemoved'));
        }
    };

    const resetToDefaults = async () => {
        if (!user) return;

        try {
            toast.loading(t('toast.resettingToDefaults'), { id: "reset" });

            // Call backend to delete all files and data
            await api.resetToDefaults();

            // Reset local state to defaults
            setSounds(getDefaultSounds(i18n.language));
            setMasterVolume(0.5);
            setIsDarkMode(true);
            setStorageUsage({ currentUsage: 0, maxStorage: 15 * 1024 * 1024, usagePercent: 0 });

            toast.success(t('toast.resetToDefaultsSuccess'), { id: "reset" });

            logAnalyticsEvent({ name: 'event_restore_default_setting', params: { user_id: user.id } });

            notifyOtherTabs();
        } catch (error) {
            logger.error('Error resetting to defaults:', error);
            toast.error(t('toast.resetToDefaultsFailed'), { id: "reset" });
        }
    };

    const handleMasterVolumeChange = (value: number) => {
        setMasterVolume(value);
    };

    const toggleTheme = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        logAnalyticsEvent({
            name: 'event_screen_mode_modified',
            params: {
                prev_mode: isDarkMode ? 'dark' : 'light',
                curr_mode: newMode ? 'dark' : 'light'
            }
        });
    };

    // BroadcastChannel for cross-tab synchronization
    useEffect(() => {
        const channel = new BroadcastChannel('soundeck_sync');

        channel.onmessage = (event) => {
            if (event.data === 'SYNC_REQUIRED' && user?.id) {
                // If we have pending local changes, ignore sync to prevent overwriting user's work
                if (settingsSaveTimeoutRef.current || soundsSaveTimeoutRef.current) {
                    logger.warn('⚠️ Pending local changes detected. Ignoring remote sync request.');
                    return;
                }

                logger.log('🔄 SYNC_REQUIRED received from another tab. Reloading data...');
                // Reload data without showing loading screen to avoid interruption
                loadUserData(user.id, false);
            }
        };

        return () => {
            channel.close();
        };
    }, [user, loadUserData]);

    const notifyOtherTabs = () => {
        const channel = new BroadcastChannel('soundeck_sync');
        channel.postMessage('SYNC_REQUIRED');
        channel.close();
    };

    // Helper to reset internal state (used when signing out or deleting account)
    const resetLocalState = useCallback(() => {
        setSounds(getDefaultSounds(i18n.language));
        setMasterVolume(0.5);
        setIsDarkMode(true);
        setStorageUsage({ currentUsage: 0, maxStorage: 15 * 1024 * 1024, usagePercent: 0 });
        setIsLoading(false);
        isInitialLoadRef.current = true;
        setIsDataLoaded(false);
    }, [i18n.language]);

    // Dynamic localization update for guest users (unmodified default sounds)
    useEffect(() => {
        if (!user && sounds.length > 0) {
            const localizedDefaults = getDefaultSounds(i18n.language);

            setSounds(currentSounds =>
                currentSounds.map(sound => {
                    // Only update if it's a default sound
                    if (sound.isDefault) {
                        const newDefault = localizedDefaults.find(d => d.id === sound.id);
                        // If found and ONLY the title is different (meaning user hasn't heavily modified it, 
                        // though strictly we're just updating title for all defaults here to be safe and simple 
                        // as per request for 'guest view'), update title.
                        // Ideally we should check if user 'renamed' it, but tracking 'renamed' state isn't in Sound type.
                        // Strategy: Always update title for isDefault items to match current language for guests.
                        if (newDefault) {
                            return { ...sound, title: newDefault.title };
                        }
                    }
                    return sound;
                })
            );
        }
    }, [i18n.language, user]);

    return {
        sounds,
        setSounds,
        masterVolume,
        setMasterVolume,
        isDarkMode,
        setIsDarkMode,
        toggleTheme,
        storageUsage,
        setStorageUsage,
        isLoading,
        setIsLoading,
        isDataLoaded,
        setIsDataLoaded,
        loadUserData,
        moveCard,
        updateVolume,
        updateSound,
        deleteSound,
        resetToDefaults,
        resetLocalState,
        handleMasterVolumeChange,
        loadStorageUsage,
        isInitialLoadRef
    };
};
