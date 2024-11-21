// Import required modules
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose'); // Import Mongoose for MongoDB interactions
const Models = require('./models.js'); // Import Mongoose models

const Movies = Models.Movie; // Assign the Movie model to a constant for easy access
const Users = Models.User; // Assign the User model to a constant for easy access

const app = express();

// Middleware for logging requests
app.use(morgan('common'));

// Use JSON parsing for POST/PUT requests
app.use(express.json());

// Correct MongoDB connection string (using port 27017, not 3000)
mongoose
  .connect('mongodb://localhost:27017/myFlixDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Root GET route with a welcome message
app.get('/', (req, res) => {
  res.send('Welcome to the Movie API!!!');
});

// GET /movies - Returns JSON data about all movies from the database
app.get('/movies', (req, res) => {
  console.log('Fetching all movies...'); // Log the action of fetching movies

  Movies.find() // Query MongoDB for all movies
    .then((movies) => {
      console.log('Movies retrieved:', movies); // Log the retrieved movies
      res.json(movies); // Respond with the movies in JSON format
    })
    .catch((err) => {
      console.error('Error retrieving movies:', err); // Log any errors
      res.status(500).json({ error: 'Error retrieving movies' }); // Respond with an error message
    });
});

// GET /movies/:title - Returns data about a specific movie by title
app.get('/movies/:title', (req, res) => {
  const { title } = req.params;
  // Use case-insensitive search for the movie title
  Movies.findOne({ title: { $regex: new RegExp('^' + title + '$', 'i') } })
    .then((movie) => {
      if (movie) {
        res.json(movie);
      } else {
        res.status(404).json({ error: 'Movie not found' });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Error retrieving movie' });
    });
});

// GET /directors - Returns a list of all directors from the database
app.get('/directors', (req, res) => {
  console.log('Fetching all directors...'); // Log the action of fetching directors

  Movies.aggregate([
    { $unwind: '$director' }, // Flatten the "director" field (if it's an array)
    { $group: { _id: '$director.name' } }, // Group by the director's name to get distinct directors
  ])
    .then((directors) => {
      console.log('Directors retrieved:', directors); // Log the retrieved directors
      res.json(directors); // Respond with the directors in JSON format
    })
    .catch((err) => {
      console.error('Error retrieving directors:', err); // Log any errors
      res.status(500).json({ error: 'Error retrieving directors' }); // Respond with an error message
    });
});

// POST /users - Allows a new user to register
app.post('/users', (req, res) => {
  const { username, password, email, birthday } = req.body;
  if (username && password && email && birthday) {
    Users.create({
      Username: username,
      Password: password,
      Email: email,
      Birthday: birthday,
    })
      .then((user) => res.json({ message: 'Registration successful', user }))
      .catch((err) => {
        console.error(err);
        res.status(500).json({ error: 'Error registering user' });
      });
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
