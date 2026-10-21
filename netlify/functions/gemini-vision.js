/**
 * Netlify Serverless Function — Proxy d'analyse visuelle Google Gemini Flash
 * 
 * Ce proxy permet d'exécuter l'analyse IA côté serveur Netlify sans JAMAIS exposer
 * la clé API secrète (GEMINI_API_KEY) dans le code client ou les requêtes du navigateur.
 */

const CANDIDATE_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.6-flash'];

exports.handler = async (event) => {
  // Gestion du preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Méthode non autorisée (POST requis)' })
    };
  }

  // Clé API stockée de façon sécurisée dans les variables d'environnement secrètes de Netlify
  const apiKey = (process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY || '').trim();

  if (!apiKey) {
    return {
      statusCode: 503,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Clé API Gemini non configurée sur le serveur Netlify. Veuillez ajouter GEMINI_API_KEY dans les variables d’environnement de Netlify.'
      })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Format de requête invalide (JSON attendu)' })
    };
  }

  const { base64Data, mimeType, instructions } = body;
  if (!base64Data) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Image manquante' })
    };
  }

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
                { inline_data: { mime_type: mimeType || 'image/jpeg', data: base64Data } },
                { text: instructions }
              ]
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) {
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ text: text.trim() })
          };
        }
      }

      const errorData = await response.json().catch(() => ({}));
      lastErrorMessage = errorData?.error?.message || `Erreur HTTP ${response.status}`;

      if (response.status === 503 || response.status === 429 || response.status === 404) {
        continue;
      }
      break;
    } catch (err) {
      lastErrorMessage = err.message || 'Erreur réseau';
    }
  }

  return {
    statusCode: 502,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      error: `Échec de l'analyse IA : ${lastErrorMessage || 'Service temporairement indisponible'}`
    })
  };
};
