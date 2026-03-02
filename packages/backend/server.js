import http from "node:http";

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");

  if (req.url === "/api/health") {
    res.statusCode = 200;
    res.end(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }));
    return;
  }

  if (req.url === "/api") {
    res.statusCode = 200;
    res.end(JSON.stringify({ message: "Welcome to Wine & Dices API" }));
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Not Found" }));
});

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
