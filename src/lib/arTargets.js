import { Compiler } from 'mind-ar/dist/mindar-image.prod.js';
import { supabase, AR_ASSETS_BUCKET } from './supabaseClient';

export function assetPaths(id, index) {
  return {
    imagePath: `image/${id}/${index}`,
    videoPath: `video/${id}/${index}`,
  };
}

export function mindPath(id) {
  return `mind/${id}.mind`;
}

// Supabase free tier rejects uploads over 50MB. Catch it client-side with a
// clear message instead of letting the upload run and fail opaquely.
export const MAX_UPLOAD_MB = 50;

export function oversizeError(files) {
  const limit = MAX_UPLOAD_MB * 1024 * 1024;
  const tooBig = files.find((f) => f && f.size > limit);
  if (!tooBig) return null;
  const mb = Math.round(tooBig.size / (1024 * 1024));
  return `"${tooBig.name}" is ${mb}MB — files must be under ${MAX_UPLOAD_MB}MB. Please trim or compress it first.`;
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    if (typeof source === 'string') {
      img.crossOrigin = 'anonymous';
      img.src = source;
    } else {
      img.src = URL.createObjectURL(source);
    }
  });
}

// sources: array of File objects and/or existing image URLs (strings), in target-index order
export async function compileMindBuffer(sources, onProgress) {
  const images = await Promise.all(sources.map(loadImage));
  const compiler = new Compiler();
  await compiler.compileImageTargets(images, onProgress);
  return compiler.exportData();
}

export async function uploadAsset(path, fileOrBuffer, contentType, { upsert = false } = {}) {
  const body = fileOrBuffer instanceof ArrayBuffer || fileOrBuffer instanceof Uint8Array
    ? new Blob([fileOrBuffer])
    : fileOrBuffer;
  const { error } = await supabase.storage
    .from(AR_ASSETS_BUCKET)
    .upload(path, body, { contentType, upsert });
  if (error) throw error;
  return supabase.storage.from(AR_ASSETS_BUCKET).getPublicUrl(path).data.publicUrl;
}

// Normalizes a row (new `pairs` jsonb, or legacy flat image_url/video_url) into
// a uniform [{ target_index, image_url, video_url }] array.
export function normalizePairs(row) {
  if (row.pairs && row.pairs.length > 0) return row.pairs;
  if (row.image_url && row.video_url) {
    return [{ target_index: 0, image_url: row.image_url, video_url: row.video_url }];
  }
  return [];
}
