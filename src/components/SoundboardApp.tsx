import React, { useState } from "react";
import { Header } from "./Header";
import { SoundGrid } from "./SoundGrid";
import { ConfirmModal } from "./ConfirmModal";
import { DeleteAccountModal } from "./DeleteAccountModal";
import { SignInModal } from "./SignInModal";
import { useAuth } from "../hooks/useAuth";
import { useSoundData } from "../hooks/useSoundData";
import { useFileUpload } from "../hooks/useFileUpload";
import { useSoundHotkeys } from "../hooks/useSoundHotkeys";
import { type User } from "../types";
import * as api from "../utils/api";
import { toast } from "sonner@2.0.3";
import { logger } from "../utils/logger";
import { logAnalyticsEvent } from "../utils/analytics";
import { supabase } from "../utils/supabase/client";
import { useTranslation } from "react-i18next";

export const SoundboardApp = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isDeleteAccountConfirmOpen, setIsDeleteAccountConfirmOpen] = useState(false);

  // Initialize hooks ensuring SoundData is available for Auth callbacks
  const {
    sounds,
    setSounds,
    masterVolume,
    setMasterVolume,
    isDarkMode,
    toggleTheme,
    storageUsage,
    isLoading,
    isDataLoaded,
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
  } = useSoundData(user);

  const { signInWithGoogle, signOut } = useAuth({
    user,
    setUser,
    onSignIn: React.useCallback((userId: string) => loadUserData(userId), [loadUserData]),
    onSignOut: React.useCallback(() => resetLocalState(), [resetLocalState]),
    isInitialLoadRef
  });

  const { fileInputRef, handleFileUpload, handleAddAudioClick } = useFileUpload({
    user,
    setSounds,
    loadStorageUsage,
    setIsSignInModalOpen,
  });

  useSoundHotkeys(sounds);

  // Apply dark mode to document element
  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Handle scroll for header styling - Window based
  const [isScrolled, setIsScrolled] = useState(false);
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handlers for Modals
  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      toast.loading(t('toast.deletingAccount'), { id: "delete-account" });
      await api.deleteAccount();

      resetLocalState();
      await supabase.auth.signOut();
      setUser(null);

      toast.success(t('toast.accountDeleted'), { id: "delete-account" });

      if (user?.id) {
        logAnalyticsEvent({ name: 'event_delete_account', params: { user_id: user.id } });
      }
    } catch (error) {
      logger.error('Error deleting account:', error);
      toast.error(t('toast.failedToDeleteAccount'), { id: "delete-account" });
    }
  };

  const handleResetConfirm = async () => {
    await resetToDefaults();
    setIsResetConfirmOpen(false);
  };

  // Search Query State (Managed here to pass to both Header and Grid)
  const [searchQuery, setSearchQuery] = useState("");
  const filteredSounds = sounds.filter((sound) =>
    sound.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div className="min-h-screen transition-colors duration-300 bg-background text-foreground w-full">
        <Header
          isScrolled={isScrolled}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          user={user}
          masterVolume={masterVolume}
          onMasterVolumeChange={handleMasterVolumeChange}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          storageUsage={storageUsage}
          onSignIn={signInWithGoogle}
          onSignOut={signOut}
          onResetToDefaults={() => setIsResetConfirmOpen(true)}
          onDeleteAccount={() => setIsDeleteAccountConfirmOpen(true)}
          fileInputRef={fileInputRef}
          onFileUpload={handleFileUpload}
          onAddAudioClick={handleAddAudioClick}
        />

        <SoundGrid
          isLoading={isLoading}
          sounds={sounds}
          filteredSounds={filteredSounds}
          searchQuery={searchQuery}
          masterVolume={masterVolume}
          moveCard={moveCard}
          deleteSound={deleteSound}
          updateVolume={updateVolume}
          updateSound={updateSound}
          handleAddAudio={handleAddAudioClick}
        />

        {/* Sign In Modal */}
        <SignInModal
          isOpen={isSignInModalOpen}
          onClose={() => setIsSignInModalOpen(false)}
          onSignIn={signInWithGoogle}
        />

        {/* Reset Confirmation Modal */}
        <ConfirmModal
          isOpen={isResetConfirmOpen}
          onClose={() => setIsResetConfirmOpen(false)}
          onConfirm={handleResetConfirm}
          title={t('confirmModal.resetTitle')}
          description={t('confirmModal.resetDescription')}
          confirmText={t('header.resetToDefaults')}
          cancelText={t('confirmModal.cancel')}
          variant="destructive"
        />

        {/* Delete Account Confirmation Modal */}
        <DeleteAccountModal
          isOpen={isDeleteAccountConfirmOpen}
          onClose={() => setIsDeleteAccountConfirmOpen(false)}
          onConfirm={handleDeleteAccount}
          storageUsageStr={api.formatMB(storageUsage?.currentUsage || 0)}
        />
      </div>
    </div>
  );
};