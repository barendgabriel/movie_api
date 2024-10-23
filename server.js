const http = require('http');
const fs = require('fs');
const url = require('url');

const server = http.createServer((request, response) => {
  const parsedUrl = url.parse(request.url, true);
  const path = parsedUrl.pathname;

  // Log the request URL and timestamp to log.txt
  const logMessage = `${new Date().toISOString()} - Requested URL: ${
    request.url
  }\n`;
  fs.appendFile('log.txt', logMessage, (err) => {
    if (err) throw err;
  });

  // Check if the requested URL contains the word "documentation"
  if (path === '/documentation') {
    // Serve the documentation.html file
    fs.readFile('documentation.html', (err, data) => {
      if (err) {
        response.writeHead(500, { 'Content-Type': 'text/plain' });
        response.end('500 - Internal Server Error');
      } else {
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end(data);
      }
    });
  } else {
    // Serve the index.html file if another route is accessed
    fs.readFile('index.html', (err, data) => {
      if (err) {
        response.writeHead(404, { 'Content-Type': 'text/plain' });
        response.end('404 - Not Found');
      } else {
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end(data);
      }
    });
  }
});

// Listen on port 8080
server.listen(8080, () => {
  console.log('Server is running on http://localhost:8080');
});
