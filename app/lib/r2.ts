import 'server-only';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

/**
 * Cloudflare R2 (S3-compatible) writer for the reading-music library. The mobile
 * app plays tracks via short-lived presigned R2 GET URLs (apps/api lib/r2.ts), so
 * uploads MUST land in the same private bucket — Supabase Storage wouldn't be
 * reachable by playback. SERVER ONLY (the keys are secrets).
 *
 * Degrades gracefully when the R2_* env vars are absent: `r2Configured()` is
 * false and the admin falls back to the manual storage-key path.
 */
export function r2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET,
  );
}

let client: S3Client | null = null;
function r2(): S3Client {
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
      },
    });
  }
  return client;
}

/** Upload a track object to the music bucket at `key`. Overwrites if present. */
export async function putTrack(key: string, body: Buffer, contentType: string): Promise<void> {
  await r2().send(
    new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, Body: body, ContentType: contentType }),
  );
}

/** Remove a track object from the music bucket. Best-effort — never throws. */
export async function deleteTrackObject(key: string): Promise<void> {
  if (!r2Configured()) return;
  try {
    await r2().send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }));
  } catch (e) {
    console.warn('[r2] delete failed:', (e as Error).message);
  }
}
