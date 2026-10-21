/**
 * Service d'analyse visuelle de cartes de boissons via Google Gemini Flash.
 */

export function getGeminiApiKey() {
  const envKey = (process.env.REACT_APP_GEMINI_API_KEY || '').trim();
  if (envKey) return envKey;
  try {
    const localKey = (localStorage.getItem('gemini_api_key') || '').trim();
    if (localKey) return localKey;
  } catch (e) {
    // ignore
  }
  return '';
}

export function saveGeminiApiKey(key) {
  try {
    if (key && key.trim()) {
      localStorage.setItem('gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  } catch (e) {
    // ignore
  }
}

export const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || '';

const PROMPT_INSTRUCTIONS = `Voici la photo d'une carte de boissons. Rédige UNIQUEMENT la liste textuelle brute pour l'importer directement dans mon application de bar.
RÈGLES STRICTES :
1. Ne mets AUCUN texte d'introduction, AUCUN commentaire et AUCUNE politesse.
2. N'utilise PAS de tableau, PAS de puces (pas de tiret ni de bullet) et PAS de gras (**).
3. Titres de catégories : écris chaque catégorie ENTIÈREMENT EN MAJUSCULES sur sa propre ligne (ex : BIÈRES, COCKTAILS, VINS, SOFTS, VIENNOISERIES).
4. SÉPARATION DES PRODUITS GROUPÉS : Si une ligne regroupe plusieurs produits distincts de même prix séparés par des virgules, des barres ou 'ou' (ex : 'Café, thé, Chocolat 1€', 'Eau, Eau pétillante 1€', 'Coca, Oasis, Ice Tea 1,5€', 'Snikers, Kitkat, Chips 0,5€', 'Verre de Rouge, rosé, blanc 1€'), DÉCOUPE-LES IMPÉRATIVEMENT EN LIGNES DISTINCTES avec le même prix pour chacune (ex : Café 1€ puis Thé 1€ puis Chocolat 1€ ; Verre de Rouge 1€ puis Verre de Rosé 1€ puis Verre de Blanc 1€).
5. Boissons : une seule boisson par ligne au format : Nom Volume Prix € (ex : Jupiler 25cl 2,50 €).
6. Ignore totalement les recettes, listes d'ingrédients ou descriptions sous les boissons.
7. En cas de double tarif (verre / bouteille ou 25cl / 50cl), sépare-les par un slash sur la même ligne (ex : Whisky 10€ le verre / 50€ la bouteille).`;

/**
 * Redimensionne un fichier image en JPEG compressé (max 1600px).
 *
 * @param {File} file
 * @param {number} [maxDim=1600]
 * @returns {Promise<{ base64Data: string, mimeType: string }>}
 */
export function compressImageFile(file, maxDim = 1600) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
        resolve({ base64Data, mimeType: 'image/jpeg' });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

const CANDIDATE_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.6-flash'];

/**
 * Analyse une photo de carte de boissons via l'API Gemini avec bascule automatique en cas de charge.
 *
 * @param {File} file
 * @returns {Promise<string>} Texte brut des boissons
 */
export async function analyzeMenuPhotoWithGemini(file) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Clé API Gemini non configurée (REACT_APP_GEMINI_API_KEY).');
  }

  const { base64Data, mimeType } = await compressImageFile(file);

  let lastErrorMessage = '';

  for (let i = 0; i < CANDIDATE_MODELS.length; i += 1) {
    const model = CANDIDATE_MODELS[i];
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inline_data: { mime_type: mimeType, data: base64Data } },
                { text: PROMPT_INSTRUCTIONS }
              ]
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) {
          return text.trim();
        }
      }

      const errorData = await response.json().catch(() => ({}));
      lastErrorMessage = errorData?.error?.message || `Erreur HTTP ${response.status}`;

      // Si erreur 503 (haute demande) ou 429 (rate limit) ou 404, tenter le modèle suivant
      if (response.status === 503 || response.status === 429 || response.status === 404) {
        continue;
      }

      // Pour les autres erreurs (ex: 400 Bad Request), inutile de boucler
      break;
    } catch (err) {
      lastErrorMessage = err.message || 'Erreur réseau';
    }
  }

  throw new Error(`Échec de l'analyse IA : ${lastErrorMessage || 'Service temporairement indisponible'}`);
}
