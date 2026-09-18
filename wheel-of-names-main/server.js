const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT) || 3000;
const root = __dirname;
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

function getFilePath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, `http://${'localhost'}`).pathname);
  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.resolve(root, `.${requestedPath}`);
  return filePath.startsWith(root) ? filePath : null;
}

const server = http.createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end('Method Not Allowed');
    return;
  }

  let filePath = getFilePath(request.url);
  if (!filePath) {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Bad Request');
    return;
  }

  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      filePath = path.join(root, 'index.html');
    }

    fs.readFile(filePath, (readError, content) => {
      if (readError) {
        response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Server Error');
        return;
      }

      const extension = path.extname(filePath).toLowerCase();
      response.writeHead(200, {
        'Content-Type': mimeTypes[extension] || 'application/octet-stream',
        'Cache-Control': 'no-cache'
      });
      if (request.method === 'HEAD') {
        response.end();
      } else {
        response.end(content);
      }
    });
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Wheel of Names listening on port ${port}`);
});
