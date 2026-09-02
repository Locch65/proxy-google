const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Impostazioni CORS per permettere la comunicazione con la tua Web App
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // 1. Recupera la versione inviata nei parametri dalla tua Web App
    const appVersion = req.query.appVersion || '';

    // 2. Seleziona la variabile d'ambiente su Vercel in base alla versione
    let scriptUrl;
    if (appVersion.startsWith("1.")) {
      scriptUrl = process.env.SCRIPT_URL_V1;
    } else {
      scriptUrl = process.env.SCRIPT_URL_V2;
    }

    if (!scriptUrl) {
      return res.status(500).json({
        success: false,
        error: "Variabile d'ambiente non configurata su Vercel per questa versione dell'app."
      });
    }

    // 3. Ricostruisce la Query String mantenendo tutti i parametri originali
    const urlParams = new URLSearchParams(req.query).toString();
    const targetUrl = urlParams ? `${scriptUrl}?${urlParams}` : scriptUrl;

    let fetchOptions = {
      method: req.method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (req.method === 'POST') {
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    // 4. Effettua la chiamata a Google Apps Script direttamente dai server Vercel
    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    console.error('Errore Proxy Vercel:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};