import React from "react";
import { useTranslation } from "react-i18next";
import { logAnalyticsEvent } from "../utils/analytics";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Music, Plus } from "lucide-react";
import { DraggableSoundCard } from "./DraggableSoundCard";
import { SoundCard } from "./SoundCard";
import { CustomDragLayer } from "./CustomDragLayer";
import { type Sound } from "../types";

interface SoundGridProps {
  isLoading: boolean;
  sounds: Sound[];
  filteredSounds: Sound[];
  searchQuery: string;
  masterVolume: number;
  moveCard: (dragIndex: number, hoverIndex: number) => void;
  deleteSound: (id: string) => void;
  updateVolume: (id: string, volume: number) => void;
  updateSound: (id: string, updates: Partial<Sound>) => void;
  handleAddAudio: () => void;
}

export const SoundGrid: React.FC<SoundGridProps> = ({
  isLoading,
  sounds,
  filteredSounds,
  searchQuery,
  masterVolume,
  moveCard,
  deleteSound,
  updateVolume,
  updateSound,
  handleAddAudio,
}) => {
  const { t } = useTranslation();
  // Service Introduction - Compact
  const introduction = (
    <div className="mb-[32px] text-center max-w-3xl mx-auto px-4 md:px-8 lg:px-12 mt-[8px]">
      <h1 className="font-['Sora'] text-2xl md:text-3xl font-bold text-foreground-primary mb-2">
        {t('hero.title')}
      </h1>
      <p className="text-sm md:text-base text-foreground-secondary whitespace-pre-line">
        {t('hero.description')}
      </p>
    </div>
  );

  if (isLoading) {
    return (
      <main className="container mx-auto px-[16px] py-[24px] md:pt-[16px] pr-[16px] pb-[40px] pl-[16px] pt-[16px]">
        {introduction}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="relative flex flex-col rounded-[14px] border border-surface-secondary bg-card overflow-hidden"
            >
              <div className="relative p-[16px] flex flex-col h-full">
                <div className="flex flex-col gap-[6px] w-full mb-[12px]">
                  <div className="flex items-start justify-between w-full">
                    <div className="w-[24px] h-[24px] bg-surface-tertiary rounded skeleton" />
                    <div className="hidden md:block w-[40px] h-[24px] bg-surface-tertiary rounded-[4px] skeleton" />
                    <div className="md:hidden w-[36px] h-[36px] bg-surface-tertiary rounded-[8px] skeleton" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-[24px] bg-surface-tertiary rounded skeleton w-3/4" />
                  </div>
                  <div className="hidden md:block h-[48px] w-full bg-surface-tertiary rounded skeleton" />
                  <div className="h-[16px] bg-surface-tertiary rounded skeleton w-[80px]" />
                </div>
                <div className="flex gap-[4px] items-start w-full">
                  <div className="flex-1 h-[36px] bg-surface-tertiary rounded-[12px] skeleton" />
                  <div className="hidden md:block w-[36px] h-[36px] bg-surface-tertiary rounded-[12px] skeleton" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (filteredSounds.length === 0) {
    return (
      <main className="container mx-auto px-[16px] py-[24px] md:pt-[16px] pr-[16px] pb-[40px] pl-[16px] pt-[16px]">
        {introduction}
        <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500 dark:text-gray-400">
          <Music size={48} className="mb-4 opacity-20" />
          <h3 className="text-lg font-medium mb-1">No sounds found</h3>
          <p className="text-sm opacity-70">
            Try adjusting your search or add new audio files.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-[16px] py-[24px] md:pt-[16px] pr-[16px] pb-[40px] pl-[16px] pt-[16px]">
      {introduction}
      <DndProvider backend={HTML5Backend}>
        <CustomDragLayer sounds={sounds} masterVolume={masterVolume} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {searchQuery
            ? // When searching, show non-draggable cards
            filteredSounds.map((sound) => (
              <div key={sound.id}>
                <SoundCard
                  sound={sound}
                  masterVolume={masterVolume}
                  onDelete={() => deleteSound(sound.id)}
                  onVolumeChange={(volume) => updateVolume(sound.id, volume)}
                  onEdit={(updates) => updateSound(sound.id, updates)}
                  allSounds={sounds}
                />
              </div>
            ))
            : // When not searching, show draggable cards
            sounds.map((sound, index) => (
              <DraggableSoundCard
                key={sound.id}
                sound={sound}
                index={index}
                masterVolume={masterVolume}
                moveCard={moveCard}
                onDelete={() => deleteSound(sound.id)}
                onVolumeChange={(volume) => updateVolume(sound.id, volume)}
                onEdit={(updates) => updateSound(sound.id, updates)}
                allSounds={sounds}
              />
            ))}

          {/* Add Audio Card - Only show when not searching */}
          {!searchQuery && (
            <button
              onClick={() => {
                logAnalyticsEvent({ name: 'click_add_sound', params: { method: 'soundcard_area' } });
                handleAddAudio();
              }}
              className="w-full rounded-xl border-2 border-dashed border-surface-border hover:border-primary/50 bg-background hover:bg-surface-secondary transition-all duration-200 flex flex-col items-center justify-center gap-2 group py-12"
            >
              <div className="w-12 h-12 rounded-full bg-surface-tertiary group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                <Plus
                  size={24}
                  className="text-foreground-secondary group-hover:text-primary transition-colors"
                />
              </div>
              <div className="text-sm font-medium text-foreground-secondary group-hover:text-foreground-primary transition-colors">
                {t('header.addAudio')}
              </div>
            </button>
          )}
        </div>
      </DndProvider>
    </main>
  );
};
