import { useEffect } from "react";
import { type Sound } from "../types";

export const useSoundHotkeys = (sounds: Sound[]) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if waveform editor is open
            if (document.body.hasAttribute('data-waveform-editor-open')) {
                return;
            }

            // Ignore if typing in input
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            )
                return;

            // Ignore if any modifier key is pressed (Cmd, Ctrl, Shift, Alt)
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
                return;
            }

            const code = e.code; // Use physical key position instead of key value
            const soundToPlay = sounds.find((s) => s.hotkey === code);
            if (soundToPlay) {
                // Dispatch a custom event that the specific card will listen to
                // This decouples the play logic so the card manages its own audio instance
                window.dispatchEvent(
                    new CustomEvent(`play-sound-${soundToPlay.id}`, {
                        detail: { method: 'hotkey' }
                    }),
                );
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () =>
            window.removeEventListener("keydown", handleKeyDown);
    }, [sounds]);
};
