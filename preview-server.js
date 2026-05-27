const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = 8766;

const mimeTypes = {
  ".css": "text/css; charset=UTF-8",
  ".html": "text/html; charset=UTF-8",
  ".ico": "image/x-icon",
  ".js": "application/javascript; charset=UTF-8",
  ".json": "application/json; charset=UTF-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

http.createServer((request, response) => {
  const requestPath = (request.url || "/").split("?")[0];
  const relativePath = decodeURIComponent(requestPath === "/" ? "/index.html" : requestPath);
  const normalizedPath = path.normalize(relativePath).replace(/^(\.\.[\\/])+/, "");
  const filePath = path.join(root, normalizedPath);

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, file) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
    });
    response.end(file);
  });
}).listen(port, "127.0.0.1", () => {
  console.log("Preview server running at http://127.0.0.1:" + port + "/");
});
