// Import required modules
const express = require('express');
const morgan = require('morgan');

const app = express();

// Sample movie data
const movies = [
  { title: 'Movie 1', year: 2021 },
  { title: 'Movie 2', year: 2020 },
  { title: 'Movie 3', year: 2019 },
  { title: 'Movie 4', year: 2018 },
  { title: 'Movie 5', year: 2017 },
  { title: 'Movie 6', year: 2016 },
  { title: 'Movie 7', year: 2015 },
  { title: 'Movie 8', year: 2014 },
  { title: 'Movie 9', year: 2013 },
  { title: 'Movie 10', year: 2012 },
];

// Sample user data array
const users = [];

// Middleware for logging requests
app.use(morgan('common'));

// Use JSON parsing for POST/PUT requests
app.use(express.json());

// Root GET route with a welcome message
app.get('/', (req, res) => {
  res.send('Welcome to the Movie API!');
});

// GET /movies - Returns JSON data about all movies
app.get('/movies', (req, res) => {
  res.json(movies);
});

// GET /movies/:title - Returns data about a specific movie by title
app.get('/movies/:title', (req, res) => {
  const { title } = req.params;
  const movie = movies.find(
    (m) => m.title.toLowerCase() === title.toLowerCase()
  );
  if (movie) {
    res.json(movie);
  } else {
    res.status(404).json({ error: 'Movie not found' });
  }
});

// POST /users - Allows a new user to register
app.post('/users', (req, res) => {
  const { username, password, email, birthday } = req.body;
  if (username && password && email && birthday) {
    const newUser = { username, password, email, birthday };
    users.push(newUser);
    res.json({ message: 'Registration successful', user: newUser });
  } else {
    res.status(400).json({ error: 'Please provide all required fields' });
  }
});

// Serve documentation.html file from the public folder
app.use('/documentation', express.static('public'));

// Error-handling middleware for logging errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Set the port to 3000
const port = 3000;

// Start the server and log the port in use
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
