// src/workers/pixelator.worker.ts

const GEOPIXELS_PALETTE = [
  "#FFFFFF","#F4F59F","#FFCA3A","#FF9F1C","#FF595E","#E71D36","#F3BBC2","#FF85A1","#BD637D","#CDB4DB","#6A4C93","#4D194D","#A8D0DC","#2EC4B6","#1A535C","#6D9DCD","#1982C4","#A1C181","#8AC926","#A0A0A0","#6B4226","#505050","#CFD078","#145A7A","#8B1D24","#C07F7A","#C49A6C","#5B7B1C","#000000"
];

const WPLACE_PALETTE = [
  "#000000","#3c3c3c","#787878","#aaaaaa","#d2d2d2","#ffffff","#600018","#a50e1e","#ed1c24","#fa8072","#e45c1a","#ff7f27","#f6aa09","#f9dd3b","#fffabc","#9c8431","#c5ad31","#e8d45f","#4a6b3a","#5a944a","#84c573","#0eb968","#13e67b","#87ff5e","#0c816e","#10aea6","#13e1be","#0f799f","#60f7f2","#bbfaf2","#28509e","#4093e4","#7dc7ff","#4d31b8","#6b50f6","#99b1fb","#4a4284","#7a71c4","#b5aef1","#780c99","#aa38b9","#e09ff9","#cb007a","#ec1f80","#f38da9","#9b5249","#d18078","#fab6a4","#684634","#95682a","#dba463","#7b6352","#9c846b","#d6b594","#d18051","#f8b277","#ffc5a5","#6d643f","#948c6b","#cdc59e","#333941","#6d758d","#b3b9d1"
];

interface RGB { r: number; g: number; b: number; }
interface LAB { l: number; a: number; b: number; }

// --- Color Conversion & Distance ---

function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

function rgbToXyz(c: RGB) {
  let r = c.r / 255;
  let g = c.g / 255;
  let b = c.b / 255;

  r = r > 0.04045 ? Math.pow(((r + 0.055) / 1.055), 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow(((g + 0.055) / 1.055), 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow(((b + 0.055) / 1.055), 2.4) : b / 12.92;

  r *= 100; g *= 100; b *= 100;

  return {
    x: r * 0.4124 + g * 0.3576 + b * 0.1805,
    y: r * 0.2126 + g * 0.7152 + b * 0.0722,
    z: r * 0.0193 + g * 0.1192 + b * 0.9505
  };
}

function xyzToLab(c: { x: number, y: number, z: number }): LAB {
  let x = c.x / 95.047;
  let y = c.y / 100.000;
  let z = c.z / 108.883;

  x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + (16 / 116);
  y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + (16 / 116);
  z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + (16 / 116);

  return {
    l: (116 * y) - 16,
    a: 500 * (x - y),
    b: 200 * (y - z)
  };
}

function rgbToLab(c: RGB): LAB {
  return xyzToLab(rgbToXyz(c));
}

function getDeltaE(labA: LAB, labB: LAB): number {
  const deltaL = labA.l - labB.l;
  const deltaA = labA.a - labB.a;
  const deltaB = labA.b - labB.b;
  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
}

// --- Resizing ---

function resampleNearest(srcData: ImageData, width: number, height: number): ImageData {
  const src = srcData.data;
  const dest = new ImageData(width, height);
  const destData = dest.data;
  const xRatio = srcData.width / width;
  const yRatio = srcData.height / height;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcX = Math.floor(x * xRatio);
      const srcY = Math.floor(y * yRatio);
      const srcIdx = (srcY * srcData.width + srcX) * 4;
      const destIdx = (y * width + x) * 4;
      
      destData[destIdx] = src[srcIdx];
      destData[destIdx + 1] = src[srcIdx + 1];
      destData[destIdx + 2] = src[srcIdx + 2];
      destData[destIdx + 3] = src[srcIdx + 3];
    }
  }
  return dest;
}

function resampleBilinear(srcData: ImageData, width: number, height: number): ImageData {
  const src = srcData.data;
  const dest = new ImageData(width, height);
  const destData = dest.data;
  const xRatio = (srcData.width - 1) / width;
  const yRatio = (srcData.height - 1) / height;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcX = x * xRatio;
      const srcY = y * yRatio;
      
      const x1 = Math.floor(srcX);
      const y1 = Math.floor(srcY);
      const x2 = Math.min(x1 + 1, srcData.width - 1);
      const y2 = Math.min(y1 + 1, srcData.height - 1);
      
      const dx = srcX - x1;
      const dy = srcY - y1;
      
      const destIdx = (y * width + x) * 4;
      
      for (let c = 0; c < 4; c++) {
        const v1 = src[(y1 * srcData.width + x1) * 4 + c];
        const v2 = src[(y1 * srcData.width + x2) * 4 + c];
        const v3 = src[(y2 * srcData.width + x1) * 4 + c];
        const v4 = src[(y2 * srcData.width + x2) * 4 + c];
        
        const top = v1 * (1 - dx) + v2 * dx;
        const bottom = v3 * (1 - dx) + v4 * dx;
        const value = top * (1 - dy) + bottom * dy;
        
        destData[destIdx + c] = Math.round(value);
      }
    }
  }
  return dest;
}

function resampleLanczos(imageData: ImageData, width: number, height: number): ImageData {
    const srcData = imageData.data;
    const srcWidth = imageData.width;
    const srcHeight = imageData.height;
    const destImageData = new ImageData(width, height);
    const destData = destImageData.data;

    const sinc = (x: number) => {
        x = Math.abs(x);
        if (x === 0) return 1;
        const piX = Math.PI * x;
        return Math.sin(piX) / piX;
    };

    const lanczosKernel = (x: number, a: number) => {
        if (x > -a && x < a) {
            return sinc(x) * sinc(x / a);
        }
        return 0;
    };

    const ratioX = srcWidth / width;
    const ratioY = srcHeight / height;
    const a = 3;

    for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
            const sy = (dy + 0.5) * ratioY - 0.5;
            const sx = (dx + 0.5) * ratioX - 0.5;

            let r = 0, g = 0, b = 0, a_val = 0, totalWeight = 0;

            const startX = Math.floor(sx) - a + 1;
            const endX = Math.floor(sx) + a;
            const startY = Math.floor(sy) - a + 1;
            const endY = Math.floor(sy) + a;

            for (let y = startY; y <= endY; y++) {
                if (y < 0 || y >= srcHeight) continue;
                for (let x = startX; x <= endX; x++) {
                    if (x < 0 || x >= srcWidth) continue;

                    const weight = lanczosKernel(sx - x, a) * lanczosKernel(sy - y, a);
                    if (weight === 0) continue;

                    const srcIndex = (y * srcWidth + x) * 4;
                    r += srcData[srcIndex] * weight;
                    g += srcData[srcIndex + 1] * weight;
                    b += srcData[srcIndex + 2] * weight;
                    a_val += srcData[srcIndex + 3] * weight;
                    totalWeight += weight;
                }
            }

            const destIndex = (dy * width + dx) * 4;
            if (totalWeight > 0) {
                destData[destIndex] = r / totalWeight;
                destData[destIndex + 1] = g / totalWeight;
                destData[destIndex + 2] = b / totalWeight;
                destData[destIndex + 3] = a_val / totalWeight;
            } else {
                 // Fallback for edge cases
                 destData[destIndex] = 0;
                 destData[destIndex+1] = 0;
                 destData[destIndex+2] = 0;
                 destData[destIndex+3] = 0;
            }
        }
    }
    return destImageData;
}

// --- Dithering ---

const ditherMatrices: Record<string, { matrix: number[][], size: number, divisor: number }> = {
    'bayer-4x4': {
        matrix: [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]],
        size: 4, divisor: 16
    },
    'bayer-8x8': {
        matrix: [
            [0, 32, 8, 40, 2, 34, 10, 42], [48, 16, 56, 24, 50, 18, 58, 26],
            [12, 44, 4, 36, 14, 46, 6, 38], [60, 28, 52, 20, 62, 30, 54, 22],
            [3, 35, 11, 43, 1, 33, 9, 41], [51, 19, 59, 27, 49, 17, 57, 25],
            [15, 47, 7, 39, 13, 45, 5, 37], [63, 31, 55, 23, 61, 29, 53, 21]
        ],
        size: 8, divisor: 64
    },
    'halftone-dot': {
        matrix: [[12, 5, 6, 13], [4, 0, 1, 7], [8, 2, 3, 11], [14, 9, 10, 15]],
        size: 4, divisor: 16
    },
    'diagonal-line': {
        matrix: [[15, 7, 3, 7], [7, 3, 7, 15], [3, 7, 15, 7], [7, 15, 7, 3]],
        size: 4, divisor: 16
    },
    'cross-hatch': {
        matrix: [[0, 8, 0, 8], [8, 15, 8, 15], [0, 8, 0, 8], [8, 15, 8, 15]],
        size: 4, divisor: 16
    },
    'grid': {
        matrix: [[0, 0, 0, 0], [0, 15, 15, 0], [0, 15, 15, 0], [0, 0, 0, 0]],
        size: 4, divisor: 16
    }
};

const errorKernels: Record<string, { dx: number, dy: number, f: number }[]> = {
    'floyd-steinberg': [
        { dx: 1, dy: 0, f: 7 / 16 }, { dx: -1, dy: 1, f: 3 / 16 }, { dx: 0, dy: 1, f: 5 / 16 }, { dx: 1, dy: 1, f: 1 / 16 }
    ],
    'burkes': [
        { dx: 1, dy: 0, f: 8 / 32 }, { dx: 2, dy: 0, f: 4 / 32 }, { dx: -2, dy: 1, f: 2 / 32 }, { dx: -1, dy: 1, f: 4 / 32 },
        { dx: 0, dy: 1, f: 8 / 32 }, { dx: 1, dy: 1, f: 4 / 32 }, { dx: 2, dy: 1, f: 2 / 32 }
    ],
    'stucki': [
        { dx: 1, dy: 0, f: 8 / 42 }, { dx: 2, dy: 0, f: 4 / 42 }, { dx: -2, dy: 1, f: 2 / 42 }, { dx: -1, dy: 1, f: 4 / 42 },
        { dx: 0, dy: 1, f: 8 / 42 }, { dx: 1, dy: 1, f: 4 / 42 }, { dx: 2, dy: 1, f: 2 / 42 }, { dx: -2, dy: 2, f: 1 / 42 },
        { dx: -1, dy: 2, f: 2 / 42 }, { dx: 0, dy: 2, f: 4 / 42 }, { dx: 1, dy: 2, f: 2 / 42 }, { dx: 2, dy: 2, f: 1 / 42 }
    ],
    'sierra-2': [
        { dx: 1, dy: 0, f: 4 / 16 }, { dx: 2, dy: 0, f: 3 / 16 }, { dx: -2, dy: 1, f: 1 / 16 }, { dx: -1, dy: 1, f: 2 / 16 },
        { dx: 0, dy: 1, f: 3 / 16 }, { dx: 1, dy: 1, f: 2 / 16 }, { dx: 2, dy: 1, f: 1 / 16 }
    ],
    'sierra-lite': [
        { dx: 1, dy: 0, f: 2 / 4 }, { dx: -1, dy: 1, f: 1 / 4 }, { dx: 0, dy: 1, f: 1 / 4 }
    ]
};

function findClosestColor(pixel: RGB, palette: RGB[], paletteLab: LAB[]): RGB {
    // Use CIELAB for better perceptual matching
    const pixelLab = rgbToLab(pixel);
    let minDist = Infinity;
    let closest = palette[0];

    for (let i = 0; i < palette.length; i++) {
        const dist = getDeltaE(pixelLab, paletteLab[i]);
        if (dist < minDist) {
            minDist = dist;
            closest = palette[i];
        }
    }
    return closest;
}

function applyDithering(imageData: ImageData, paletteHex: string[], algorithm: string, strength: number) {
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    const paletteRGB = paletteHex.map(hexToRgb);
    const paletteLab = paletteRGB.map(rgbToLab);

    const strengthFactor = strength / 100;

    if (algorithm in ditherMatrices) {
        // Ordered Dithering
        const dither = ditherMatrices[algorithm];
        const matrix = dither.matrix;
        const mSize = dither.size;
        const mDiv = dither.divisor;
        const BASE_DITHER_STRENGTH = 64; // Increased base strength

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                if (pixels[index + 3] < 128) { pixels[index + 3] = 0; continue; }

                const mX = x % mSize;
                const mY = y % mSize;
                const threshold = matrix[mY][mX];
                
                // Nudge calculation
                const nudge = (threshold / mDiv - 0.5) * BASE_DITHER_STRENGTH * strengthFactor;

                const oldColor = {
                    r: Math.max(0, Math.min(255, pixels[index] + nudge)),
                    g: Math.max(0, Math.min(255, pixels[index + 1] + nudge)),
                    b: Math.max(0, Math.min(255, pixels[index + 2] + nudge))
                };

                const newColor = findClosestColor(oldColor, paletteRGB, paletteLab);

                pixels[index] = newColor.r;
                pixels[index + 1] = newColor.g;
                pixels[index + 2] = newColor.b;
                pixels[index + 3] = 255;
            }
        }
    } else {
        // Error Diffusion
        const pixelDataFloat = new Float32Array(pixels);
        const kernel = errorKernels[algorithm];

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                if (pixelDataFloat[index + 3] < 128) { pixels[index + 3] = 0; continue; }

                const oldColor = { 
                    r: pixelDataFloat[index], 
                    g: pixelDataFloat[index + 1], 
                    b: pixelDataFloat[index + 2] 
                };
                
                const newColor = findClosestColor(oldColor, paletteRGB, paletteLab);

                pixels[index] = newColor.r;
                pixels[index + 1] = newColor.g;
                pixels[index + 2] = newColor.b;
                pixels[index + 3] = 255;

                if (algorithm === 'none' || !kernel) continue;

                const err = { 
                    r: (oldColor.r - newColor.r) * strengthFactor, 
                    g: (oldColor.g - newColor.g) * strengthFactor, 
                    b: (oldColor.b - newColor.b) * strengthFactor 
                };

                for (const k of kernel) {
                    const nX = x + k.dx, nY = y + k.dy;
                    if (nX >= 0 && nX < width && nY >= 0 && nY < height) {
                        const i2 = (nY * width + nX) * 4;
                        if (pixelDataFloat[i2 + 3] < 128) continue;
                        pixelDataFloat[i2] += err.r * k.f;
                        pixelDataFloat[i2 + 1] += err.g * k.f;
                        pixelDataFloat[i2 + 2] += err.b * k.f;
                    }
                }
            }
        }
    }
}

// --- K-Means Clustering ---

function kmeans(data: number[][], k: number, maxIterations = 20): Promise<{ centroids: number[][], assignments: number[] }> {
    return new Promise(resolve => {
        if (k > data.length) {
            k = data.length;
        }
        if (k === 0) {
            resolve({ centroids: [], assignments: [] });
            return;
        }

        let centroids: number[][] = [];
        const tempData = [...data];
        for (let i = 0; i < k; i++) {
            const index = Math.floor(Math.random() * tempData.length);
            centroids.push(tempData.splice(index, 1)[0]);
        }

        let assignments = new Array(data.length);

        for (let iter = 0; iter < maxIterations; iter++) {
            for (let i = 0; i < data.length; i++) {
                let min_dist = Infinity;
                let best_centroid = -1;
                for (let j = 0; j < k; j++) {
                    const dist = (data[i][0] - centroids[j][0]) ** 2 + (data[i][1] - centroids[j][1]) ** 2 + (data[i][2] - centroids[j][2]) ** 2;
                    if (dist < min_dist) { min_dist = dist; best_centroid = j; }
                }
                assignments[i] = best_centroid;
            }

            const newCentroids = Array.from({ length: k }, () => [0, 0, 0]);
            const counts = new Array(k).fill(0);
            for (let i = 0; i < data.length; i++) {
                const cIndex = assignments[i];
                newCentroids[cIndex][0] += data[i][0];
                newCentroids[cIndex][1] += data[i][1];
                newCentroids[cIndex][2] += data[i][2];
                counts[cIndex]++;
            }

            for (let i = 0; i < k; i++) {
                if (counts[i] > 0) {
                    newCentroids[i][0] /= counts[i];
                    newCentroids[i][1] /= counts[i];
                    newCentroids[i][2] /= counts[i];
                } else {
                    newCentroids[i] = data[Math.floor(Math.random() * data.length)];
                }
            }

            let changed = false;
            for (let i = 0; i < k; i++) {
                if (centroids[i][0] !== newCentroids[i][0] || centroids[i][1] !== newCentroids[i][1] || centroids[i][2] !== newCentroids[i][2]) {
                    changed = true; break;
                }
            }
            centroids = newCentroids;
            if (!changed) break;
        }

        resolve({ centroids, assignments });
    });
}

function rgbToHex(rgb: { r: number; g: number; b: number }): string {
    const toHex = (c: number) => {
        const hex = Math.round(c).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

async function suggestMissingColors(
    imageData: ImageData, 
    paletteHex: string[], 
    numToSuggest: number
): Promise<string[]> {
    if (paletteHex.length === 0) return [];
    
    const paletteRGB = paletteHex.map(hexToRgb);
    const paletteLAB = paletteRGB.map(rgbToLab);
    
    // Extract non-transparent pixels with sampling for performance
    const pixels = imageData.data;
    const pixelArray: number[][] = [];
    
    // Calculate step size to limit total pixels to approx 4096 (64x64) for performance
    const totalPixels = pixels.length / 4;
    const maxPixels = 4096;
    const step = Math.ceil(totalPixels / maxPixels) * 4;

    for (let i = 0; i < pixels.length; i += step) {
        if (pixels[i + 3] > 128) {
            pixelArray.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
        }
    }
    
    if (pixelArray.length === 0) return [];
    
    // Run K-Means to find 128 dominant clusters
    // Reduce k if we have fewer pixels than k
    const k = Math.min(128, pixelArray.length);
    const kmeansResult = await kmeans(pixelArray, k);
    const centroids = kmeansResult.centroids;
    const assignments = kmeansResult.assignments;
    
    // Count pixels per cluster
    const pixelCounts = new Array(centroids.length).fill(0);
    for (const assignment of assignments) {
        pixelCounts[assignment]++;
    }
    
    // Calculate error for each centroid
    const centroidErrors: { hex: string; error: number; count: number; totalError: number }[] = [];
    
    for (let i = 0; i < centroids.length; i++) {
        const c = centroids[i];
        const count = pixelCounts[i];
        
        if (count === 0) continue;
        
        const centroidColorRGB = { r: Math.round(c[0]), g: Math.round(c[1]), b: Math.round(c[2]) };
        const centroidColorLAB = rgbToLab(centroidColorRGB);
        
        // Find closest color in palette using CIELAB
        let minDeltaE = Infinity;
        for (const colorLAB of paletteLAB) {
            const dist = getDeltaE(centroidColorLAB, colorLAB);
            if (dist < minDeltaE) {
                minDeltaE = dist;
            }
        }
        
        const totalError = minDeltaE * count;
        
        centroidErrors.push({
            hex: rgbToHex(centroidColorRGB),
            error: minDeltaE,
            count: count,
            totalError: totalError
        });
    }
    
    // Sort by total error (descending) and return top N
    centroidErrors.sort((a, b) => b.totalError - a.totalError);
    return centroidErrors.slice(0, numToSuggest).map(c => c.hex);
}

function applyColorModifiers(imageData: ImageData, brightness: number, contrast: number, saturation: number): ImageData {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const newImageData = new ImageData(new Uint8ClampedArray(data), width, height);
  const d = newImageData.data;

  // Pre-calculate contrast factor
  // Contrast is usually -100 to 100.
  // Formula: factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i];
    let g = d[i+1];
    let b = d[i+2];

    // 1. Brightness
    if (brightness !== 0) {
        r += brightness;
        g += brightness;
        b += brightness;
    }

    // 2. Contrast
    if (contrast !== 0) {
        r = contrastFactor * (r - 128) + 128;
        g = contrastFactor * (g - 128) + 128;
        b = contrastFactor * (b - 128) + 128;
    }

    // 3. Saturation
    if (saturation !== 0) {
        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        const satMult = 1 + (saturation / 100);
        
        r = gray + (r - gray) * satMult;
        g = gray + (g - gray) * satMult;
        b = gray + (b - gray) * satMult;
    }

    d[i] = r;
    d[i+1] = g;
    d[i+2] = b;
  }

  return newImageData;
}

// --- Main Handler ---

self.onmessage = async (e: MessageEvent) => {
    const { type, imageData, settings } = e.data;
    
    if (type === 'suggest') {
        // Handle suggestion request
        try {
            const { palette, numSuggestions } = settings;
            const suggestions = await suggestMissingColors(imageData, palette, numSuggestions || 5);
            self.postMessage({ type: 'suggestions', suggestions });
        } catch (error: any) {
            self.postMessage({ type: 'error', message: error.message });
        }
        return;
    }
    
    // Regular processing
    const { targetWidth, targetHeight, ditherMethod, ditherStrength, palette, resamplingMethod, useKmeans, kmeansColors, brightness, contrast, saturation } = settings;

    try {
        // 0. Apply Color Modifiers
        let processedImageData = imageData;
        if ((brightness && brightness !== 0) || (contrast && contrast !== 0) || (saturation && saturation !== 0)) {
            processedImageData = applyColorModifiers(imageData, brightness || 0, contrast || 0, saturation || 0);
        }

        // 1. Resize
        let resizedImageData: ImageData;
        if (resamplingMethod === 'lanczos') {
            resizedImageData = resampleLanczos(processedImageData, targetWidth, targetHeight);
        } else if (resamplingMethod === 'bilinear') {
            resizedImageData = resampleBilinear(processedImageData, targetWidth, targetHeight);
        } else {
            resizedImageData = resampleNearest(processedImageData, targetWidth, targetHeight);
        }

        // 2. (Optional) K-Means color clustering
        if (useKmeans && kmeansColors > 0) {
            const pixels = resizedImageData.data;
            const pixelArray: number[][] = [];
            for (let i = 0; i < pixels.length; i += 4) {
                if (pixels[i + 3] > 128) {
                    pixelArray.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
                }
            }

            if (pixelArray.length > 0) {
                const kmeansResult = await kmeans(pixelArray, Math.min(kmeansColors, pixelArray.length));
                const paletteRGB = kmeansResult.centroids.map(c => ({
                    r: Math.round(c[0]),
                    g: Math.round(c[1]),
                    b: Math.round(c[2])
                }));
                const paletteLab = paletteRGB.map(rgbToLab);

                for (let i = 0; i < pixels.length; i += 4) {
                    if (pixels[i + 3] > 128) {
                        const pixelColor = { r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] };
                        const closestColor = findClosestColor(pixelColor, paletteRGB, paletteLab);
                        pixels[i] = closestColor.r;
                        pixels[i + 1] = closestColor.g;
                        pixels[i + 2] = closestColor.b;
                    }
                }
            }
        }

        // 3. Dither
        if (palette && palette.length > 0) {
            applyDithering(resizedImageData, palette, ditherMethod, ditherStrength);
        }

        self.postMessage({ type: 'success', imageData: resizedImageData });

    } catch (error: any) {
        self.postMessage({ type: 'error', message: error.message });
    }
};
