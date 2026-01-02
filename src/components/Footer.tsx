import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="w-full border-t border-surface-border bg-background mt-auto">
      <div className="container mx-auto py-8 px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-foreground-secondary">
        <div className="flex items-center gap-6 text-[12px]">
          <Link to="/privacy" className="hover:text-foreground-primary transition-colors">
            {t('footer.privacyPolicy')}
          </Link>
          <Link to="/terms" className="hover:text-foreground-primary transition-colors">
            {t('footer.termsOfService')}
          </Link>
          <a
            href="https://www.buymeacoffee.com/hbhb"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground-primary transition-colors"
          >
            {t('common.buyMeACoffee')}
          </a>
        </div>
        <div className="text-xs text-foreground-tertiary">
          &copy; {new Date().getFullYear()} {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
};
