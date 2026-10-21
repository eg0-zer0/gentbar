// Générateur de QR Code autonome (ISO/IEC 18004, mode Octet / Byte, niveau de correction L, versions 1 à 40)
// Sans aucune dépendance externe, rendu direct en matrice booléenne / chemin SVG.

// Coordonnées des motifs d'alignement pour les versions 1 à 40 (index 0 inutilisé)
const ALIGNMENT_COORDS = [
  [],
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
  [6, 30, 54],
  [6, 32, 58],
  [6, 34, 62],
  [6, 26, 46, 66],
  [6, 26, 48, 70],
  [6, 26, 50, 74],
  [6, 30, 54, 78],
  [6, 30, 56, 82],
  [6, 30, 58, 86],
  [6, 34, 62, 90],
  [6, 28, 50, 72, 94],
  [6, 26, 50, 74, 98],
  [6, 30, 54, 78, 102],
  [6, 28, 54, 80, 106],
  [6, 32, 58, 84, 110],
  [6, 30, 58, 86, 114],
  [6, 34, 62, 90, 118],
  [6, 26, 50, 74, 98, 122],
  [6, 30, 54, 78, 102, 126],
  [6, 26, 52, 78, 104, 130],
  [6, 30, 56, 82, 108, 134],
  [6, 34, 60, 86, 112, 138],
  [6, 30, 58, 86, 114, 142],
  [6, 34, 62, 90, 118, 146],
  [6, 30, 54, 78, 102, 126, 150],
  [6, 24, 50, 76, 102, 128, 154],
  [6, 28, 54, 80, 106, 132, 158],
  [6, 32, 58, 84, 110, 136, 162],
  [6, 26, 54, 82, 110, 138, 166],
  [6, 30, 58, 86, 114, 142, 170]
];

// Niveaux de correction d'erreur (ISO/IEC 18004) : [ecCodewordsPerBlock, numBlocks] (index 1..40)
const EC_TABLES = {
  L: [
    null,
    [7, 1], [10, 1], [15, 1], [20, 1], [26, 1],
    [18, 2], [20, 2], [24, 2], [30, 2], [18, 4],
    [20, 4], [24, 4], [26, 4], [30, 4], [22, 6],
    [24, 6], [28, 6], [30, 6], [28, 7], [28, 8],
    [28, 8], [28, 9], [30, 9], [30, 10], [26, 12],
    [28, 12], [30, 12], [30, 13], [30, 14], [30, 15],
    [30, 16], [30, 17], [30, 18], [30, 19], [30, 19],
    [30, 20], [30, 21], [30, 22], [30, 24], [30, 25]
  ],
  M: [
    null,
    [10, 1], [16, 1], [26, 1], [18, 2], [24, 2],
    [16, 4], [18, 4], [22, 4], [22, 5], [26, 5],
    [30, 5], [22, 8], [22, 9], [24, 9], [24, 10],
    [28, 10], [28, 11], [26, 13], [26, 14], [26, 16],
    [26, 17], [28, 17], [28, 18], [28, 20], [28, 21],
    [28, 23], [28, 25], [28, 26], [28, 28], [28, 29],
    [28, 31], [28, 33], [28, 35], [28, 37], [28, 38],
    [28, 40], [28, 43], [28, 45], [28, 47], [28, 49]
  ],
  Q: [
    null,
    [13, 1], [22, 1], [18, 2], [26, 2], [18, 4],
    [24, 4], [18, 6], [22, 6], [20, 8], [24, 8],
    [28, 8], [26, 10], [24, 12], [20, 16], [30, 12],
    [24, 17], [28, 16], [28, 18], [26, 21], [30, 20],
    [28, 23], [28, 25], [30, 25], [30, 27], [30, 29],
    [30, 31], [30, 33], [30, 35], [30, 37], [30, 38],
    [30, 40], [30, 43], [30, 45], [30, 47], [30, 49],
    [30, 51], [30, 53], [30, 56], [30, 59], [30, 62]
  ],
  H: [
    null,
    [17, 1], [28, 1], [22, 2], [16, 4], [22, 4],
    [28, 4], [26, 5], [26, 6], [24, 8], [28, 8],
    [24, 11], [28, 11], [22, 16], [24, 16], [24, 18],
    [30, 16], [28, 19], [28, 21], [26, 25], [28, 25],
    [30, 25], [28, 27], [30, 29], [30, 32], [30, 34],
    [30, 36], [30, 39], [30, 42], [30, 45], [30, 48],
    [30, 51], [30, 54], [30, 57], [30, 60], [30, 63],
    [30, 66], [30, 70], [30, 74], [30, 77], [30, 81]
  ]
};

const EC_INDICATORS = {
  L: 0b01,
  M: 0b00,
  Q: 0b11,
  H: 0b10
};

// Tables GF(256) avec polynôme primitif 0x11D
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i += 1) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function buildReedSolomonDivisor(degree) {
  let result = new Uint8Array([1]);
  for (let i = 0; i < degree; i += 1) {
    const next = new Uint8Array(result.length + 1);
    const root = GF_EXP[i];
    for (let j = 0; j < result.length; j += 1) {
      next[j] ^= result[j];
      next[j + 1] ^= gfMul(result[j], root);
    }
    result = next;
  }
  return result.slice(1);
}

function computeReedSolomonRemainder(data, degree) {
  const divisor = buildReedSolomonDivisor(degree);
  const result = new Uint8Array(degree);
  for (let i = 0; i < data.length; i += 1) {
    const factor = data[i] ^ result[0];
    result.copyWithin(0, 1);
    result[degree - 1] = 0;
    for (let j = 0; j < degree; j += 1) {
      result[j] ^= gfMul(divisor[j], factor);
    }
  }
  return result;
}

function getNumRawDataModules(version) {
  const size = version * 4 + 17;
  let result = size * size;
  result -= 3 * 64; // 3 finder patterns + séparateurs
  result -= 31; // format info + dark module
  result -= 2 * (size - 16); // timing patterns

  const alignCount = ALIGNMENT_COORDS[version].length;
  if (alignCount > 0) {
    const numAlign = alignCount * alignCount - 3;
    result -= numAlign * 25;
    result += (alignCount - 2) * 10; // chevauchement avec timing patterns
  }
  if (version >= 7) {
    result -= 36; // 2 blocs version info 6x3
  }
  return result;
}

function getTotalDataCodewords(version, ecLevel = 'L') {
  const totalCodewords = Math.floor(getNumRawDataModules(version) / 8);
  const table = EC_TABLES[ecLevel] || EC_TABLES.L;
  const [ecPerBlock, numBlocks] = table[version];
  return totalCodewords - ecPerBlock * numBlocks;
}

function utf8Bytes(text) {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(text);
  }
  return new Uint8Array(Buffer.from(text, 'utf8'));
}

function appendBits(val, len, bitArray) {
  for (let i = len - 1; i >= 0; i -= 1) {
    bitArray.push((val >>> i) & 1);
  }
}

function encodeDataCodewords(bytes, version, ecLevel = 'L') {
  const capacityCodewords = getTotalDataCodewords(version, ecLevel);
  const capacityBits = capacityCodewords * 8;
  const bits = [];

  // Mode Octet (0100)
  appendBits(0b0100, 4, bits);
  // Longueur en octets (8 bits pour V1..9, 16 bits pour V10..40)
  const countBits = version <= 9 ? 8 : 16;
  appendBits(bytes.length, countBits, bits);

  for (let i = 0; i < bytes.length; i += 1) {
    appendBits(bytes[i], 8, bits);
  }

  // Terminateur (jusqu'à 4 zéros)
  appendBits(0, Math.min(4, capacityBits - bits.length), bits);
  // Alignement sur octet
  appendBits(0, (8 - (bits.length % 8)) % 8, bits);

  // Octets de bourrage alternés 0xEC / 0x11
  let padByte = 0xec;
  while (bits.length < capacityBits) {
    appendBits(padByte, 8, bits);
    padByte = padByte === 0xec ? 0x11 : 0xec;
  }

  const dataCodewords = new Uint8Array(capacityCodewords);
  for (let i = 0; i < bits.length; i += 1) {
    dataCodewords[i >>> 3] |= bits[i] << (7 - (i & 7));
  }
  return dataCodewords;
}

function interleaveWithEcc(dataCodewords, version, ecLevel = 'L') {
  const totalCodewords = Math.floor(getNumRawDataModules(version) / 8);
  const table = EC_TABLES[ecLevel] || EC_TABLES.L;
  const [ecPerBlock, numBlocks] = table[version];
  const numShortBlocks = numBlocks - (totalCodewords % numBlocks);
  const shortBlockTotalLen = Math.floor(totalCodewords / numBlocks);
  const shortDataLen = shortBlockTotalLen - ecPerBlock;

  const dataBlocks = [];
  const eccBlocks = [];
  let offset = 0;

  for (let i = 0; i < numBlocks; i += 1) {
    const dataLen = shortDataLen + (i < numShortBlocks ? 0 : 1);
    const block = dataCodewords.subarray(offset, offset + dataLen);
    offset += dataLen;
    dataBlocks.push(block);
    eccBlocks.push(computeReedSolomonRemainder(block, ecPerBlock));
  }

  const result = new Uint8Array(totalCodewords);
  let idx = 0;
  const maxDataLen = shortDataLen + (numShortBlocks < numBlocks ? 1 : 0);

  for (let i = 0; i < maxDataLen; i += 1) {
    for (let j = 0; j < numBlocks; j += 1) {
      if (i < dataBlocks[j].length) {
        result[idx] = dataBlocks[j][i];
        idx += 1;
      }
    }
  }
  for (let i = 0; i < ecPerBlock; i += 1) {
    for (let j = 0; j < numBlocks; j += 1) {
      result[idx] = eccBlocks[j][i];
      idx += 1;
    }
  }
  return result;
}

function drawFinderPattern(modules, isFunction, cx, cy) {
  const size = modules.length;
  for (let dy = -4; dy <= 4; dy += 1) {
    for (let dx = -4; dx <= 4; dx += 1) {
      const x = cx + dx;
      const y = cy + dy;
      if (x >= 0 && x < size && y >= 0 && y < size) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        modules[y][x] = dist !== 2 && dist !== 4;
        isFunction[y][x] = true;
      }
    }
  }
}

function drawAlignmentPattern(modules, isFunction, cx, cy) {
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      const dist = Math.max(Math.abs(dx), Math.abs(dy));
      modules[cy + dy][cx + dx] = dist !== 1;
      isFunction[cy + dy][cx + dx] = true;
    }
  }
}

function drawFormatBits(modules, isFunction, mask, ecBits = 0b01) {
  const size = modules.length;
  const data = (ecBits << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i += 1) {
    rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  }
  const bits = ((data << 10) | rem) ^ 0x5412;

  for (let i = 0; i <= 5; i += 1) {
    modules[8][i] = ((bits >>> i) & 1) !== 0;
    isFunction[8][i] = true;
  }
  modules[8][7] = ((bits >>> 6) & 1) !== 0;
  isFunction[8][7] = true;
  modules[8][8] = ((bits >>> 7) & 1) !== 0;
  isFunction[8][8] = true;
  modules[7][8] = ((bits >>> 8) & 1) !== 0;
  isFunction[7][8] = true;
  for (let i = 9; i < 15; i += 1) {
    modules[14 - i][8] = ((bits >>> i) & 1) !== 0;
    isFunction[14 - i][8] = true;
  }

  for (let i = 0; i < 8; i += 1) {
    modules[8][size - 1 - i] = ((bits >>> i) & 1) !== 0;
    isFunction[8][size - 1 - i] = true;
  }
  for (let i = 8; i < 15; i += 1) {
    modules[size - 15 + i][8] = ((bits >>> i) & 1) !== 0;
    isFunction[size - 15 + i][8] = true;
  }
  modules[size - 8][8] = true;
  isFunction[size - 8][8] = true;
}

function drawVersionBits(modules, isFunction, version) {
  if (version < 7) return;
  const size = modules.length;
  let rem = version;
  for (let i = 0; i < 12; i += 1) {
    rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
  }
  const bits = (version << 12) | rem;
  for (let i = 0; i < 18; i += 1) {
    const bit = ((bits >>> i) & 1) !== 0;
    const a = size - 11 + (i % 3);
    const b = Math.floor(i / 3);
    modules[a][b] = bit;
    isFunction[a][b] = true;
    modules[b][a] = bit;
    isFunction[b][a] = true;
  }
}

function applyMask(modules, isFunction, mask) {
  const size = modules.length;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (isFunction[y][x]) continue;
      let invert = false;
      switch (mask) {
        case 0: invert = (x + y) % 2 === 0; break;
        case 1: invert = y % 2 === 0; break;
        case 2: invert = x % 3 === 0; break;
        case 3: invert = (x + y) % 3 === 0; break;
        case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
        case 5: invert = ((x * y) % 2) + ((x * y) % 3) === 0; break;
        case 6: invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
        case 7: invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0; break;
        default: break;
      }
      if (invert) modules[y][x] = !modules[y][x];
    }
  }
}

function computePenalty(modules) {
  const size = modules.length;
  let penalty = 0;

  // Règle 1 : lignes et colonnes consécutives de même couleur (>= 5)
  for (let y = 0; y < size; y += 1) {
    let runColor = modules[y][0];
    let runLen = 1;
    for (let x = 1; x < size; x += 1) {
      if (modules[y][x] === runColor) {
        runLen += 1;
        if (runLen === 5) penalty += 3;
        else if (runLen > 5) penalty += 1;
      } else {
        runColor = modules[y][x];
        runLen = 1;
      }
    }
  }
  for (let x = 0; x < size; x += 1) {
    let runColor = modules[0][x];
    let runLen = 1;
    for (let y = 1; y < size; y += 1) {
      if (modules[y][x] === runColor) {
        runLen += 1;
        if (runLen === 5) penalty += 3;
        else if (runLen > 5) penalty += 1;
      } else {
        runColor = modules[y][x];
        runLen = 1;
      }
    }
  }

  // Règle 2 : blocs 2x2 de même couleur
  for (let y = 0; y < size - 1; y += 1) {
    for (let x = 0; x < size - 1; x += 1) {
      const c = modules[y][x];
      if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) {
        penalty += 3;
      }
    }
  }

  return penalty;
}

/**
 * Génère la matrice booléenne 2D d'un QR code pour une chaîne UTF-8 donnée.
 */
export function generateQrMatrix(text, ecLevel = 'L') {
  const normalizedEc = (ecLevel && EC_TABLES[ecLevel]) ? ecLevel : 'L';
  const ecBits = EC_INDICATORS[normalizedEc] ?? 0b01;
  const bytes = utf8Bytes(String(text || ''));
  let version = 1;
  while (version <= 40) {
    const cap = getTotalDataCodewords(version, normalizedEc);
    const headerBytes = version <= 9 ? 2 : 3;
    if (bytes.length + headerBytes <= cap) break;
    version += 1;
  }
  if (version > 40) {
    throw new Error('Contenu trop volumineux pour un QR code.');
  }

  const dataCodewords = encodeDataCodewords(bytes, version, normalizedEc);
  const allCodewords = interleaveWithEcc(dataCodewords, version, normalizedEc);

  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction = Array.from({ length: size }, () => Array(size).fill(false));

  // Motifs de synchronisation (timing)
  for (let i = 0; i < size; i += 1) {
    modules[6][i] = i % 2 === 0;
    isFunction[6][i] = true;
    modules[i][6] = i % 2 === 0;
    isFunction[i][6] = true;
  }

  // 3 motifs de détection (finder)
  drawFinderPattern(modules, isFunction, 3, 3);
  drawFinderPattern(modules, isFunction, size - 4, 3);
  drawFinderPattern(modules, isFunction, 3, size - 4);

  // Motifs d'alignement
  const coords = ALIGNMENT_COORDS[version];
  for (let i = 0; i < coords.length; i += 1) {
    for (let j = 0; j < coords.length; j += 1) {
      if (
        (i === 0 && j === 0) ||
        (i === 0 && j === coords.length - 1) ||
        (i === coords.length - 1 && j === 0)
      ) {
        continue;
      }
      drawAlignmentPattern(modules, isFunction, coords[i], coords[j]);
    }
  }

  // Réservation des zones de format et de version
  drawFormatBits(modules, isFunction, 0, ecBits);
  drawVersionBits(modules, isFunction, version);

  // Placement des bits de données en zigzag de droite à gauche
  let bitIdx = 0;
  const totalBits = allCodewords.length * 8;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert += 1) {
      for (let j = 0; j < 2; j += 1) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!isFunction[y][x] && bitIdx < totalBits) {
          modules[y][x] = ((allCodewords[bitIdx >>> 3] >>> (7 - (bitIdx & 7))) & 1) !== 0;
          bitIdx += 1;
        }
      }
    }
  }

  // Sélection du meilleur masque (0..7)
  let bestMask = 0;
  let minPenalty = Infinity;
  for (let mask = 0; mask < 8; mask += 1) {
    applyMask(modules, isFunction, mask);
    drawFormatBits(modules, isFunction, mask, ecBits);
    const p = computePenalty(modules);
    if (p < minPenalty) {
      minPenalty = p;
      bestMask = mask;
    }
    applyMask(modules, isFunction, mask); // annule le masque
  }

  applyMask(modules, isFunction, bestMask);
  drawFormatBits(modules, isFunction, bestMask);

  return modules;
}

/**
 * Construit un chemin SVG (`d="..."`) compact représentant tous les modules noirs de la matrice QR.
 */
export function buildQrSvgPath(matrix, margin = 2) {
  if (!Array.isArray(matrix) || matrix.length === 0) return { path: '', viewBoxSize: 0 };
  const size = matrix.length;
  const segments = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (matrix[y][x]) {
        segments.push(`M${x + margin},${y + margin}h1v1h-1z`);
      }
    }
  }
  return {
    path: segments.join(''),
    viewBoxSize: size + margin * 2
  };
}
