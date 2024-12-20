const http = require('http');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const url = require('url');

// MongoDB URI and connection
const mongoURI = 'your_mongodb_connection_string'; // Use your actual MongoDB URI here
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

const connection = mongoose.connection;
let gfs;

connection.once('open', () => {
  // Initialize GridFS Stream
  gfs = Grid(connection.db, mongoose.mongo);
  gfs.collection('images'); // The name of the collection where images are stored
});

const server = http.createServer((request, response) => {
  const parsedUrl = url.parse(request.url, true);
  const pathname = parsedUrl.pathname;

  // Check if the requested URL is for an image
  if (pathname.startsWith('/images/')) {
    const imageId = pathname.split('/images/')[1]; // Extract the image ID from the URL

    // Retrieve the image from MongoDB
    gfs.files.findOne(
      { _id: mongoose.Types.ObjectId(imageId) },
      (err, file) => {
        if (err || !file) {
          response.writeHead(404, { 'Content-Type': 'text/plain' });
          response.end('404 - Image Not Found');
          return;
        }

        // Set the proper content type based on the file's extension
        const fileType = file.contentType || 'application/octet-stream';
        response.writeHead(200, { 'Content-Type': fileType });

        // Create a stream to send the file data to the client
        const readStream = gfs.createReadStream({
          _id: mongoose.Types.ObjectId(imageId),
        });
        readStream.pipe(response);
      }
    );
  } else {
    // Default route to serve the main index.html
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

// Listen on port 3000
server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
