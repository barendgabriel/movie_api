// Import required modules
const bcrypt = require('bcrypt');
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose'); // Import Mongoose for MongoDB interactions
const Models = require('./models.js'); // Import Mongoose models
const cors = require('cors'); // Import CORS to handle cross-origin
const { check, validationResult } = require('express-validator');

const Movies = Models.Movie; // Assign the Movie model to a constant for easy access
const Users = Models.User; // Assign the User model to a constant for easy access

const app = express();

// Middleware for logging requests
app.use(morgan('common'));

// CORS options setup (adjust to your needs)
const corsOptions = {
  origin: ['http://localhost:4200'], // Replace with your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions)); // Apply CORS with the specified options

// Use JSON parsing for POST/PUT requests
app.use(express.json());

// Correct MongoDB Local connection string (using port 27017, not 3000)
// mongoose
//   .connect('mongodb://localhost:27017/myFlixDB', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log('Connected to MongoDB'))
//   .catch((err) => console.error('MongoDB connection error:', err));

// Connecting to Mongo ATlas
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

// Import and use the auth routes for login
let auth = require('./auth')(app); // Use Auth to handle login and JWT
const passport = require('passport');
require('./passport');

// Root GET route with a welcome message
app.get('/', (req, res) => {
  res.send('Welcome to the Movie API!!!');
});

// POST /users - Allows a new user to register with password hashing and validation
app.post(
  '/users',
  // Validation logic for user registration
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

    console.log(Username, Password);

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
