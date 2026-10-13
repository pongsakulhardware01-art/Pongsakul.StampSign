import { Layer } from '../types';

/**
 * Remove white/light paper background from an uploaded signature or stamp image.
 * Transforms scanned or photographed paper into a clean transparent PNG signature.
 * Optionally recolors ink (e.g. to blue #1e40af, red #dc2626, or black).
 */
export async function processUploadedSignature(
  sourceUrl: string,
  options: {
    removeBackground: boolean;
    whiteThreshold: number; // 0 to 255 (e.g. 210)
    smoothness: number; // edge feathering (e.g. 20)
    tintColor?: string | null; // e.g. '#1e40af' or null
    contrastBoost?: boolean;
  }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(sourceUrl);

      ctx.drawImage(img, 0, 0);

      if (!options.removeBackground && !options.tintColor) {
        resolve(canvas.toDataURL('image/png'));
        return;
      }

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      const threshold = options.whiteThreshold ?? 210;
      const feather = options.smoothness ?? 25;

      let tintR = 0;
      let tintG = 0;
      let tintB = 0;
      if (options.tintColor && options.tintColor.startsWith('#')) {
        const hex = options.tintColor.replace('#', '');
        tintR = parseInt(hex.substring(0, 2), 16) || 0;
        tintG = parseInt(hex.substring(2, 4), 16) || 0;
        tintB = parseInt(hex.substring(4, 6), 16) || 0;
      }

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const originalA = data[i + 3];

        // Perceived luminance
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

        if (options.removeBackground) {
          if (brightness >= threshold) {
            // White / paper background becomes fully transparent
            data[i + 3] = 0;
            continue;
          } else if (brightness > threshold - feather) {
            // Edge feathering
            const alphaFactor = (threshold - brightness) / feather;
            data[i + 3] = Math.floor(originalA * alphaFactor);
          }
        }

        // Tint ink if selected
        if (options.tintColor && data[i + 3] > 0) {
          // Invert brightness: darker original ink receives stronger tint
          const darknessFactor = 1 - brightness / 255;
          data[i] = tintR;
          data[i + 1] = tintG;
          data[i + 2] = tintB;
          // Retain stroke density
          data[i + 3] = Math.min(255, Math.floor(originalA * (0.4 + darknessFactor * 0.6)));
        }
      }

      ctx.putImageData(imgData, 0, 0);

      // Auto crop bounding box to trim excess white space around signature
      const trimmedCanvas = cropTransparentCanvas(canvas);
      resolve(trimmedCanvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = sourceUrl;
  });
}

/**
 * Crop transparent borders around an image so the bounding box fits snugly
 */
export function cropTransparentCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (data[idx + 3] > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // If blank or tiny, return original
  if (minX > maxX || minY > maxY) {
    return canvas;
  }

  // Add 4px margin
  const pad = 6;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);

  const croppedW = maxX - minX + 1;
  const croppedH = maxY - minY + 1;

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = croppedW;
  croppedCanvas.height = croppedH;
  const cctx = croppedCanvas.getContext('2d');
  if (!cctx) return canvas;

  cctx.drawImage(canvas, minX, minY, croppedW, croppedH, 0, 0, croppedW, croppedH);
  return croppedCanvas;
}

/**
 * Load an image safely into an HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Composite the base image and all layers into a full-resolution canvas
 * Renders directly at the original base image's resolution!
 */
export async function compositeFullResolution(
  baseImageUrl: string,
  layers: Layer[],
  format: 'png' | 'jpeg' = 'png',
  quality = 0.95
): Promise<{ dataUrl: string; width: number; height: number; blob: Blob }> {
  const baseImg = await loadImage(baseImageUrl);
  const width = baseImg.naturalWidth || baseImg.width;
  const height = baseImg.naturalHeight || baseImg.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not create canvas context');
  }

  // 1. Draw base image
  ctx.drawImage(baseImg, 0, 0, width, height);

  // 2. Preload all visible layer images
  const visibleLayers = layers.filter((l) => l.visible);
  const layerImages = await Promise.all(
    visibleLayers.map(async (layer) => {
      try {
        const img = await loadImage(layer.imageUrl);
        return { layer, img };
      } catch (e) {
        console.error('Failed to load layer image', layer.id, e);
        return null;
      }
    })
  );

  // 3. Draw each layer in exact order
  for (const item of layerImages) {
    if (!item) continue;
    const { layer, img } = item;

    ctx.save();

    // Opacity
    ctx.globalAlpha = Math.max(0, Math.min(1, layer.opacity));

    // Blend mode (e.g. 'multiply' for realistic ink sinking into paper)
    if (layer.blendMode && layer.blendMode !== 'normal') {
      ctx.globalCompositeOperation = layer.blendMode;
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    // Coordinate system: translate to layer center, rotate, scale, flip
    const centerX = layer.x + layer.width / 2;
    const centerY = layer.y + layer.height / 2;

    ctx.translate(centerX, centerY);

    if (layer.rotation) {
      ctx.rotate((layer.rotation * Math.PI) / 180);
    }

    // Flipping
    const scaleX = layer.flipX ? -1 : 1;
    const scaleY = layer.flipY ? -1 : 1;
    if (scaleX !== 1 || scaleY !== 1) {
      ctx.scale(scaleX, scaleY);
    }

    // Draw image centered at (0, 0)
    ctx.drawImage(
      img,
      -layer.width / 2,
      -layer.height / 2,
      layer.width,
      layer.height
    );

    ctx.restore();
  }

  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const dataUrl = canvas.toDataURL(mimeType, quality);

  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (b) => resolve(b || new Blob()),
      mimeType,
      quality
    );
  });

  return { dataUrl, width, height, blob };
}
