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
    const queryParams = { ...req.query };
    let scriptUrl;

    // Se la chiamata arriva da questa app, usiamo la variabile d'ambiente dedicata e rimuoviamo il flag
    if (queryParams.isTado !== undefined) {
      delete queryParams.isTado;
      scriptUrl = process.env.SCRIPT_URL_TADO;
    } else {
      // Altrimenti gestiamo la logica originaria dell'altra app basata su appVersion
      const appVersion = queryParams.appVersion || '';
      if (appVersion.startsWith("1.")) {
        scriptUrl = process.env.SCRIPT_URL_V1;
      } else {
        scriptUrl = process.env.SCRIPT_URL_V2;
      }
    }

    if (!scriptUrl) {
      return res.status(500).json({
        success: false,
        error: "Variabile d'ambiente non configurata su Vercel per questa applicazione."
      });
    }

    // Ricostruisce la Query String pulita (senza isTado o appVersion indesiderati)
    const urlParams = new URLSearchParams(queryParams).toString();
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