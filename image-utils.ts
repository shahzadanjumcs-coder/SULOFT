// SULOFT — Image Optimisation & Upload Helper
// -----------------------------------------------------------------------------
// Before uploading to Supabase Storage, we resize and re-compress images in the
// browser. This:
//   • Cuts bandwidth and storage cost dramatically (a 4 MB phone photo becomes
//     ~200 KB without any visible quality loss).
//   • Strips EXIF / GPS metadata for privacy.
//   • Enforces a single consistent format (image/jpeg).
//
// The uploaded file is stored at `{user_id}/{timestamp}-{rand}.jpg` and the
// public URL is saved to items.image_url. The storage path is also saved to
// items.image_path so the file can be deleted later if the listing is removed.
// -----------------------------------------------------------------------------

const MAX_WIDTH = 1280;
const MAX_HEIGHT = 1280;
const JPEG_QUALITY = 0.82;

export interface OptimisedImage {
  blob: Blob;
  fileName: string;
  width: number;
  height: number;
}

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB hard limit

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Only JPG, PNG, or WEBP images are allowed.";
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "Image must be smaller than 5 MB.";
  }
  return null;
}

/**
 * Reads an image File, draws it onto a canvas scaled down to MAX_WIDTH/HEIGHT,
 * and re-encodes as JPEG. Returns a Blob ready for upload.
 */
export async function optimiseImage(file: File): Promise<OptimisedImage> {
  // Load the file into an <img> element
  const dataUrl = await fileToDataURL(file);
  const img = await loadImage(dataUrl);

  // Compute the scaled dimensions, preserving aspect ratio
  let { width, height } = img;
  if (width > MAX_WIDTH || height > MAX_HEIGHT) {
    const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  // Draw to canvas and re-encode as JPEG
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get canvas context for image optimisation");
  }
  // White background so transparent PNGs don't turn black when encoded as JPEG
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  );
  if (!blob) {
    throw new Error("Failed to encode optimised image");
  }

  const fileName =
    file.name.replace(/\.(png|webp|jpg|jpeg)$/i, "") + ".jpg";

  return { blob, fileName, width, height };
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

/**
 * Generates a unique storage path for an uploaded image.
 * Format: `{user_id}/{timestamp}-{random}.jpg`
 */
export function buildImagePath(userId: string, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${userId}/${ts}-${rand}-${safeName}`;
}
