// Import required modules
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose'); // Import Mongoose for MongoDB interactions
const Models = require('./models.js'); // Import Mongoose models

const Movies = Models.Movie; // Assign the Movie model to a constant for easy access
const Users = Models.User; // Assign the User model to a constant for easy access
const Directors = Models.Director; // Assign the Director model to a constant for easy access
const Genres = Models.Genre; // Assign the Genre model to a constant for easy access

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
  Movies.find()
    .then((movies) => res.json(movies))
    .catch((err) => res.status(500).json({ error: 'Error retrieving movies' }));
});

// GET /movies/:title - Returns data about a specific movie by title
app.get('/movies/:title', (req, res) => {
  const { title } = req.params;
  Movies.findOne({ title: { $regex: new RegExp('^' + title + '$', 'i') } })
    .then((movie) => {
      if (movie) {
        res.json(movie);
      } else {
        res.status(404).json({ error: 'Movie not found' });
      }
    })
    .catch((err) => res.status(500).json({ error: 'Error retrieving movie' }));
});

// GET /users - Returns JSON data about all users
app.get('/users', (req, res) => {
  Users.find()
    .then((users) => res.json(users))
    .catch((err) => res.status(500).json({ error: 'Error retrieving users' }));
});

// GET /users/:username - Returns data about a specific user by username
app.get('/users/:username', (req, res) => {
  const { username } = req.params;
  Users.findOne({ Username: username })
    .then((user) => {
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    })
    .catch((err) => res.status(500).json({ error: 'Error retrieving user' }));
});

// DELETE /users/:username - Deletes a user by username
app.delete('/users/:username', (req, res) => {
  const { username } = req.params;
  Users.findOneAndDelete({ Username: username })
    .then((user) => {
      if (user) {
        res.json({ message: `User ${username} deleted successfully` });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    })
    .catch((err) => res.status(500).json({ error: 'Error deleting user' }));
});

// GET /directors - Returns JSON data about all directors
app.get('/directors', (req, res) => {
  Directors.find()
    .then((directors) => res.json(directors))
    .catch((err) =>
      res.status(500).json({ error: 'Error retrieving directors' })
    );
});

// GET /directors/:name - Returns data about a specific director by name
app.get('/directors/:name', (req, res) => {
  const { name } = req.params;
  Directors.findOne({ name: { $regex: new RegExp('^' + name + '$', 'i') } })
    .then((director) => {
      if (director) {
        res.json(director);
      } else {
        res.status(404).json({ error: 'Director not found' });
      }
    })
    .catch((err) =>
      res.status(500).json({ error: 'Error retrieving director' })
    );
});

// GET /genres - Returns JSON data about all genres
app.get('/genres', (req, res) => {
  Genres.find()
    .then((genres) => res.json(genres))
    .catch((err) => res.status(500).json({ error: 'Error retrieving genres' }));
});

// GET /genres/:name - Returns data about a specific genre by name
app.get('/genres/:name', (req, res) => {
  const { name } = req.params;
  Genres.findOne({ name: { $regex: new RegExp('^' + name + '$', 'i') } })
    .then((genre) => {
      if (genre) {
        res.json(genre);
      } else {
        res.status(404).json({ error: 'Genre not found' });
      }
    })
    .catch((err) => res.status(500).json({ error: 'Error retrieving genre' }));
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
