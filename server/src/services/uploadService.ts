import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary';
import { AppError } from '../utils/AppError';

export interface UploadedAsset {
  url: string;
  publicId: string;
}

export function isImageBufferValid(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 12) return false;
  // JPEG: FF D8 FF
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (isJpeg) return true;

  // PNG: 89 50 4E 47
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;
  if (isPng) return true;

  // WebP: RIFF .... WEBP
  const isRiff = buffer.toString('ascii', 0, 4) === 'RIFF';
  const isWebp = buffer.toString('ascii', 8, 12) === 'WEBP';
  if (isRiff && isWebp) return true;

  return false;
}

export async function uploadImageBuffer(
  buffer: Buffer,
  folder: 'artisans-corner/stores' | 'artisans-corner/products'
): Promise<UploadedAsset> {
  if (!isImageBufferValid(buffer)) {
    throw new AppError(
      'Invalid file content. File does not contain valid JPEG, PNG, or WebP image headers.',
      400
    );
  }

  if (!isCloudinaryConfigured()) {
    // Local / Demo mode fallback: return base64 Data URL so local testing works without Cloudinary keys
    let mime = 'image/jpeg';
    if (buffer[0] === 0x89 && buffer[1] === 0x50) mime = 'image/png';
    else if (buffer.toString('ascii', 0, 4) === 'RIFF') mime = 'image/webp';

    const base64 = buffer.toString('base64');
    return {
      url: `data:${mime};base64,${base64}`,
      publicId: `local-demo/${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error || !result) {
          return reject(
            new AppError('Failed to upload image to cloud storage. Please try again.', 502)
          );
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );
    stream.end(buffer);
  });
}

export async function deleteCloudAsset(publicId: string): Promise<void> {
  if (!isCloudinaryConfigured() || !publicId || publicId.startsWith('local-demo/')) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // Non-fatal cleanup warning; do not block primary operation
  }
}

