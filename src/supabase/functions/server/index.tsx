import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// Initialize storage bucket for soundboard assets
async function initializeStorage() {
  const bucketName = "make-153b1965-soundboard-audio";
  
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Creating private bucket: ${bucketName}`);
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: false, // Private bucket for user audio files
        fileSizeLimit: 5242880, // 5MB per file limit
        allowedMimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/x-wav', 'audio/x-m4a', 'audio/mp4']
      });
      
      if (error) {
        console.error('Error creating bucket:', error);
      } else {
        console.log('Bucket created successfully');
      }
    } else {
      console.log(`Bucket ${bucketName} already exists`);
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}

// Initialize storage on startup
initializeStorage();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-153b1965/health", (c) => {
  return c.json({ status: "ok" });
});

// Helper: Authenticate user from Bearer token
async function authenticateUser(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header', userId: null };
  }
  
  const accessToken = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  
  if (error || !user?.id) {
    return { error: 'Unauthorized', userId: null };
  }
  
  return { error: null, userId: user.id };
}

// Helper: Calculate user's total storage usage
async function getUserStorageUsage(userId: string): Promise<number> {
  const bucketName = "make-153b1965-soundboard-audio";
  const { data: files, error } = await supabase.storage
    .from(bucketName)
    .list(userId);
  
  if (error || !files) {
    console.error('Error listing user files:', error);
    return 0;
  }
  
  const totalBytes = files.reduce((sum, file) => {
    return sum + (file.metadata?.size || 0);
  }, 0);
  
  return totalBytes;
}

// GET /settings - Get user settings
app.get("/make-server-153b1965/settings", async (c) => {
  const { error, userId } = await authenticateUser(c.req.header('Authorization'));
  if (error || !userId) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }
  
  try {
    const settings = await kv.get(`user:${userId}:settings`);
    return c.json({ 
      settings: settings || { masterVolume: 0.5, isDarkMode: true } 
    });
  } catch (err) {
    console.error('Error fetching settings:', err);
    return c.json({ error: 'Failed to fetch settings' }, 500);
  }
});

// POST /settings - Save user settings
app.post("/make-server-153b1965/settings", async (c) => {
  const { error, userId } = await authenticateUser(c.req.header('Authorization'));
  if (error || !userId) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }
  
  try {
    const body = await c.req.json();
    await kv.set(`user:${userId}:settings`, body);
    return c.json({ success: true });
  } catch (err) {
    console.error('Error saving settings:', err);
    return c.json({ error: 'Failed to save settings' }, 500);
  }
});

// GET /sounds - Get user's sounds
app.get("/make-server-153b1965/sounds", async (c) => {
  const { error, userId } = await authenticateUser(c.req.header('Authorization'));
  if (error || !userId) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }
  
  try {
    console.log(`📥 GET /sounds - User ID: ${userId}`);
    const sounds = await kv.get(`user:${userId}:sounds`);
    console.log(`📥 Raw sounds from KV:`, JSON.stringify(sounds, null, 2));
    console.log(`📥 Number of sounds from KV: ${sounds?.length || 0}`);
    
    // Generate signed URLs for user-uploaded files
    if (sounds && Array.isArray(sounds)) {
      const bucketName = "make-153b1965-soundboard-audio";
      const soundsWithUrls = await Promise.all(
        sounds.map(async (sound: any) => {
          if (sound.fileName && !sound.isDefault) {
            console.log(`🔗 Creating signed URL for: ${sound.fileName}`);
            const { data, error } = await supabase.storage
              .from(bucketName)
              .createSignedUrl(`${userId}/${sound.fileName}`, 3600); // 1 hour expiry
            
            if (error) {
              console.error(`❌ Error creating signed URL for ${sound.fileName}:`, error);
              // Return sound even if signed URL fails (so it doesn't get lost)
              return sound;
            }
            
            if (data?.signedUrl) {
              console.log(`✅ Signed URL created for ${sound.fileName}`);
              return { ...sound, fileUrl: data.signedUrl };
            } else {
              console.warn(`⚠️ No signed URL returned for ${sound.fileName}`);
              return sound;
            }
          }
          return sound;
        })
      );
      console.log(`📤 Returning ${soundsWithUrls.length} sounds to client`);
      console.log(`📤 Custom sounds count: ${soundsWithUrls.filter((s: any) => !s.isDefault).length}`);
      return c.json({ sounds: soundsWithUrls });
    }
    
    console.log('📤 No sounds found, returning empty array');
    return c.json({ sounds: [] });
  } catch (err) {
    console.error('❌ Error fetching sounds:', err);
    return c.json({ error: 'Failed to fetch sounds' }, 500);
  }
});

// POST /sounds/save - Save user's sounds
app.post("/make-server-153b1965/sounds/save", async (c) => {
  const { error, userId } = await authenticateUser(c.req.header('Authorization'));
  if (error || !userId) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }
  
  try {
    const { sounds } = await c.req.json();
    
    console.log(`💾 Saving ${sounds.length} sounds for user ${userId}`);
    
    // Remove signed URLs before saving (we'll regenerate them on load)
    // For default sounds, keep fileUrl since they use public URLs
    // For user-uploaded sounds, remove fileUrl (will be regenerated as signed URL)
    const soundsToSave = sounds.map((sound: any) => {
      if (sound.isDefault) {
        // Keep default sounds as-is (they have public URLs)
        return sound;
      } else {
        // Remove fileUrl from user sounds (will regenerate signed URL on load)
        const { fileUrl, ...rest } = sound;
        return rest;
      }
    });
    
    await kv.set(`user:${userId}:sounds`, soundsToSave);
    console.log(`✅ Successfully saved sounds for user ${userId}`);
    return c.json({ success: true });
  } catch (err) {
    console.error('Error saving sounds:', err);
    return c.json({ error: 'Failed to save sounds' }, 500);
  }
});

// POST /upload - Upload audio file
app.post("/make-server-153b1965/upload", async (c) => {
  const { error, userId } = await authenticateUser(c.req.header('Authorization'));
  if (error || !userId) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }
  
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }
    
    // Check file size (5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return c.json({ error: 'File size exceeds 5MB limit' }, 400);
    }
    
    // Check total storage usage (15MB limit)
    const currentUsage = await getUserStorageUsage(userId);
    const MAX_TOTAL_STORAGE = 15 * 1024 * 1024; // 15MB
    
    if (currentUsage + file.size > MAX_TOTAL_STORAGE) {
      return c.json({ 
        error: 'Storage limit exceeded',
        currentUsage,
        maxStorage: MAX_TOTAL_STORAGE 
      }, 400);
    }
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'mp3';
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;
    
    // Upload to Supabase Storage
    const bucketName = "make-153b1965-soundboard-audio";
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, uint8Array, {
        contentType: file.type,
        upsert: false
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return c.json({ error: 'Failed to upload file' }, 500);
    }
    
    // Generate signed URL
    const { data: urlData, error: urlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 3600); // 1 hour expiry
    
    if (urlError || !urlData?.signedUrl) {
      console.error('Error generating signed URL:', urlError);
      return c.json({ error: 'Failed to generate file URL' }, 500);
    }
    
    // Get audio duration (we'll do this client-side)
    return c.json({
      id: crypto.randomUUID(),
      fileName,
      fileUrl: urlData.signedUrl,
      fileSize: file.size,
      originalName: file.name
    });
  } catch (err) {
    console.error('Error uploading file:', err);
    return c.json({ error: 'Failed to upload file' }, 500);
  }
});

// DELETE /sounds/:soundId - Delete a sound and its file
app.delete("/make-server-153b1965/sounds/:soundId", async (c) => {
  const { error, userId } = await authenticateUser(c.req.header('Authorization'));
  if (error || !userId) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }
  
  try {
    const soundId = c.req.param('soundId');
    
    // Get current sounds
    const sounds = await kv.get(`user:${userId}:sounds`) as any[];
    if (!sounds || !Array.isArray(sounds)) {
      return c.json({ error: 'No sounds found' }, 404);
    }
    
    // Find the sound to delete
    const soundToDelete = sounds.find((s: any) => s.id === soundId);
    if (!soundToDelete) {
      return c.json({ error: 'Sound not found' }, 404);
    }
    
    // Delete from storage if it's a user-uploaded file
    if (soundToDelete.fileName && !soundToDelete.isDefault) {
      const bucketName = "make-153b1965-soundboard-audio";
      const filePath = `${userId}/${soundToDelete.fileName}`;
      
      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);
      
      if (deleteError) {
        console.error('Error deleting file from storage:', deleteError);
      }
    }
    
    // Remove from sounds array
    const updatedSounds = sounds.filter((s: any) => s.id !== soundId);
    await kv.set(`user:${userId}:sounds`, updatedSounds);
    
    return c.json({ success: true });
  } catch (err) {
    console.error('Error deleting sound:', err);
    return c.json({ error: 'Failed to delete sound' }, 500);
  }
});

// GET /storage-usage - Get user's storage usage
app.get("/make-server-153b1965/storage-usage", async (c) => {
  const { error, userId } = await authenticateUser(c.req.header('Authorization'));
  if (error || !userId) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }
  
  try {
    const currentUsage = await getUserStorageUsage(userId);
    const maxStorage = 15 * 1024 * 1024; // 15MB
    
    return c.json({ 
      currentUsage,
      maxStorage,
      usagePercent: (currentUsage / maxStorage) * 100
    });
  } catch (err) {
    console.error('Error getting storage usage:', err);
    return c.json({ error: 'Failed to get storage usage' }, 500);
  }
});

// POST /reset-to-defaults - Reset user to default state
app.post("/make-server-153b1965/reset-to-defaults", async (c) => {
  const { error, userId } = await authenticateUser(c.req.header('Authorization'));
  if (error || !userId) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }
  
  try {
    // 1. Delete all uploaded files from storage
    const bucketName = "make-153b1965-soundboard-audio";
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list(userId);
    
    if (!listError && files && files.length > 0) {
      const filePaths = files.map(file => `${userId}/${file.name}`);
      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove(filePaths);
      
      if (deleteError) {
        console.error('Error deleting files from storage:', deleteError);
      }
    }
    
    // 2. Delete all user data from KV store
    await kv.del(`user:${userId}:settings`);
    await kv.del(`user:${userId}:sounds`);
    
    return c.json({ 
      success: true,
      message: 'All user data and files have been deleted. Reset to defaults.'
    });
  } catch (err) {
    console.error('Error resetting to defaults:', err);
    return c.json({ error: 'Failed to reset to defaults' }, 500);
  }
});

// DELETE /delete-account - Permanently delete user account and all data
app.delete("/make-server-153b1965/delete-account", async (c) => {
  const { error, userId } = await authenticateUser(c.req.header('Authorization'));
  if (error || !userId) {
    return c.json({ error: error || 'Unauthorized' }, 401);
  }
  
  try {
    console.log(`🗑️ Starting account deletion for user: ${userId}`);

    // 1. Delete all uploaded files from storage
    const bucketName = "make-153b1965-soundboard-audio";
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list(userId);
    
    if (!listError && files && files.length > 0) {
      console.log(`🗑️ Deleting ${files.length} files from storage...`);
      const filePaths = files.map(file => `${userId}/${file.name}`);
      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove(filePaths);
      
      if (deleteError) {
        console.error('Error deleting files from storage:', deleteError);
        // Continue anyway - we want to try deleting everything else
      }
    }
    
    // 2. Delete all user data from KV store
    console.log(`🗑️ Deleting user data from KV store...`);
    await kv.del(`user:${userId}:settings`);
    await kv.del(`user:${userId}:sounds`);
    
    // 3. Delete user account from Supabase Auth
    // Note: We need service_role key to delete users (which we have in supabase client)
    console.log(`🗑️ Deleting user account from Auth...`);
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);
    
    if (deleteUserError) {
      console.error('Error deleting user account:', deleteUserError);
      return c.json({ error: 'Failed to delete user account' }, 500);
    }
    
    console.log(`✅ Account deletion complete for user: ${userId}`);
    return c.json({ 
      success: true,
      message: 'Account and all data permanently deleted.'
    });
  } catch (err) {
    console.error('Error deleting account:', err);
    return c.json({ error: 'Failed to delete account' }, 500);
  }
});

Deno.serve(app.fetch);