const bcrypt = require('bcrypt');
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose'); // MongoDB interactions
const Models = require('./models.js'); // Import Mongoose models
const cors = require('cors'); // Handle cross-origin requests
const { check, validationResult } = require('express-validator');
const passport = require('passport');
require('./passport'); // Import passport strategies
const jwt = require('jsonwebtoken');

const Movies = Models.Movie; // Movie model
const Users = Models.User; // User model

const app = express();

// Middleware for logging requests
app.use(morgan('common'));

// Enable all CORS requests
app.use(cors());

// Use JSON parsing for POST/PUT requests
app.use(express.json());

// Connect to MongoDB Atlas
mongoose
  .connect(
    'mongodb+srv://benjansen:N75k72DfzUZqZBv@benjansen.pvh5e.mongodb.net/myFlixDB?retryWrites=true&w=majority',
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Welcome message
app.get('/', (req, res) => {
  res.send('Welcome to the Movie API!');
});

// POST /users - Register a new user with validation and hashed passwords
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

    bcrypt.hash(password, 10, async (err, hashedPassword) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error hashing password' });
      }

      const newUser = await Users.create({
        username,
        password: hashedPassword,
        email,
        birthday,
      });

      if (newUser) {
        return res.json({ message: 'Registration successful', newUser });
      }
    });
  }
);

// POST /login - Login a user and issue a token
app.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(400).json({
        message: 'Something went wrong.',
        user: user,
      });
    }

    req.login(user, { session: false }, (err) => {
      if (err) return res.send(err);

      const token = jwt.sign(user.toJSON(), 'your_jwt_secret');
      return res.json({ user, token });
    });
  })(req, res, next);
});

// GET /users/:username - Get a user's profile
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

// PUT /users/:username - Update user profile
app.put(
  '/users/:username',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const user = await Users.findOne({ username: req.params.username });
      if (!user) return res.status(404).send('User not found');

      const { email, birthday } = req.body;
      if (email) user.email = email;
      if (birthday) user.birthday = birthday;

      await user.save();
      res.status(200).json(user);
    } catch (err) {
      res.status(500).send('Error updating user profile');
    }
  }
);

// DELETE /users/:username - Delete user profile
app.delete(
  '/users/:username',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const user = await Users.findOne({ username: req.params.username });
      if (!user) return res.status(404).send('User not found');

      await user.remove();
      res.status(200).send('User deleted');
    } catch (err) {
      res.status(500).send('Error deleting user profile');
    }
  }
);

// GET /movies/:movieId - Get a single movie
app.get(
  '/movies/:movieId',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const movie = await Movies.findById(req.params.movieId);
      if (!movie) return res.status(404).send('Movie not found');
      res.status(200).json(movie);
    } catch (err) {
      res.status(500).send('Error retrieving movie');
    }
  }
);

// POST /users/:username/favorites/:movieId - Add a movie to favorites
app.post(
  '/users/:username/favorites/:movieId',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const user = await Users.findOne({ username: req.params.username });
      if (!user) return res.status(404).send('User not found');

      const movie = await Movies.findById(req.params.movieId);
      if (!movie) return res.status(404).send('Movie not found');

      // Add movie to favorites if not already added
      if (user.favorites.includes(movie._id)) {
        return res.status(400).send('Movie already in favorites');
      }

      user.favorites.push(movie._id);
      await user.save();
      res.status(200).send('Movie added to favorites');
    } catch (err) {
      res.status(500).send('Error adding movie to favorites');
    }
  }
);

// DELETE /users/:username/favorites/:movieId - Remove movie from favorites
app.delete(
  '/users/:username/favorites/:movieId',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const user = await Users.findOne({ username: req.params.username });
      if (!user) return res.status(404).send('User not found');

      const movie = await Movies.findById(req.params.movieId);
      if (!movie) return res.status(404).send('Movie not found');

      const movieIndex = user.favorites.indexOf(movie._id);
      if (movieIndex === -1) {
        return res.status(400).send('Movie not found in favorites');
      }

      user.favorites.splice(movieIndex, 1);
      await user.save();
      res.status(200).send('Movie removed from favorites');
    } catch (err) {
      res.status(500).send('Error removing movie from favorites');
    }
  }
);

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
