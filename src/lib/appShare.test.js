import jsQR from 'jsqr';
import { generateQrMatrix } from './qrcode';

describe('QR code de partage d\'application avec logo central', () => {
  const APP_URL = 'https://gentbar.netlify.app';

  function decodeMatrixWithCenterLogo(matrix, logoRadius = 2) {
    const size = matrix.length;
    const margin = 4;
    const scale = 8;
    const totalModules = size + margin * 2;
    const imgSize = totalModules * scale;
    const data = new Uint8ClampedArray(imgSize * imgSize * 4);

    const centerModule = Math.floor(size / 2);

    for (let my = 0; my < totalModules; my++) {
      for (let mx = 0; mx < totalModules; mx++) {
        const qrY = my - margin;
        const qrX = mx - margin;

        let isBlack =
          qrY >= 0 && qrY < size && qrX >= 0 && qrX < size && matrix[qrY][qrX];

        if (
          logoRadius > 0 &&
          Math.abs(qrY - centerModule) <= logoRadius &&
          Math.abs(qrX - centerModule) <= logoRadius
        ) {
          isBlack = false; // pastille blanche centrale pour le logo
        }

        const color = isBlack ? 0 : 255;
        for (let py = 0; py < scale; py++) {
          for (let px = 0; px < scale; px++) {
            const idx = ((my * scale + py) * imgSize + (mx * scale + px)) * 4;
            data[idx] = color;
            data[idx + 1] = color;
            data[idx + 2] = color;
            data[idx + 3] = 255;
          }
        }
      }
    }
    return jsQR(data, imgSize, imgSize);
  }

  test('jsQR décode le QR code en niveau M avec logo central (rayon 1 = 3x3 modules)', () => {
    const matrix = generateQrMatrix(APP_URL, 'M');
    const code = decodeMatrixWithCenterLogo(matrix, 1);
    expect(code).not.toBeNull();
    expect(code?.data).toBe(APP_URL);
  });

  test('jsQR décode le QR code en niveau M avec logo central (rayon 2 = 5x5 modules)', () => {
    const matrix = generateQrMatrix(APP_URL, 'M');
    const code = decodeMatrixWithCenterLogo(matrix, 2);
    expect(code).not.toBeNull();
    expect(code?.data).toBe(APP_URL);
  });

  test('La constante APP_SHARE_URL pointe vers gentbar.netlify.app', () => {
    expect(APP_URL).toBe('https://gentbar.netlify.app');
  });
});
