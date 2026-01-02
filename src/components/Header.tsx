import React, { useState, useRef, useEffect } from "react";
import { logAnalyticsEvent } from "../utils/analytics";
import {
  Moon,
  Sun,
  Plus,
  Search,
  Volume2,
  VolumeX,
  Menu,
  X,
  LogIn,
  LogOut,
  User as UserIcon,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import Logo from "../imports/Logo";
import { logger } from "../utils/logger";
import { supabase } from "../utils/supabase/client";
import * as api from "../utils/api";
import { type User, type StorageUsage } from "../types";
import DonateButton from "./DonateButton";

interface HeaderProps {
  isScrolled: boolean;
  isDarkMode: boolean;
  toggleTheme: () => void;
  user: User | null;
  masterVolume: number;
  onMasterVolumeChange: (value: number) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  storageUsage: StorageUsage;
  onSignIn: () => void;
  onSignOut: () => void;
  onResetToDefaults: () => void;
  onDeleteAccount: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAddAudioClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isScrolled,
  isDarkMode,
  toggleTheme,
  user,
  masterVolume,
  onMasterVolumeChange,
  searchQuery,
  onSearchQueryChange,
  storageUsage,
  onSignIn,
  onSignOut,
  onResetToDefaults,
  onDeleteAccount,
  fileInputRef,
  onFileUpload,
  onAddAudioClick,
}) => {
  const { t } = useTranslation();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isProfilePopoverOpen, setIsProfilePopoverOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const startVolumeRef = useRef<number>(masterVolume);

  // Auto-focus mobile search input when expanded
  useEffect(() => {
    if (isMobileSearchOpen && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [isMobileSearchOpen]);

  // Reset to home state (clear search and close mobile search)
  const resetToHome = () => {
    onSearchQueryChange("");
    setIsMobileSearchOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 bg-background ${isScrolled ? "border-b border-border shadow-sm" : ""
        }`}
    >
      <div className="container mx-auto pl-[20px] pr-[16px] sm:px-4 h-[56px] md:h-16 flex items-center justify-between gap-2 md:gap-4 overflow-hidden">
        {/* Logo / Title - Hidden on mobile when search is active */}
        {!isMobileSearchOpen && (
          <button
            onClick={resetToHome}
            className="flex items-center gap-2 shrink-0 hover:opacity-70 transition-opacity"
          >
            <div className="h-[32px] w-[112px]">
              <Logo />
            </div>
          </button>
        )}

        {/* Mobile: Search Input (visible when isMobileSearchOpen) */}
        {isMobileSearchOpen && (
          <div className="md:hidden flex-1 relative">
            <Input
              ref={mobileSearchInputRef}
              type="text"
              placeholder={t('header.searchPlaceholder')}
              className="h-10 bg-surface-tertiary border-transparent focus:bg-card transition-all w-full pr-8"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  onSearchQueryChange("");
                  mobileSearchInputRef.current?.focus();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-surface-secondary"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {/* Desktop: Actions */}
        <div className="hidden md:flex items-center gap-2 shrink-0 ml-auto">
          {/* Desktop: Always visible Search - HIDDEN as per original code */}
          {false && (
            <div className="relative w-64">
              <Input
                ref={searchInputRef}
                type="text"
                placeholder={t('header.searchPlaceholder')}
                className="h-9 bg-surface-tertiary border-transparent focus:bg-card transition-all w-full pr-8"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    onSearchQueryChange("");
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-surface-secondary"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          {/* Desktop: Master Volume Control - Inline */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg">
            {masterVolume === 0 ? (
              <VolumeX size={18} className="text-foreground-secondary shrink-0" />
            ) : (
              <Volume2 size={18} className="text-foreground-secondary shrink-0" />
            )}
            <Slider
              value={[masterVolume]}
              min={0}
              max={1}
              step={0.05}
              onValueChange={(value) => onMasterVolumeChange(value[0])}
              onPointerDown={() => { startVolumeRef.current = masterVolume; }}
              onValueCommit={(value) => {
                logAnalyticsEvent({
                  name: 'event_volume_controlled',
                  params: {
                    volume_type: 'master',
                    source_id: 'master',
                    prev_vol: startVolumeRef.current,
                    curr_vol: value[0]
                  }
                });
              }}
              className="w-28"
            />
            <span className="text-xs font-mono text-foreground-secondary min-w-[2rem] text-right">
              {Math.round(masterVolume * 100)}%
            </span>
          </div>

          {/* Tablet/Mobile: Master Volume Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="xl:hidden rounded-full hover:bg-gray-200 dark:hover:bg-[#323234] text-foreground-secondary hover:text-foreground-primary"
              >
                {masterVolume === 0 ? (
                  <VolumeX size={24} />
                ) : (
                  <Volume2 size={24} />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 bg-card border-surface-border" align="end">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground-primary">
                    {t('header.masterVolume')}
                  </label>
                  <span className="text-sm font-mono text-foreground-secondary">
                    {Math.round(masterVolume * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {masterVolume === 0 ? (
                    <VolumeX size={18} className="text-foreground-secondary shrink-0" />
                  ) : (
                    <Volume2 size={18} className="text-foreground-secondary shrink-0" />
                  )}
                  <Slider
                    value={[masterVolume]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={(value) => onMasterVolumeChange(value[0])}
                    onPointerDown={() => { startVolumeRef.current = masterVolume; }}
                    onValueCommit={(value) => {
                      logAnalyticsEvent({
                        name: 'event_volume_controlled',
                        params: {
                          volume_type: 'master',
                          source_id: 'master',
                          prev_vol: startVolumeRef.current,
                          curr_vol: value[0]
                        }
                      });
                    }}
                    className="flex-1"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full hover:bg-gray-200 dark:hover:bg-[#323234] text-foreground-secondary hover:text-foreground-primary"
          >
            {isDarkMode ? (
              <Sun size={24} />
            ) : (
              <Moon size={24} />
            )}
          </Button>

          {/* Language Switcher Desktop */}
          <LanguageSwitcher />

          {/* Auth: User Profile or Sign In with Google */}
          {user ? (
            <Popover open={isProfilePopoverOpen} onOpenChange={setIsProfilePopoverOpen}>
              <PopoverTrigger asChild>
                <button className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-200 dark:border-[#323234] hover:border-gray-300 dark:hover:border-[#404042] transition-colors shrink-0 mr-1">
                  {user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                    <img
                      src={user.user_metadata?.avatar_url || user.user_metadata?.picture}
                      alt={user.email || "User"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-[#323234] flex items-center justify-center">
                      <UserIcon size={18} className="text-foreground-secondary" />
                    </div>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3 bg-card border-surface-border" align="end">
                <div className="space-y-3">
                  <div className="px-2 py-2">
                    <p className="text-xs text-foreground-secondary mb-1">{t('header.signedInAs')}</p>
                    <p className="text-sm font-medium text-foreground-primary truncate">
                      {user.email}
                    </p>
                  </div>

                  {/* Storage Usage */}
                  <div className="px-3 py-3 bg-surface-tertiary rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-medium text-foreground-primary">{t('header.storage')}</p>
                      <span className="text-xs font-mono text-foreground-secondary">
                        {Math.round(storageUsage?.usagePercent || 0)}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-2.5 overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full transition-all duration-300 bg-primary"
                        style={{ width: `${Math.min(storageUsage?.usagePercent || 0, 100)}%` }}
                      />
                    </div>

                    {/* Storage Numbers */}
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono text-foreground-primary">
                        {api.formatMB(storageUsage?.currentUsage || 0)}
                      </span>
                      <span className="text-xs font-mono text-foreground-tertiary">
                        / {api.formatMB(storageUsage?.maxStorage || 15 * 1024 * 1024)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t dark:border-[#323234]" />
                  <Button
                    onClick={() => {
                      setIsProfilePopoverOpen(false);
                      onResetToDefaults();
                    }}
                    variant="ghost"
                    className="w-full justify-start gap-2 text-sm text-foreground-primary hover:bg-surface-secondary"
                  >
                    <RotateCcw size={16} />
                    {t('header.resetToDefaults')}
                  </Button>
                  <DonateButton className="w-full justify-start" />
                  <Button
                    onClick={onSignOut}
                    variant="ghost"
                    className="w-full justify-start gap-2 text-sm text-foreground-primary hover:bg-surface-secondary"
                  >
                    <LogOut size={16} />
                    {t('header.signOut')}
                  </Button>
                  <div className="border-t dark:border-[#323234]" />
                  <Button
                    onClick={() => {
                      setIsProfilePopoverOpen(false);
                      onDeleteAccount();
                    }}
                    variant="ghost"
                    className="w-full justify-start gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  >
                    <Trash2 size={16} />
                    {t('header.deleteAccount')}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <Button
              onClick={() => {
                logAnalyticsEvent({ name: 'click_signup', params: { trigger_source: 'Header_btn' } });
                onSignIn();
              }}
              variant="outline"
              className="gap-2 text-sm mr-[4px] mt-[0px] mb-[0px] ml-[0px]"
            >
              <svg width="16" height="16" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.9181H37.4434C36.9055 31.8988 35.177 34.5356 32.6461 36.2111V42.2078H40.3801C44.9217 38.0278 47.532 31.8547 47.532 24.5528Z" fill="currentColor" />
                <path d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.3888 42.2078L32.6549 36.2111C30.5031 37.675 27.7252 38.5039 24.4888 38.5039C18.2275 38.5039 12.9187 34.2798 11.0139 28.6006H3.03296V34.7825C7.10718 42.8868 15.4056 48.0016 24.48 48.0016Z" fill="currentColor" />
                <path d="M11.0051 28.6006C9.99973 25.6199 9.99973 22.3922 11.0051 19.4115V13.2296H3.03298C-0.371021 20.0112 -0.371021 28.0009 3.03298 34.7825L11.0051 28.6006Z" fill="currentColor" />
                <path d="M24.48 9.49932C27.9016 9.44641 31.2086 10.7339 33.6866 13.0973L40.5387 6.24523C36.2 2.17101 30.4414 -0.068932 24.48 0.00161733C15.4055 0.00161733 7.10718 5.11644 3.03296 13.2296L11.005 19.4115C12.901 13.7235 18.2187 9.49932 24.48 9.49932Z" fill="currentColor" />
              </svg>
              {t('header.signInWithGoogle')}
            </Button>
          )}

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="audio/*"
            multiple
            onChange={onFileUpload}
          />
          <Button
            onClick={() => {
              logAnalyticsEvent({ name: 'click_add_sound', params: { method: 'header' } });
              onAddAudioClick();
            }}
            className="gap-2 shadow-lg"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">
              {t('header.addAudio')}
            </span>
          </Button>
        </div>

        {/* Mobile: Right Side Actions */}
        <div className="md:hidden flex items-center gap-2 shrink-0">
          {isMobileSearchOpen ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileSearchOpen(false)}
              className="text-sm"
            >
              {t('header.cancel')}
            </Button>
          ) : (
            <>
              {/* Mobile: Search Button - HIDDEN as per original code */}
              {false && (
                <Button
                  variant="ghost"
                  className="w-10 h-10 p-0 rounded-full hover:bg-gray-200 dark:hover:bg-[#323234] text-foreground-secondary hover:text-foreground-primary"
                  onClick={() => setIsMobileSearchOpen(true)}
                >
                  <Search size={24} />
                </Button>
              )}

              {/* Mobile: Hamburger Menu */}
              <Popover open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-10 h-10 p-0 rounded-full hover:bg-gray-200 dark:hover:bg-[#323234] text-foreground-secondary hover:text-foreground-primary"
                  >
                    <Menu size={24} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[calc(100vw-32px)] max-w-[360px] p-2 bg-card border-surface-border"
                  align="end"
                  sideOffset={8}
                  collisionPadding={16}
                >
                  <div className="space-y-1">
                    {/* Auth Section */}
                    {user ? (
                      <>
                        <div className="px-3 py-2 bg-surface-tertiary rounded-md mb-2">
                          <p className="text-xs text-foreground-secondary mb-1">{t('header.signedInAs')}</p>
                          <p className="text-sm font-medium text-foreground-primary truncate">
                            {user.email}
                          </p>
                        </div>

                        {/* Storage Usage */}
                        <div className="px-3 py-3 bg-surface-tertiary rounded-md mb-2">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-medium text-foreground-primary">{t('header.storage')}</p>
                            <span className="text-xs font-mono text-foreground-secondary">
                              {Math.round(storageUsage?.usagePercent || 0)}%
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-2.5 overflow-hidden mb-2">
                            <div
                              className="h-full rounded-full transition-all duration-300 bg-primary"
                              style={{ width: `${Math.min(storageUsage?.usagePercent || 0, 100)}%` }}
                            />
                          </div>

                          {/* Storage Numbers */}
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-mono text-foreground-primary">
                              {api.formatMB(storageUsage?.currentUsage || 0)}
                            </span>
                            <span className="text-xs font-mono text-foreground-tertiary">
                              / {api.formatMB(storageUsage?.maxStorage || 15 * 1024 * 1024)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            onResetToDefaults();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-primary rounded-md hover:bg-surface-tertiary transition-colors"
                        >
                          <RotateCcw size={16} />
                          <span>{t('header.resetToDefaults')}</span>
                        </button>
                        <button
                          onClick={onSignOut}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-primary rounded-md hover:bg-surface-tertiary transition-colors"
                        >
                          <LogOut size={16} className="text-foreground-secondary" />
                          <span>{t('header.signOut')}</span>
                        </button>
                        <div className="h-px bg-surface-border my-1" />
                        <button
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            onDeleteAccount();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <Trash2 size={16} />
                          <span>{t('header.deleteAccount')}</span>
                        </button>
                        <div className="h-px bg-surface-border my-1" />
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            logAnalyticsEvent({ name: 'click_signup', params: { trigger_source: 'Header_btn' } });
                            onSignIn();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-primary rounded-md hover:bg-surface-tertiary transition-colors"
                        >
                          <LogIn size={16} className="text-foreground-secondary" />
                          <span>{t('header.signInWithGoogle')}</span>
                        </button>
                        <div className="h-px bg-surface-border my-1" />
                      </>
                    )}

                    {/* Master Volume */}
                    <div className="px-3 py-2 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-foreground-primary">
                          {t('header.masterVolume')}
                        </label>
                        <span className="text-xs font-mono text-foreground-secondary">
                          {Math.round(masterVolume * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {masterVolume === 0 ? (
                          <VolumeX
                            size={16}
                            className="text-foreground-secondary shrink-0"
                          />
                        ) : (
                          <Volume2
                            size={16}
                            className="text-foreground-secondary shrink-0"
                          />
                        )}
                        <Slider
                          value={[masterVolume]}
                          min={0}
                          max={1}
                          step={0.01}
                          onValueChange={(value) =>
                            onMasterVolumeChange(value[0])
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="h-px bg-surface-border my-1" />

                    {/* Theme Toggle */}
                    <button
                      onClick={toggleTheme}
                      className="flex items-center justify-between w-full px-3 py-2 rounded-md hover:bg-surface-tertiary transition-colors"
                    >
                      <span className="text-sm font-medium text-foreground-primary">
                        {t('header.theme')}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-foreground-secondary">
                          {isDarkMode ? t('header.themeDark') : t('header.themeLight')}
                        </span>
                        {isDarkMode ? (
                          <Moon size={16} className="text-foreground-secondary" />
                        ) : (
                          <Sun size={16} className="text-foreground-secondary" />
                        )}
                      </div>
                    </button>

                    <div className="h-px bg-surface-border my-1" />

                    {/* Mobile Language Switcher */}
                    <LanguageSwitcher variant="mobile" />
                  </div>
                </PopoverContent>
              </Popover>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="audio/*"
                multiple
                onChange={onFileUpload}
              />
              <Button
                onClick={() => {
                  logAnalyticsEvent({ name: 'click_add_sound', params: { method: 'header' } });
                  onAddAudioClick();
                }}
                size="icon"
                className="shadow-lg rounded-full"
              >
                <Plus size={24} />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
