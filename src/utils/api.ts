import { supabase } from './supabase/client';
import type { Sound } from '../types';
import { toast } from 'sonner@2.0.3';

const API_BASE = import.meta.env.VITE_API_BASE || `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/make-server-153b1965`;

// Get auth token
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

// Handle 401 errors globally
async function handle401Error(): Promise<void> {
  // Sign out the user
  await supabase.auth.signOut();

  // Show toast notification
  toast.error('Session expired. Please log in again.');

  // Redirect to home/login
  window.location.href = window.location.origin;
}

// Centralized fetch wrapper with 401 error handling
async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  // Handle 401 Unauthorized errors
  if (response.status === 401) {
    await handle401Error();
    throw new Error('Session expired. Please log in again.');
  }

  return response;
}

// Settings API
export async function getSettings(): Promise<{ settings: { masterVolume: number; isDarkMode: boolean } }> {
  const response = await apiFetch(`${API_BASE}/settings`);

  if (!response.ok) {
    throw new Error('Failed to fetch settings');
  }

  return response.json();
}

export async function saveSettings(settings: { masterVolume: number; isDarkMode: boolean }): Promise<{ success: boolean }> {
  const response = await apiFetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    throw new Error('Failed to save settings');
  }

  return response.json();
}

// Sounds API
export async function getSounds(): Promise<{ sounds: Sound[] }> {
  const response = await apiFetch(`${API_BASE}/sounds`);

  if (!response.ok) {
    throw new Error('Failed to fetch sounds');
  }

  return response.json();
}

export async function saveSounds(sounds: Sound[]): Promise<{ success: boolean }> {
  const response = await apiFetch(`${API_BASE}/sounds/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sounds }),
  });

  if (!response.ok) {
    throw new Error('Failed to save sounds');
  }

  return response.json();
}

export async function deleteSound(soundId: string): Promise<{ success: boolean }> {
  const response = await apiFetch(`${API_BASE}/sounds/${soundId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete sound');
  }

  return response.json();
}

// Upload API
export async function uploadAudioFile(file: File): Promise<{
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  originalName: string;
}> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiFetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to upload file');
  }

  return response.json();
}

// Storage usage API
export async function getStorageUsage(): Promise<{
  currentUsage: number;
  maxStorage: number;
  usagePercent: number;
}> {
  const response = await apiFetch(`${API_BASE}/storage-usage`);

  if (!response.ok) {
    throw new Error('Failed to fetch storage usage');
  }

  return response.json();
}

// Format bytes to human readable
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Format bytes to MB (fixed unit)
export function formatMB(bytes: number, decimals = 1): string {
  const mb = bytes / (1024 * 1024);
  return mb.toFixed(decimals) + ' MB';
}

// Reset to defaults API
export async function resetToDefaults(): Promise<{ success: boolean; message: string }> {
  const response = await apiFetch(`${API_BASE}/reset-to-defaults`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to reset to defaults');
  }

  return response.json();
}

// Delete account API
export async function deleteAccount(): Promise<{ success: boolean; message: string }> {
  const response = await apiFetch(`${API_BASE}/delete-account`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete account');
  }

  return response.json();
}

// Helper for fetching public files (like audio) that don't need Supabase Auth
// but should still be centralized for consistent error handling or future auth changes.
export async function getFileSize(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const size = response.headers.get('content-length');
    return size;
  } catch (error) {
    console.error("Error fetching file size:", error);
    return null;
  }
}

export async function fetchAudioData(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch audio');
  }
  return response.arrayBuffer();
}