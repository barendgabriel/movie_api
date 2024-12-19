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
app.use(
  cors({
    origin: ['http://localhost:1234', 'https://myflixmovieapp.onrender.com'], // Allow specific origins
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow specific HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
    credentials: true, // Allow credentials (cookies, authorization headers)
  })
);
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
    check('username', 'Username is required').isLength({ min: 5 }),
    check('password', 'Password is required').not().isEmpty(),
    check('email', 'Email does not appear to be valid').isEmail(),
    check('birthday', 'Birthday is required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { username, password, email, birthday } = req.body;

    try {
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

      return res.json({ message: 'Registration successful', newUser });
    } catch (error) {
      res.status(500).send('Error registering user');
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

      const token = jwt.sign(user.toJSON(), 'your_jwt_secret', {
        expiresIn: '7d', // Token expiry for better security
      });
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
app.get('/movies', async (req, res) => {
  try {
    const movies = await Movies.find(); // Fetch all movies from the database
    if (!movies || movies.length === 0)
      return res.status(404).send('No movies found');
    res.status(200).json(movies);
  } catch (err) {
    res.status(500).send('Error retrieving movies');
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
