import { StampConfig } from '../types';

/**
 * Generate a rubber stamp as a data URL
 */
export function generateStampDataUrl(config: StampConfig, size = 600): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, size, size);

  if (config.shape === 'circle') {
    renderCircularStamp(ctx, config, size);
  } else if (config.shape === 'rounded-rect' || config.shape === 'rect') {
    renderRectangularStamp(ctx, config, size);
  } else if (config.shape === 'date-badge') {
    renderDateBadgeStamp(ctx, config, size);
  }

  // Apply grunge / rubber stamp distress effect if enabled
  if (config.hasGrunge) {
    applyGrungeEffect(ctx, size, size, config.grungeIntensity || 0.4);
  }

  return canvas.toDataURL('image/png');
}

/**
 * Render circular stamp with text curving along top & bottom arcs
 */
function renderCircularStamp(ctx: CanvasRenderingContext2D, config: StampConfig, size: number) {
  const center = size / 2;
  const radius = size * 0.44;
  const color = config.color || '#dc2626';

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Outer border
  ctx.lineWidth = config.borderWidth ? config.borderWidth * 2 : 10;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Inner border
  if (config.doubleBorder) {
    ctx.lineWidth = Math.max(2, (config.borderWidth || 5));
    ctx.beginPath();
    ctx.arc(center, center, radius - 16, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, radius * 0.65, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(center, center, radius * 0.68, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Top Curved Text (Clockwise along top)
  const topText = config.title.toUpperCase();
  if (topText) {
    ctx.font = `bold ${Math.round(size * 0.056)}px ${config.fontFamily || 'Prompt, Kanit, sans-serif'}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawArcText(ctx, topText, center, center, radius * 0.82, -Math.PI / 2, false);
  }

  // Bottom Curved Text (Counter-clockwise along bottom so it reads upright)
  const bottomText = (config.subtitle || '').toUpperCase();
  if (bottomText) {
    ctx.font = `bold ${Math.round(size * 0.05)}px ${config.fontFamily || 'Prompt, Kanit, sans-serif'}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawArcText(ctx, bottomText, center, center, radius * 0.82, Math.PI / 2, true);
  }

  // Stars on sides if requested or subtitle exists
  if (config.starOrnaments) {
    const starAngleLeft = Math.PI;
    const starAngleRight = 0;
    const starRadius = radius * 0.82;
    drawStar(ctx, center + Math.cos(starAngleLeft) * starRadius, center + Math.sin(starAngleLeft) * starRadius, 5, 12, 6);
    drawStar(ctx, center + Math.cos(starAngleRight) * starRadius, center + Math.sin(starAngleRight) * starRadius, 5, 12, 6);
  }

  // Center Main Text
  const centerText = config.centerText || 'APPROVED';
  ctx.font = `bold ${Math.round(size * 0.09)}px ${config.fontFamily || 'Prompt, Kanit, sans-serif'}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Center horizontal divider lines
  const centerLineWidth = radius * 1.1;
  const lineY1 = center - 38;
  const lineY2 = center + 38;

  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(center - centerLineWidth / 2, lineY1);
  ctx.lineTo(center + centerLineWidth / 2, lineY1);
  ctx.moveTo(center - centerLineWidth / 2, lineY2);
  ctx.lineTo(center + centerLineWidth / 2, lineY2);
  ctx.stroke();

  if (config.dateText) {
    // If date exists, draw center text slightly higher and date below
    ctx.fillText(centerText, center, center - 6);
    ctx.font = `600 ${Math.round(size * 0.045)}px ${config.fontFamily || 'Prompt, Kanit, sans-serif'}`;
    ctx.fillText(config.dateText, center, center + 26);
  } else {
    ctx.fillText(centerText, center, center);
  }

  ctx.restore();
}

/**
 * Helper to render curved text along an arc
 */
function drawArcText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  radius: number,
  centerAngle: number,
  isBottom: boolean
) {
  const chars = Array.from(text);
  if (chars.length === 0) return;

  // Measure total width to space nicely
  const charWidths = chars.map((c) => ctx.measureText(c).width);
  const totalWidth = charWidths.reduce((a, b) => a + b, 0);
  const arcLength = totalWidth * 1.15;
  const totalAngle = Math.min(Math.PI * 0.9, arcLength / radius);

  let currentAngle = isBottom
    ? centerAngle + totalAngle / 2
    : centerAngle - totalAngle / 2;

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const cw = charWidths[i];
    const charAngleSpan = (cw * 1.15) / radius;

    const angle = isBottom
      ? currentAngle - charAngleSpan / 2
      : currentAngle + charAngleSpan / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.translate(0, isBottom ? radius : -radius);

    if (isBottom) {
      ctx.rotate(Math.PI);
    }

    ctx.fillText(char, 0, 0);
    ctx.restore();

    if (isBottom) {
      currentAngle -= charAngleSpan;
    } else {
      currentAngle += charAngleSpan;
    }
  }
}

/**
 * Draw 5-point decorative star
 */
function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
}

/**
 * Render rectangular / rounded-rectangle stamp
 */
function renderRectangularStamp(ctx: CanvasRenderingContext2D, config: StampConfig, size: number) {
  const color = config.color || '#dc2626';
  const width = size * 0.9;
  const height = size * 0.45;
  const x = (size - width) / 2;
  const y = (size - height) / 2;
  const radius = config.shape === 'rounded-rect' ? 24 : 0;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Outer border
  ctx.lineWidth = 10;
  drawRoundedRect(ctx, x, y, width, height, radius);
  ctx.stroke();

  // Inner double border
  if (config.doubleBorder) {
    ctx.lineWidth = 4;
    drawRoundedRect(ctx, x + 10, y + 10, width - 20, height - 20, Math.max(0, radius - 6));
    ctx.stroke();
  }

  const cx = size / 2;
  const cy = size / 2;

  // Title / Main text
  const mainText = config.title;
  ctx.font = `bold ${Math.round(size * 0.082)}px ${config.fontFamily || 'Prompt, Kanit, sans-serif'}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (config.subtitle || config.dateText) {
    ctx.fillText(mainText, cx, cy - 22);

    ctx.font = `600 ${Math.round(size * 0.046)}px ${config.fontFamily || 'Prompt, Kanit, sans-serif'}`;
    const subText = [config.subtitle, config.dateText].filter(Boolean).join(' • ');
    ctx.fillText(subText, cx, cy + 30);
  } else {
    ctx.fillText(mainText, cx, cy);
  }

  ctx.restore();
}

/**
 * Render date badge stamp (clean, official Thai / International date box)
 */
function renderDateBadgeStamp(ctx: CanvasRenderingContext2D, config: StampConfig, size: number) {
  const color = config.color || '#2563eb';
  const width = size * 0.88;
  const height = size * 0.52;
  const x = (size - width) / 2;
  const y = (size - height) / 2;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;

  // Outer box
  ctx.lineWidth = 8;
  drawRoundedRect(ctx, x, y, width, height, 16);
  ctx.stroke();

  // Header separator
  const headerHeight = height * 0.38;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y + headerHeight);
  ctx.lineTo(x + width, y + headerHeight);
  ctx.stroke();

  // Header text
  ctx.font = `bold ${Math.round(size * 0.052)}px ${config.fontFamily || 'Prompt, Kanit, sans-serif'}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(config.title || 'อนุมัติ / ตรวจรับแล้ว', size / 2, y + headerHeight / 2);

  // Date and subtext in lower compartment
  const dateStr = config.dateText || new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  ctx.font = `bold ${Math.round(size * 0.07)}px ${config.fontFamily || 'Prompt, Kanit, sans-serif'}`;
  ctx.fillText(dateStr, size / 2, y + headerHeight + (height - headerHeight) / 2);

  ctx.restore();
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Procedural Rubber Stamp Grunge / Distress Effect
 * Simulates physical ink porousness on paper using organic noise speckles
 */
function applyGrungeEffect(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number
) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // We only affect pixels that have ink (alpha > 0)
  const speckleCount = Math.floor(width * height * 0.08 * intensity);

  for (let i = 0; i < speckleCount; i++) {
    const rx = Math.floor(Math.random() * width);
    const ry = Math.floor(Math.random() * height);
    const radius = Math.floor(Math.random() * 3) + 1;

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const px = rx + dx;
        const py = ry + dy;
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const idx = (py * width + px) * 4;
          if (data[idx + 3] > 30) {
            // Erode ink
            data[idx + 3] = Math.max(0, data[idx + 3] - Math.floor(Math.random() * 180 + 75));
          }
        }
      }
    }
  }

  // Slight horizontal and vertical streak wear
  for (let s = 0; s < 18; s++) {
    const startY = Math.floor(Math.random() * height);
    const streakLen = Math.floor(Math.random() * (width * 0.4));
    const startX = Math.floor(Math.random() * (width - streakLen));
    for (let x = startX; x < startX + streakLen; x++) {
      const idx = (startY * width + x) * 4;
      if (data[idx + 3] > 0 && Math.random() > 0.4) {
        data[idx + 3] = Math.floor(data[idx + 3] * 0.3);
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}
