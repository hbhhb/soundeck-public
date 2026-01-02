
import React from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
import { Button } from "./ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "./ui/popover";
import { cn } from "../lib/utils";

interface LanguageSwitcherProps {
    variant?: "header" | "mobile";
    className?: string;
    onSelect?: () => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = "header", className, onSelect }) => {
    const { i18n, t } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        if (onSelect) onSelect();
    };

    const languages = [
        { code: "en", label: "English" },
        { code: "ko", label: "한국어" },
    ];

    if (variant === "mobile") {
        return (
            <div className={cn("space-y-1", className)}>
                <div className="px-3 py-2 rounded-md transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground-primary flex items-center gap-2">
                            {t('header.language')}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => changeLanguage(lang.code)}
                                className={cn(
                                    "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                                    i18n.language === lang.code
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-foreground-secondary hover:bg-surface-secondary"
                                )}
                            >
                                {lang.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("rounded-full hover:bg-gray-200 dark:hover:bg-[#323234] text-foreground-secondary hover:text-foreground-primary", className)}
                >
                    <Globe size={24} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-1 bg-card border-surface-border" align="end">
                <div className="flex flex-col gap-0.5">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className={cn(
                                "flex items-center justify-between w-full px-3 py-2 text-sm rounded-md transition-colors",
                                i18n.language === lang.code
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-foreground-primary hover:bg-surface-secondary"
                            )}
                        >
                            {lang.label}
                            {i18n.language === lang.code && <Check size={14} />}
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
};
