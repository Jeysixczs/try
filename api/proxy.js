export default async function handler(req, res) {
  const { url, referer } = req.query;
  if (!url) {
    res.status(400).send('Missing url parameter');
    return;
  }

  try {
    const targetRes = await fetch(url, {
      headers: {
        'Referer': referer || 'https://megacloud.blog/',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    // Forward status and content-type
    res.status(targetRes.status);
    res.setHeader('Content-Type', targetRes.headers.get('content-type') || 'application/octet-stream');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Pipe response
    const reader = targetRes.body.getReader();
    const stream = new ReadableStream({
      async pull(controller) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
        } else {
          controller.enqueue(value);
        }
      }
    });

    const responseStream = stream;
    return new Response(responseStream, {
      headers: {
        'Content-Type': targetRes.headers.get('content-type') || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*'
      },
      status: targetRes.status
    });
  } catch (err) {
    res.status(500).send('Proxy error: ' + err.message);
  }
}