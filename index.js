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
    'mongodb+srv://benjansen:5j6lX9Y1MdfyYExO@benjansen.pvh5e.mongodb.net/myFlixDB?retryWrites=true&w=majority',
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

// Serve documentation.html file from the public folder
app.use('/documentation', express.static('public'));

// POST /users - Register a new user with validation and hashed passwords
app.post(
  '/users',
  [
    check('Username', 'Username is required').isLength({ min: 5 }),
    check(
      'Username',
      'Username contains non-alphanumeric characters - not allowed.'
    ).isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail(),
    check('Birthday', 'Birthday is required').not().isEmpty(),
  ],
  (req, res) => {
    // Validation result
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { Username, Password, Email, Birthday } = req.body;

    // Hash the password before saving the user
    bcrypt.hash(Password, 10, (err, hashedPassword) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error hashing password' });
      }

      // Create new user with the hashed password
      Users.create({
        Username: Username,
        Password: hashedPassword,
        Email: Email,
        Birthday: Birthday,
      })
        .then((user) => res.json({ message: 'Registration successful', user }))
        .catch((err) => {
          console.error(err);
          res.status(500).json({ error: 'Error registering user' });
        });
    });
  }
);

// GET /movies - Returns all movies
app.get('/movies', async (req, res) => {
  await Movies.find()
    .then((movies) => res.status(200).json(movies))
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// GET /movies/:title - Returns a movie by title
app.get('/movies/:title', async (req, res) => {
  await Movies.findOne({ Title: req.params.title })
    .then((movie) => res.json(movie))
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// GET /movies/genre/:genreName - Returns a genre by name
app.get('/movies/genre/:genreName', async (req, res) => {
  await Movies.findOne({ 'Genre.Name': req.params.genreName })
    .then((movie) => res.status(200).json(movie.Genre))
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// GET /movies/directors/:directorName - Returns a director by name
app.get('/movies/directors/:directorName', async (req, res) => {
  await Movies.findOne({ 'Director.Name': req.params.directorName })
    .then((movie) => res.status(200).json(movie.Director))
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// GET /users - Returns all users
app.get('/users', async (req, res) => {
  await Users.find()
    .then((users) => res.status(200).json(users))
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// GET /users/:Username - Returns a user by username
app.get('/users/:Username', async (req, res) => {
  await Users.findOne({ Username: req.params.Username })
    .then((user) => res.json(user))
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// PUT /users/:Username - Updates a user's information
app.put('/users/:Username', async (req, res) => {
  const { Password } = req.body;

  // Hash the password before updating the user
  const hashedPassword = Password ? bcrypt.hashSync(Password, 10) : undefined;

  const updateData = {
    Username: req.body.Username,
    Email: req.body.Email,
    Birthday: req.body.Birthday,
    ...(hashedPassword && { Password: hashedPassword }), // Add hashed password only if provided
  };

  await Users.findOneAndUpdate(
    { Username: req.params.Username },
    { $set: updateData },
    { new: true }
  )
    .then((updatedUser) => res.json(updatedUser))
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// PATCH /users/:Username/movies/:MovieID - Adds a movie to a user's favorites
app.patch('/users/:Username/movies/:MovieID', async (req, res) => {
  await Users.findOneAndUpdate(
    { Username: req.params.Username },
    { $push: { FavoriteMovies: req.params.MovieID } },
    { new: true }
  )
    .then((updatedUser) => res.json(updatedUser))
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// DELETE /users/:Username/movies/:MovieID - Removes a movie from a user's favorites
app.delete('/users/:Username/movies/:MovieID', async (req, res) => {
  await Users.findOneAndUpdate(
    { Username: req.params.Username },
    { $pull: { FavoriteMovies: req.params.MovieID } },
    { new: true }
  )
    .then((updatedUser) => res.json(updatedUser))
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// DELETE /users/:Username - Deletes a user by username
app.delete('/users/:Username', async (req, res) => {
  await Users.findOneAndDelete({ Username: req.params.Username })
    .then((user) => {
      if (!user) res.status(400).send(req.params.Username + ' was not found');
      else res.status(200).send(req.params.Username + ' was deleted.');
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

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
