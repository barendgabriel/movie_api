const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose'); // MongoDB interactions
const Models = require('./models.js'); // Import Mongoose models
const cors = require('cors'); // Handle cross-origin requests
const { check, validationResult } = require('express-validator');
const passport = require('passport');
require('./passport'); // Import passport strategies

const Movies = Models.Movie; // Movie model
const Users = Models.User; // User model

const app = express();

// Middleware for logging requests
app.use(morgan('common'));

// Enable all CORS requests
app.use(cors());

// Use JSON parsing for POST/PUT requests
app.use(express.json());

require('./auth')(app);

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

    const hashedPassword = Users.hashPassword(password);
    const newUser = await Users.create({
      username,
      password: hashedPassword,
      email,
      birthday,
    });

    if (newUser) {
      return res.json({ message: 'Registration successful', newUser });
    }
  }
);

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
/**
 * Update user info using the PUT method
 * @function
 * @name editUserProfile
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {string} - the user's name (req.params.Username)
 * @returns {object} - returns a promise containing an object of the single user
 */
app.put(
  '/users/:username',
  passport.authenticate('jwt', { session: false }),
  [
    check('username', 'username is required').isLength({ min: 5 }),
    check(
      'username',
      'username contains non alphanumeric characters - not allowed'
    ).isAlphanumeric(),
    check('password', 'password is required').not().isEmpty(),
    check('email', 'email does not appear to be valid').isEmail(),
  ],
  async (req, res) => {
    //check validation object for errors
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    let hashedPassword = Users.hashPassword(req.body.password);

    await Users.findOneAndUpdate(
      { username: req.params.username },
      {
        $set: {
          username: req.body.username,
          password: hashedPassword,
          email: req.body.email,
          birthday: req.body.birthday,
        },
      },
      { new: true }
    ) // This line makes sure that the updated document is returned
      .then((updatedUser) => {
        res.json(updatedUser);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
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

// Get all movies
app.get(
  '/movies',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const movies = await Movies.find(); // Fetch all movies from the database
      if (!movies || movies.length === 0)
        return res.status(404).send('No movies found');
      res.status(200).json(movies);
    } catch (err) {
      res.status(500).send('Error retrieving movies');
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
      res.status(200).send(user);
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
      res.status(200).send(user);
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
