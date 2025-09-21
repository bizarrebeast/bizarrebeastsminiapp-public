/**
 * Enhanced Image Metadata Extraction for Fraud Detection
 * Extracts EXIF data, validates image properties, and detects suspicious patterns
 */

import exifr from 'exifr';

export interface ImageMetadata {
  // Basic file info
  fileName?: string;
  fileSize: number;
  mimeType: string;
  dimensions?: {
    width: number;
    height: number;
  };

  // EXIF data
  exif?: {
    make?: string;            // Camera/phone manufacturer
    model?: string;           // Device model
    software?: string;        // Software used
    dateTime?: string;        // When photo was taken
    dateTimeOriginal?: string; // Original capture time
    dateTimeDigitized?: string; // When digitized
    gps?: {
      latitude?: number;
      longitude?: number;
      altitude?: number;
    };
    orientation?: number;
    exposureTime?: number;
    fNumber?: number;
    iso?: number;
    flash?: number;
    focalLength?: number;
  };

  // Fraud detection flags
  fraudDetection: {
    isSuspicious: boolean;
    suspiciousReasons: string[];
    riskScore: number; // 0-100
    checks: {
      hasExifData: boolean;
      hasGpsData: boolean;
      hasDeviceInfo: boolean;
      timestampRecent: boolean;
      timestampRealistic: boolean;
      isScreenshot: boolean;
      isEdited: boolean;
      duplicateDetection?: {
        isDuplicate: boolean;
        similarityScore?: number;
      };
    };
  };
}

/**
 * Extract comprehensive metadata from an image file
 */
export async function extractImageMetadata(file: File): Promise<ImageMetadata> {
  const metadata: ImageMetadata = {
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    fraudDetection: {
      isSuspicious: false,
      suspiciousReasons: [],
      riskScore: 0,
      checks: {
        hasExifData: false,
        hasGpsData: false,
        hasDeviceInfo: false,
        timestampRecent: false,
        timestampRealistic: false,
        isScreenshot: false,
        isEdited: false
      }
    }
  };

  try {
    // Extract EXIF data
    const exifData = await exifr.parse(file);

    if (exifData) {
      metadata.fraudDetection.checks.hasExifData = true;

      metadata.exif = {
        make: exifData.Make,
        model: exifData.Model,
        software: exifData.Software,
        dateTime: exifData.DateTime,
        dateTimeOriginal: exifData.DateTimeOriginal,
        dateTimeDigitized: exifData.DateTimeDigitized,
        orientation: exifData.Orientation,
        exposureTime: exifData.ExposureTime,
        fNumber: exifData.FNumber,
        iso: exifData.ISO,
        flash: exifData.Flash,
        focalLength: exifData.FocalLength
      };

      // GPS data
      if (exifData.latitude && exifData.longitude) {
        metadata.exif.gps = {
          latitude: exifData.latitude,
          longitude: exifData.longitude,
          altitude: exifData.GPSAltitude
        };
        metadata.fraudDetection.checks.hasGpsData = true;
      }

      // Device info
      if (exifData.Make || exifData.Model) {
        metadata.fraudDetection.checks.hasDeviceInfo = true;
      }
    }

    // Get image dimensions
    const dimensions = await getImageDimensions(file);
    if (dimensions) {
      metadata.dimensions = dimensions;
    }

    // Run fraud detection analysis
    await runFraudDetectionAnalysis(metadata, file);

  } catch (error) {
    console.error('Error extracting image metadata:', error);
    metadata.fraudDetection.suspiciousReasons.push('Failed to extract metadata');
    metadata.fraudDetection.riskScore += 10;
  }

  // Calculate final suspicion status
  metadata.fraudDetection.isSuspicious = metadata.fraudDetection.riskScore >= 30;

  return metadata;
}

/**
 * Get image dimensions
 */
async function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Run comprehensive fraud detection analysis
 */
async function runFraudDetectionAnalysis(metadata: ImageMetadata, file: File) {
  const checks = metadata.fraudDetection.checks;
  const reasons = metadata.fraudDetection.suspiciousReasons;
  let riskScore = 0;

  // Check 1: Missing EXIF data (suspicious for modern devices)
  if (!checks.hasExifData) {
    reasons.push('No EXIF metadata found');
    riskScore += 20;
  }

  // Check 2: Missing device information
  if (!checks.hasDeviceInfo && checks.hasExifData) {
    reasons.push('No device information in EXIF');
    riskScore += 15;
  }

  // Check 3: Timestamp analysis
  if (metadata.exif?.dateTimeOriginal) {
    const photoDate = new Date(metadata.exif.dateTimeOriginal);
    const now = new Date();
    const timeDiff = now.getTime() - photoDate.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    // Check if photo was taken recently (within last 24 hours)
    if (hoursDiff <= 24) {
      checks.timestampRecent = true;
    } else if (hoursDiff > 24 * 365) {
      // Photo older than 1 year is suspicious for contest submission
      reasons.push('Photo timestamp is very old (over 1 year)');
      riskScore += 25;
    }

    // Check if timestamp is realistic (not in future)
    if (photoDate > now) {
      reasons.push('Photo timestamp is in the future');
      riskScore += 30;
      checks.timestampRealistic = false;
    } else {
      checks.timestampRealistic = true;
    }
  }

  // Check 4: Screenshot detection
  if (await isLikelyScreenshot(file, metadata)) {
    checks.isScreenshot = true;
    reasons.push('Image appears to be a screenshot');
    riskScore += 10; // Screenshots are expected for game contests
  }

  // Check 5: Edited image detection
  if (await isLikelyEdited(metadata)) {
    checks.isEdited = true;
    reasons.push('Image shows signs of editing');
    riskScore += 15;
  }

  // Check 6: Unusual file properties
  if (file.size < 10000) { // Less than 10KB
    reasons.push('Unusually small file size');
    riskScore += 10;
  }

  if (file.size > 10 * 1024 * 1024) { // Greater than 10MB
    reasons.push('Unusually large file size');
    riskScore += 5;
  }

  // Check 7: Dimensions analysis
  if (metadata.dimensions) {
    const { width, height } = metadata.dimensions;
    const aspectRatio = width / height;

    // Common screenshot aspect ratios
    const commonScreenRatios = [16/9, 4/3, 3/2, 16/10, 21/9];
    const isCommonScreenRatio = commonScreenRatios.some(ratio =>
      Math.abs(aspectRatio - ratio) < 0.1
    );

    if (!isCommonScreenRatio && checks.isScreenshot) {
      reasons.push('Unusual aspect ratio for screenshot');
      riskScore += 5;
    }
  }

  metadata.fraudDetection.riskScore = riskScore;
}

/**
 * Detect if image is likely a screenshot
 */
async function isLikelyScreenshot(file: File, metadata: ImageMetadata): Promise<boolean> {
  // Check filename patterns
  const filename = file.name.toLowerCase();
  const screenshotKeywords = ['screenshot', 'screen', 'capture', 'snap'];

  if (screenshotKeywords.some(keyword => filename.includes(keyword))) {
    return true;
  }

  // Check EXIF for screenshot indicators
  if (metadata.exif?.software) {
    const software = metadata.exif.software.toLowerCase();
    const screenshotSoftware = ['screenshot', 'snagit', 'lightshot', 'greenshot'];

    if (screenshotSoftware.some(tool => software.includes(tool))) {
      return true;
    }
  }

  // Check for lack of camera-specific EXIF data
  const hasCameraData = !!(
    metadata.exif?.exposureTime ||
    metadata.exif?.fNumber ||
    metadata.exif?.focalLength ||
    metadata.exif?.flash !== undefined
  );

  if (!hasCameraData && metadata.fraudDetection.checks.hasExifData) {
    return true;
  }

  return false;
}

/**
 * Detect if image has been edited
 */
async function isLikelyEdited(metadata: ImageMetadata): Promise<boolean> {
  if (!metadata.exif?.software) return false;

  const software = metadata.exif.software.toLowerCase();
  const editingSoftware = [
    'photoshop', 'gimp', 'canva', 'figma', 'sketch',
    'pixelmator', 'affinity', 'lightroom', 'snapseed'
  ];

  return editingSoftware.some(editor => software.includes(editor));
}

/**
 * Enhanced validation that includes metadata analysis
 */
export function validateImageWithMetadata(file: File, metadata: ImageMetadata): {
  valid: boolean;
  error?: string;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Basic validation (same as before)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB', warnings };
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File must be an image (JPEG, PNG, GIF, or WebP)', warnings };
  }

  // Add warnings based on metadata analysis
  if (metadata.fraudDetection.isSuspicious) {
    warnings.push(`Potentially suspicious image (risk score: ${metadata.fraudDetection.riskScore})`);
    warnings.push(...metadata.fraudDetection.suspiciousReasons);
  }

  // Require recent timestamp for contest submissions
  if (!metadata.fraudDetection.checks.timestampRecent && metadata.exif?.dateTimeOriginal) {
    warnings.push('Photo was not taken recently - please submit a fresh screenshot');
  }

  return { valid: true, warnings };
}

/**
 * Create fraud detection summary for admin review
 */
export function createFraudDetectionSummary(metadata: ImageMetadata): string {
  if (!metadata.fraudDetection.isSuspicious) {
    return 'No suspicious activity detected';
  }

  const summary = [
    `Risk Score: ${metadata.fraudDetection.riskScore}/100`,
    `Reasons: ${metadata.fraudDetection.suspiciousReasons.join(', ')}`,
  ];

  if (metadata.exif?.dateTimeOriginal) {
    summary.push(`Photo Date: ${metadata.exif.dateTimeOriginal}`);
  }

  if (metadata.exif?.make && metadata.exif?.model) {
    summary.push(`Device: ${metadata.exif.make} ${metadata.exif.model}`);
  }

  return summary.join(' | ');
}