const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // 1. Estrae appVersion provando da req.query o dal body
    let appVersion = req.query.appVersion || '';
    if (!appVersion && req.body) {
      if (typeof req.body === 'object') {
        appVersion = req.body.appVersion || '';
      } else if (typeof req.body === 'string') {
        try {
          const parsed = JSON.parse(req.body);
          appVersion = parsed.appVersion || '';
        } catch (e) {}
      }
    }

    // 2. Seleziona lo script corretto
    let scriptUrl;
    if (appVersion.startsWith("1.")) {
      scriptUrl = process.env.SCRIPT_URL_V1;
    } else {
      scriptUrl = process.env.SCRIPT_URL_V2;
    }

    if (!scriptUrl) {
      return res.status(500).json({
        success: false,
        error: `Variabile d'ambiente non configurata per la versione: '${appVersion}'`
      });
    }

    // 3. Ricostruisce la Query String per le chiamate GET
    const urlParams = new URLSearchParams(req.query).toString();
    const targetUrl = urlParams ? `${scriptUrl}?${urlParams}` : scriptUrl;

    let fetchOptions = {
      method: req.method
    };

    if (req.method === 'POST') {
      // Inoltra il Content-Type originale (es: application/json o multipart/form-data)
      const contentType = req.headers['content-type'] || 'application/json';
      fetchOptions.headers = { 'Content-Type': contentType };

      // Prepara il body mantenendo il formato corretto
      if (typeof req.body === 'object') {
        fetchOptions.body = JSON.stringify(req.body);
        fetchOptions.headers['Content-Type'] = 'application/json';
      } else {
        fetchOptions.body = req.body;
      }
    }

    // 4. Inoltra la richiesta a Google Apps Script
    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    console.error('Errore Proxy Vercel:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
