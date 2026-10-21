import jsQR from 'jsqr';
import { generateQrMatrix } from './qrcode';

describe('QR code de partage d\'application avec style personnalisé GentBar', () => {
  const APP_URL = 'https://gentbar.netlify.app';

  function renderStyledQrToPixels(matrix, logoSizeModules = 5.2) {
    const size = matrix.length; // 29
    const margin = 3;
    const scale = 14;
    const totalModules = size + margin * 2;
    const imgSize = totalModules * scale;
    const data = new Uint8ClampedArray(imgSize * imgSize * 4);

    const centerPx = (margin + size / 2) * scale;
    const halfLogoPx = (logoSizeModules / 2) * scale;

    const finders = [
      { cx: margin + 3.5, cy: margin + 3.5, originX: margin, originY: margin },
      { cx: margin + size - 3.5, cy: margin + 3.5, originX: margin + size - 7, originY: margin },
      { cx: margin + 3.5, cy: margin + size - 3.5, originX: margin, originY: margin + size - 7 }
    ];

    const darkColor = [30, 15, 43]; // #1e0f2b
    const pupilColor = [136, 19, 55]; // #881337 bordeaux GentBar

    for (let y = 0; y < imgSize; y++) {
      for (let x = 0; x < imgSize; x++) {
        const idx = (y * imgSize + x) * 4;

        // 1. Fond blanc par défaut
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] = 255;

        // 2. Logo au centre (5.2x5.2 modules)
        if (
          Math.abs(x - centerPx) <= halfLogoPx &&
          Math.abs(y - centerPx) <= halfLogoPx
        ) {
          // Fond bleu nuit du logo GentBar
          data[idx] = 15;
          data[idx + 1] = 26;
          data[idx + 2] = 47;
          data[idx + 3] = 255;
          continue;
        }

        const modX = x / scale;
        const modY = y / scale;

        // 3. Vérification des 3 finders patterns
        let handledByFinder = false;
        for (const f of finders) {
          const dx = modX - f.cx;
          const dy = modY - f.cy;
          const distFromCenter = Math.sqrt(dx * dx + dy * dy);

          if (
            modX >= f.originX &&
            modX <= f.originX + 7 &&
            modY >= f.originY &&
            modY <= f.originY + 7
          ) {
            handledByFinder = true;
            // Pupille circulaire (rayon 1.5)
            if (distFromCenter <= 1.5) {
              data[idx] = pupilColor[0];
              data[idx + 1] = pupilColor[1];
              data[idx + 2] = pupilColor[2];
            } else if (
              modX >= f.originX + 1 &&
              modX <= f.originX + 6 &&
              modY >= f.originY + 1 &&
              modY <= f.originY + 6
            ) {
              // Anneau blanc de séparation
              data[idx] = 255;
              data[idx + 1] = 255;
              data[idx + 2] = 255;
            } else {
              // Cadre extérieur arrondi sombre
              data[idx] = darkColor[0];
              data[idx + 1] = darkColor[1];
              data[idx + 2] = darkColor[2];
            }
            break;
          }
        }

        if (handledByFinder) continue;

        // 4. Modules de données ordinaires
        const mx = Math.floor(modX - margin);
        const my = Math.floor(modY - margin);
        if (mx >= 0 && mx < size && my >= 0 && my < size && matrix[my][mx]) {
          data[idx] = darkColor[0];
          data[idx + 1] = darkColor[1];
          data[idx + 2] = darkColor[2];
        }
      }
    }

    return jsQR(data, imgSize, imgSize);
  }

  test('jsQR décode parfaitement le QR code stylé avec les yeux arrondis et le grand logo au centre', () => {
    const matrix = generateQrMatrix(APP_URL, 'M');
    const result = renderStyledQrToPixels(matrix, 5.2);
    expect(result).not.toBeNull();
    expect(result?.data).toBe(APP_URL);
  });
});
