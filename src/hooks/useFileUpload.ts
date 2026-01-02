import { useRef } from "react";
import { toast } from "sonner@2.0.3";
import * as api from "../utils/api";
import { logger } from "../utils/logger";
import { logAnalyticsEvent } from "../utils/analytics";
import { compressAudio } from "../utils/audioCompressor";
import { type User, type Sound } from "../types";
import { useTranslation } from "react-i18next";

// Helper to check if file size is too large
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface UseFileUploadProps {
    user: User | null;
    setSounds: (callback: (prev: Sound[]) => Sound[]) => void;
    loadStorageUsage: () => Promise<void>;
    setIsSignInModalOpen: (isOpen: boolean) => void;
}

export const useFileUpload = ({
    user,
    setSounds,
    loadStorageUsage,
    setIsSignInModalOpen,
}: UseFileUploadProps) => {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadSourceRef = useRef<'header' | 'soundcard_area'>('header');

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        // Check if user is logged in
        if (!user) {
            setIsSignInModalOpen(true);
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        // Upload each file to server
        for (const originalFile of Array.from(files)) {
            let toastId: string | number | undefined;
            try {
                // Check file size before uploading (initial check)
                if (originalFile.size > MAX_FILE_SIZE) {
                    toast.error(t('toast.fileTooLargeWithName', { name: originalFile.name }));
                    logAnalyticsEvent({
                        name: 'event_fail_upload_sound',
                        params: {
                            file_ext: originalFile.name.split('.').pop() || '',
                            error_code: 'File too large (client check)',
                            file_size: originalFile.size
                        }
                    });
                    continue;
                }

                const loadingId = toast.loading(t('toast.processing', { name: originalFile.name }));
                toastId = loadingId;

                // Compress/Optimize Audio
                let fileToUpload = originalFile;
                try {
                    fileToUpload = await compressAudio(originalFile);
                    logger.log(`Sound optimized: ${originalFile.size} -> ${fileToUpload.size} bytes`);
                } catch (compError) {
                    logger.warn("Compression skipped due to error, using original file", compError);
                }

                // Update toast
                toast.loading(t('toast.uploading', { name: fileToUpload.name }), { id: toastId });

                // Upload to server
                const uploadData = await api.uploadAudioFile(fileToUpload);

                // Create audio element to get duration
                const audio = new Audio(uploadData.fileUrl);

                await new Promise((resolve, reject) => {
                    audio.onloadedmetadata = () => {
                        const newSound: Sound = {
                            id: uploadData.id,
                            title: originalFile.name.replace(/\.[^/.]+$/, ""), // Keep original title without extension
                            fileUrl: uploadData.fileUrl,
                            duration: audio.duration || 0,
                            hotkey: "", // User can assign later
                            volume: 0.5, // Default volume
                            fileName: uploadData.fileName,
                            isDefault: false,
                        };

                        setSounds((prev) => [...prev, newSound]);
                        toast.success(t('toast.addedSound', { title: newSound.title }), { id: toastId });

                        logAnalyticsEvent({
                            name: 'event_upload_sound',
                            params: {
                                file_ext: originalFile.name.split('.').pop() || '',
                                file_size: originalFile.size
                            }
                        });

                        resolve(null);
                    };

                    audio.onerror = () => {
                        toast.error(t('toast.failedToLoadAudio', { name: fileToUpload.name }), { id: toastId });
                        reject(new Error('Failed to load audio'));
                    };

                    audio.load();
                });

                // Refresh storage usage
                await loadStorageUsage();
            } catch (error: unknown) {
                logger.error('Upload error:', error);

                let errorMessage = '';
                if (error instanceof Error) {
                    errorMessage = error.message;
                } else if (typeof error === 'object' && error !== null && 'message' in error) {
                    errorMessage = String((error as { message: unknown }).message);
                }

                // Use simple toast if toastId wasn't created yet
                const options = toastId ? { id: toastId } : {};

                // Handle specifically known error cases
                if (errorMessage.includes('Storage limit exceeded') || errorMessage.includes('privelege')) {
                    toast.error(t('toast.storageLimitExceeded'), options);
                } else if (errorMessage.includes('File too large') || errorMessage.includes('payload')) {
                    toast.error(t('toast.fileTooLarge'), options);
                } else {
                    // Fallback generic error
                    toast.error(t('toast.uploadFailed', { name: originalFile.name, error: errorMessage }), options);
                }

                logAnalyticsEvent({
                    name: 'event_fail_upload_sound',
                    params: {
                        file_ext: originalFile.name.split('.').pop() || '',
                        error_code: errorMessage,
                        file_size: originalFile.size
                    }
                });
            }
        }

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleAddAudioClick = (source: 'header' | 'soundcard_area' = 'header') => {
        if (!user) {
            logAnalyticsEvent({ name: 'click_signup', params: { trigger_source: 'Save_popup' } });
            setIsSignInModalOpen(true);
            return;
        }
        uploadSourceRef.current = source;
        fileInputRef.current?.click();
    };

    return {
        fileInputRef,
        handleFileUpload,
        handleAddAudioClick,
    };
};
