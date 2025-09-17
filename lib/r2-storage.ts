/**
 * Cloudflare R2 Storage Configuration
 * For storing contest screenshots and other media
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

// R2 Configuration from environment variables
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'bizarrebeasts-contests';
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';

// Create S3 client configured for R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload a file to R2
 * @param file - File buffer or Blob
 * @param key - The key/path for the file in R2
 * @param contentType - MIME type of the file
 * @returns The public URL of the uploaded file
 */
export async function uploadToR2(
  file: Buffer | Blob | Uint8Array,
  key: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  try {
    // For large files, use multipart upload
    if (file instanceof Blob && file.size > 5 * 1024 * 1024) {
      const upload = new Upload({
        client: r2Client,
        params: {
          Bucket: R2_BUCKET_NAME,
          Key: key,
          Body: file,
          ContentType: contentType,
        },
      });

      await upload.done();
    } else {
      // For smaller files, use regular put
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: contentType,
      });

      await r2Client.send(command);
    }

    // Return the public URL
    return `${R2_PUBLIC_URL}/${key}`;
  } catch (error) {
    console.error('R2 upload error:', error);
    throw new Error('Failed to upload file to storage');
  }
}

/**
 * Delete a file from R2
 * @param key - The key/path of the file to delete
 */
export async function deleteFromR2(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
  } catch (error) {
    console.error('R2 delete error:', error);
    throw new Error('Failed to delete file from storage');
  }
}

/**
 * Generate a unique key for contest screenshots
 * @param contestId - Contest UUID
 * @param walletAddress - User's wallet address
 * @param extension - File extension
 * @returns Unique key for the file
 */
export function generateScreenshotKey(
  contestId: string,
  walletAddress: string,
  extension: string = 'jpg'
): string {
  const timestamp = Date.now();
  const cleanWallet = walletAddress.toLowerCase().replace('0x', '');
  return `contests/${contestId}/screenshots/${cleanWallet}_${timestamp}.${extension}`;
}

/**
 * Extract file extension from filename or MIME type
 * @param filename - Original filename
 * @param mimeType - MIME type
 * @returns File extension
 */
export function getFileExtension(filename?: string, mimeType?: string): string {
  if (filename) {
    const parts = filename.split('.');
    if (parts.length > 1) {
      return parts[parts.length - 1].toLowerCase();
    }
  }

  // Fallback to MIME type
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  };

  return mimeToExt[mimeType || ''] || 'jpg';
}

/**
 * Validate image file
 * @param file - File to validate
 * @returns True if valid
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File must be an image (JPEG, PNG, GIF, or WebP)' };
  }

  return { valid: true };
}

/**
 * Check if R2 is configured
 */
export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME && R2_PUBLIC_URL);
}