const express = require('express');
const request = require('request');
const app = express();

// CORS header for all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Proxy endpoint
app.get('/proxy', (req, res) => {
  const { url, referer } = req.query;
  if (!url) return res.status(400).send('Missing url parameter');
  const headers = {
    'User-Agent': 'Mozilla/5.0',
    'Referer': referer || 'https://megacloud.blog/'
  };

  // Forward the stream
  request({ url, headers })
    .on('response', response => {
      res.set('Content-Type', response.headers['content-type'] || 'application/octet-stream');
    })
    .on('error', err => res.status(500).send('Proxy error: ' + err.message))
    .pipe(res);
});

app.listen(3000, () => console.log('Proxy running on port 3000'));