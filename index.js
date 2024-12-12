const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const Models = require('./models.js'); // Import models
const cors = require('cors');
const { check, validationResult } = require('express-validator');
const passport = require('passport');
require('./passport.js'); // Import passport strategies
const jwt = require('jsonwebtoken');

const Movies = Models.Movie; // Movie model
const Users = Models.User; // User model

const app = express();

// Middleware
app.use(morgan('common'));
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(
    'mongodb+srv://benjansen:N75k72DfzUZqZBv@benjansen.pvh5e.mongodb.net/myFlixDB?retryWrites=true&w=majority',
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Welcome message
app.get('/', (req, res) => {
  res.send('Welcome to the Movie API!');
});

// Register a new user
app.post(
  '/users',
  [
    check('username', 'username is required').isLength({ min: 5 }),
    check('password', 'password is required').not().isEmpty(),
    check('email', 'email does not appear to be valid').isEmail(),
    check('birthday', 'birthday is required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { username, password, email, birthday } = req.body;

    const existingUser = await Users.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists!' });
    }

    // Skipping password hashing temporarily
    const newUser = await Users.create({
      username,
      password,
      email,
      birthday,
    });

    if (newUser) {
      return res.json({ message: 'Registration successful', newUser });
    }
  }
);

// Login a user and issue a token
app.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    req.login(user, { session: false }, (err) => {
      if (err) return res.send(err);

      const token = jwt.sign(user.toJSON(), 'your_jwt_secret');
      return res.json({ user, token });
    });
  })(req, res, next);
});

// Get user profile
app.get(
  '/users/:username',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const user = await Users.findOne({ username: req.params.username });
      if (!user) return res.status(404).send('User not found');
      res.status(200).json(user);
    } catch (err) {
      res.status(500).send('Error retrieving user');
    }
  }
);

// Get all movies
app.get(
  '/movies',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const movies = await Movies.find(); // Fetch all movies from the database
      res.status(200).json(movies); // Send movies as JSON
    } catch (err) {
      res.status(500).send('Error retrieving movies');
    }
  }
);

// Get a movie by ID
app.get(
  '/movies/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const movie = await Movies.findById(req.params.id); // Find the movie by ID
      if (!movie) return res.status(404).send('Movie not found');
      res.status(200).json(movie); // Send movie details
    } catch (err) {
      res.status(500).send('Error retrieving movie');
    }
  }
);

// Add a new movie (only for authenticated users)
app.post(
  '/movies',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    const { title, description, genre, director, year } = req.body;
    try {
      const newMovie = new Movies({
        title,
        description,
        genre,
        director,
        year,
      });

      const savedMovie = await newMovie.save(); // Save the new movie to the database
      res.status(201).json(savedMovie); // Return the newly created movie
    } catch (err) {
      res.status(500).send('Error saving movie');
    }
  }
);

// Update a movie by ID (only for authenticated users)
app.put(
  '/movies/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    const { title, description, genre, director, year } = req.body;
    try {
      const updatedMovie = await Movies.findByIdAndUpdate(
        req.params.id,
        { title, description, genre, director, year },
        { new: true } // Return the updated document
      );

      if (!updatedMovie) return res.status(404).send('Movie not found');
      res.status(200).json(updatedMovie); // Return the updated movie details
    } catch (err) {
      res.status(500).send('Error updating movie');
    }
  }
);

// Delete a movie by ID (only for authenticated users)
app.delete(
  '/movies/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const deletedMovie = await Movies.findByIdAndDelete(req.params.id); // Delete the movie
      if (!deletedMovie) return res.status(404).send('Movie not found');
      res.status(200).send('Movie deleted'); // Confirm movie deletion
    } catch (err) {
      res.status(500).send('Error deleting movie');
    }
  }
);

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
