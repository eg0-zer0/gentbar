/**
 * Service d'analyse visuelle de cartes de boissons via Google Gemini Flash.
 */

export const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || '';

const PROMPT_INSTRUCTIONS = `Voici la photo d'une carte de boissons. Rédige UNIQUEMENT la liste textuelle brute pour l'importer directement dans mon application de bar.
RÈGLES STRICTES :
1. Ne mets AUCUN texte d'introduction, AUCUN commentaire et AUCUNE politesse.
2. N'utilise PAS de tableau, PAS de puces (pas de tiret ni de bullet) et PAS de gras (**).
3. Titres de catégories : écris chaque catégorie ENTIÈREMENT EN MAJUSCULES sur sa propre ligne (ex : BIÈRES, COCKTAILS, VINS, SOFTS).
4. Boissons : une seule boisson par ligne au format : Nom Volume Prix € (ex : Jupiler 25cl 2,50 €).
5. Ignore totalement les recettes, listes d'ingrédients ou descriptions sous les boissons.
6. En cas de double tarif (verre / bouteille ou 25cl / 50cl), sépare-les par un slash sur la même ligne (ex : Whisky 10€ le verre / 50€ la bouteille).`;

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

const CANDIDATE_MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];

/**
 * Analyse une photo de carte de boissons via l'API Gemini avec bascule automatique en cas de charge.
 *
 * @param {File} file
 * @returns {Promise<string>} Texte brut des boissons
 */
export async function analyzeMenuPhotoWithGemini(file) {
  if (!GEMINI_API_KEY) {
    throw new Error('Clé API Gemini non configurée (REACT_APP_GEMINI_API_KEY).');
  }

  const { base64Data, mimeType } = await compressImageFile(file);

  let lastErrorMessage = '';

  for (let i = 0; i < CANDIDATE_MODELS.length; i += 1) {
    const model = CANDIDATE_MODELS[i];
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

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
