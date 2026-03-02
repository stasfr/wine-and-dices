import http from 'node:http';

const SERVER_PORT = process.env.SERVER_PORT as unknown as number;
const SERVER_URL = process.env.SERVER_URL as string;
const SERVER_PROTOCOL = process.env.SERVER_PROTOCOL as string;

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/api/health') {
    res.statusCode = 200;
    res.end(
      JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }),
    );
    return;
  }

  if (req.url === '/api') {
    res.statusCode = 200;
    res.end(JSON.stringify({ message: 'Welcome to Wine & Dices API' }));
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(SERVER_PORT, SERVER_URL, () => {
  console.log(
    `Server running at ${SERVER_PROTOCOL}://${SERVER_URL}:${SERVER_PORT}`,
  );
});
