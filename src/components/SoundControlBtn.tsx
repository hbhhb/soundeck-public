import React from 'react';
import { Button } from './ui/button';
import { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface SoundControlBtnProps {
  onClick: (e: React.MouseEvent) => void;
  icon: LucideIcon;
  label: string;
  className?: string;
}

export const SoundControlBtn = ({ onClick, icon: Icon, label, className }: SoundControlBtnProps) => {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "w-full h-[36px] rounded-[12px] transition-colors px-[16px] py-[8px] gap-[4px] bg-surface-secondary text-foreground-primary hover:bg-surface-tertiary border-surface-border",
        className
      )}
      onClick={onClick}
    >
      <Icon size={12} className="fill-current" />
      <span className="hidden sm:inline font-semibold text-[14px] leading-[20px] tracking-[-0.1504px] px-[2px] py-[0px]">
        {label}
      </span>
    </Button>
  );
};
