import type { User as SupabaseUser } from "@supabase/supabase-js";

export type User = SupabaseUser;

export interface Sound {
    id: string;
    title: string;
    fileUrl: string;
    duration: number; // in seconds
    hotkey?: string;
    color?: string;
    volume: number; // 0-1 range
    emoji?: string; // Emoji thumbnail
    trimStart?: number; // Trim start time in seconds
    trimEnd?: number; // Trim end time in seconds
    isDefault?: boolean; // Default provided sound
    fileName?: string; // Storage filename for user-uploaded files
}

export interface StorageUsage {
    currentUsage: number;
    maxStorage: number;
    usagePercent: number;
}
