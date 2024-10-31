// Import required modules
const express = require('express');
const morgan = require('morgan');

const app = express();

// Middleware for logging requests
app.use(morgan('common'));

// GET route to return JSON data about movies
app.get('/movies', (req, res) => {
  res.json([
    { title: 'Movie 1', year: 2021 },
    { title: 'Movie 2', year: 2020 },
    { title: 'Movie 3', year: 2019 },
    // Add your top 10 movies here
  ]);
});

// Root GET route with a welcome message
app.get('/', (req, res) => {
  res.send('Welcome to the Movie API!');
});

// Serve documentation.html file from the public folder
app.use('/documentation', express.static('public'));

// Error-handling middleware for logging errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
