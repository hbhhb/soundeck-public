import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { AlertTriangle } from "lucide-react";
import { useTranslation, Trans } from "react-i18next";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  storageUsageStr: string;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  storageUsageStr,
}) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");
  // Get confirmation text from translation to handle dynamic requirement
  const CONFIRM_TEXT = t('deleteAccountModal.confirmText');

  // Reset input when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setInputValue("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (inputValue === CONFIRM_TEXT) {
      onConfirm();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-card border border-surface-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon & Title */}
        <div className="flex flex-col items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-destructive" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground-primary mb-2">
              {t('deleteAccountModal.title')}
            </h3>
            <div className="text-sm text-foreground-secondary space-y-2">
              <p>{t('deleteAccountModal.description1')}</p>
              <p>{t('deleteAccountModal.description2')}</p>
              <ul className="list-disc list-inside ml-1">
                <li>{t('deleteAccountModal.item1', { size: storageUsageStr })}</li>
                <li>{t('deleteAccountModal.item2')}</li>
                <li>{t('deleteAccountModal.item3')}</li>
              </ul>
              <p className="font-semibold text-destructive mt-2">
                {t('deleteAccountModal.warning')}
              </p>
            </div>
          </div>
        </div>

        {/* Input Confirmation */}
        <div className="mt-4 mb-6">
          <label className="block text-xs font-medium text-foreground-secondary mb-2">
            <Trans
              i18nKey="deleteAccountModal.typeToConfirm"
              values={{ text: CONFIRM_TEXT }}
              components={{ bold: <span className="font-bold select-all" /> }}
            />
          </label>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={CONFIRM_TEXT}
            className="w-full bg-surface-tertiary border-surface-border focus:border-destructive/50 focus:ring-destructive/20"
            autoFocus
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="min-w-[80px]"
          >
            {t('confirmModal.cancel')}
          </Button>
          <Button
            variant="ghost"
            onClick={handleConfirm}
            disabled={inputValue !== CONFIRM_TEXT}
            className="min-w-[80px] bg-destructive/10 text-destructive hover:bg-destructive/20 dark:bg-destructive/20 dark:text-destructive dark:hover:bg-destructive/30 border border-destructive/20 shadow-sm"
          >
            {t('deleteAccountModal.button')}
          </Button>
        </div>
      </div>
    </div>
  );
};
