const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5050;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let reqUrl = decodeURIComponent(req.url.split('?')[0]);
  if (reqUrl === '/') {
    // Landing navigation page for local preview
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>MONTAXX - Ambiente de Desenvolvimento Local</title>
        <style>
          body { font-family: sans-serif; background: #0B0C10; color: #FFF; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
          .card { background: #141720; border: 1px solid #FFB800; border-radius: 16px; padding: 40px; text-align: center; max-width: 500px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
          h1 { color: #FFB800; margin-bottom: 8px; }
          p { color: #94A3B8; margin-bottom: 30px; font-size: 15px; }
          .btn-group { display: flex; flex-direction: column; gap: 14px; }
          .btn { display: block; padding: 14px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; transition: all 0.2s; }
          .btn-primary { background: #FFB800; color: #000; }
          .btn-primary:hover { background: #FFA200; transform: translateY(-2px); }
          .btn-secondary { background: #1E2230; color: #FFF; border: 1px solid rgba(255,255,255,0.15); }
          .btn-secondary:hover { border-color: #FFB800; color: #FFB800; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>MONTAXX</h1>
          <p>Escolha qual ambiente deseja visualizar localmente:</p>
          <div class="btn-group">
            <a href="/site/" class="btn btn-primary">🌐 Acessar SITE (Landing Page & Loja)</a>
            <a href="/sistema/" class="btn btn-secondary">⚡ Acessar SISTEMA (ERP do Montador)</a>
          </div>
        </div>
      </body>
      </html>
    `);
    return;
  }

  let filePath = path.join(__dirname, reqUrl);

  // Se for diretório, busca index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 - Arquivo não encontrado');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`MONTAXX Dev Server rodando em http://localhost:${PORT}`);
});
