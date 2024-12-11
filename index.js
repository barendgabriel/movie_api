const bcrypt = require('bcrypt');
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

// GET /movies - Returns all movies (Token-based authentication enabled)
app.get(
  '/movies',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    await Movies.find()
      .then((movies) => res.status(200).json(movies))
      .catch((err) => res.status(500).send('Error: ' + err));
  }
);

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
