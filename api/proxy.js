export default async function handler(req, res) {
  const url = req.query.url || req.body?.url;
  const referer = req.query.referer || req.body?.referer || 'https://megacloud.blog/';
  if (!url) {
    res.status(400).send('Missing url parameter');
    return;
  }

  try {
    // Fetch the remote resource
    const response = await fetch(url, {
      headers: {
        'Referer': referer,
        'User-Agent': 'Mozilla/5.0',
      }
    });

    // Forward status and headers
    res.status(response.status);
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Stream the response
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).send('Proxy error: ' + err.message);
  }
}