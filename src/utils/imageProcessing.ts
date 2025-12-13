/**
 * Extracts the opaque color palette (RGB only) from an image.
 * Only includes fully opaque pixels (alpha === 255).
 * 
 * @param imageDataObj - ImageData object containing pixel data
 * @returns Map of hex colors to their RGB values
 */
const extractOpaqueColorPalette = (imageDataObj: ImageData): Map<string, { r: number; g: number; b: number }> => {
  const data = imageDataObj.data;
  const colorPalette = new Map<string, { r: number; g: number; b: number }>();

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Only include fully opaque pixels
    if (a === 255) {
      const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
      if (!colorPalette.has(hex)) {
        colorPalette.set(hex, { r, g, b });
      }
    }
  }

  return colorPalette;
};

/**
 * Finds the nearest color in the palette using Euclidean distance in RGB space.
 */
const findNearestColor = (
  r: number,
  g: number,
  b: number,
  palette: Map<string, { r: number; g: number; b: number }>
): { hex: string; r: number; g: number; b: number } => {
  let nearestHex = '#000000';
  let nearestRGB = { r: 0, g: 0, b: 0 };
  let minDistance = Infinity;

  for (const [hex, rgb] of palette) {
    const distance = Math.sqrt(
      Math.pow(r - rgb.r, 2) + Math.pow(g - rgb.g, 2) + Math.pow(b - rgb.b, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestHex = hex;
      nearestRGB = rgb;
    }
  }

  return { hex: nearestHex, ...nearestRGB };
};

/**
 * Applies a transparency mask to an image based on an alpha threshold.
 * Pixels with alpha < threshold become fully transparent (0).
 * Pixels with alpha >= threshold become fully opaque (255).
 * Optionally applies color palette reduction to newly opaque pixels.
 * 
 * @param imageData - The base64 string of the image.
 * @param threshold - The alpha threshold (0-255).
 * @param useTemplatePalette - If true, map newly opaque pixels to nearest opaque colors.
 * @returns A Promise that resolves to the processed base64 string.
 */
export const applyTransparencyMask = (
  imageData: string,
  threshold: number,
  useTemplatePalette: boolean = true
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0);
          const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageDataObj.data;

          // Extract opaque color palette before processing if needed
          let opaqueColorPalette: Map<string, { r: number; g: number; b: number }> | null = null;
          if (useTemplatePalette) {
            opaqueColorPalette = extractOpaqueColorPalette(imageDataObj);
          }

          for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3];
            
            // If alpha === 0, continue (keep transparent)
            if (alpha === 0) {
              continue;
            }

            // If alpha < threshold, set data[i + 3] = 0 (make transparent)
            if (alpha < threshold) {
              data[i + 3] = 0;
            } else {
              // Else, set data[i + 3] = 255 (make opaque)
              data[i + 3] = 255;

              // If using template palette, map opaque pixels to nearest opaque color
              if (useTemplatePalette && opaqueColorPalette && opaqueColorPalette.size > 0) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const nearest = findNearestColor(r, g, b, opaqueColorPalette);
                data[i] = nearest.r;
                data[i + 1] = nearest.g;
                data[i + 2] = nearest.b;
              }
            }
          }

          ctx.putImageData(imageDataObj, 0, 0);
          resolve(canvas.toDataURL());
        } catch (err) {
          console.error('Error processing image data:', err);
          reject(err);
        }
      };

      img.onerror = (err) => {
        console.error('Error loading image for processing:', err);
        reject(new Error('Failed to load image'));
      };

      img.src = imageData;
    } catch (err) {
      console.error('Error initiating image processing:', err);
      reject(err);
    }
  });
};
