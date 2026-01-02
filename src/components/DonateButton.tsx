// src/components/DonateButton.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react';
import { Button } from './ui/button';

type DonateButtonProps = {
  className?: string;
  onClick?: () => void;
};

// Donate link using project button styles for consistent theming
export default function DonateButton({ className, onClick }: DonateButtonProps) {
  const { t } = useTranslation();
  const bmcUrl = "https://www.buymeacoffee.com/hbhb";

  const handleClick = () => {
    // Close popover if onClick handler is provided
    onClick?.();
    // Link will open in new tab via href
  };

  return (
    <Button
      asChild
      variant="ghost"
      className={`group gap-2 text-sm text-foreground-primary hover:bg-surface-secondary ${className || ''}`}
    >
      <a
        href={bmcUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2"
        onClick={handleClick}
      >
        <Heart size={16} className="transition-transform duration-200 group-hover:scale-110" />
        <span>{t('common.buyMeACoffee')}</span>
      </a>
    </Button>
  );
}