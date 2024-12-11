// Import required modules
const bcrypt = require('bcrypt');
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose'); // MongoDB interactions
const Models = require('./models.js'); // Import Mongoose models
const cors = require('cors'); // Handle cross-origin requests
const { check, validationResult } = require('express-validator');

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

// Import Auth routes
require('./auth.js')(app);
const passport = require('passport');
require('./passport');

// Welcome message
app.get('/', (req, res) => {
  res.send('Welcome to the Movie API!');
});

// Serve documentation.html file from the public folder
app.use('/documentation', express.static('public'));

// POST /users - Register a new user with validation and hashed passwords
app.post(
  '/users',
  [
    check('username', 'username is required').isLength({ min: 5 }),
    check(
      'username',
      'username contains non-alphanumeric characters - not allowed.'
    ).isAlphanumeric(),
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
      return res.status(400).json({ error: 'Uh-ho! User already exists!' });
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

// GET /movies - Returns all movies (Token-based authentication enabled)
app.get(
  '/movies',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    await Movies.find()
      .then((movies) => res.status(200).json(movies))
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  }
);

// GET /movies/:title - Returns a movie by title (No authentication required)
app.get('/movies/:title', async (req, res) => {
  await Movies.findOne({ title: req.params.title })
    .then((movie) => res.json(movie))
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// GET /movies/genre/:genreName - Returns a genre by name (No authentication required)
app.get('/movies/genre/:genreName', async (req, res) => {
  await Movies.findOne({ 'genre.name': req.params.genreName })
    .then((movie) => res.status(200).json(movie.genre))
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// GET /movies/directors/:directorName - Returns a director by name (No authentication required)
app.get('/movies/directors/:directorName', async (req, res) => {
  await Movies.findOne({ 'director.name': req.params.directorName })
    .then((movie) => res.status(200).json(movie.director))
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// GET /users - Returns all users
app.get(
  '/users',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    await Users.find()
      .then((users) => res.status(200).json(users))
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  }
);

// GET /users/:Username - Returns a user by username
app.get(
  '/users/:Username',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    console.log(req.params.Username);
    await Users.findOne({ username: req.params.Username })
      .then((user) => res.json(user))
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  }
);

// PUT /users/:Username - Updates a user's information
app.put(
  '/users/:Username',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    const { username, email, password, birthday } = req.body;

    const hashedPassword = password ? bcrypt.hashSync(password, 10) : undefined;

    const updateData = {
      username,
      email,
      birthday,
      ...(hashedPassword && { password: hashedPassword }),
    };

    await Users.findOneAndUpdate(
      { username: req.params.Username },
      { $set: updateData },
      { new: true }
    )
      .then((updatedUser) => res.json(updatedUser))
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  }
);

// PATCH /users/:Username/movies/:MovieID - Adds a movie to a user's favorites
app.patch(
  '/users/:Username/movies/:MovieID',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    await Users.findOneAndUpdate(
      { username: req.params.Username },
      { $push: { favorites: req.params.MovieID } },
      { new: true }
    )
      .then((updatedUser) => res.json(updatedUser))
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  }
);

// DELETE /users/:Username/movies/:MovieID - Removes a movie from a user's favorites
app.delete(
  '/users/:Username/movies/:MovieID',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    await Users.findOneAndUpdate(
      { username: req.params.Username },
      { $pull: { favorites: req.params.MovieID } },
      { new: true }
    )
      .then((updatedUser) => res.json(updatedUser))
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  }
);

// DELETE /users/:Username - Deletes a user by username
app.delete(
  '/users/:Username',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    await Users.findOneAndDelete({ username: req.params.Username })
      .then((user) => {
        if (!user) res.status(400).send(req.params.Username + ' was not found');
        else res.status(200).send(req.params.Username + ' was deleted.');
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  }
);

// Error-handling middleware for logging errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Set the port to 3000 for local development
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
