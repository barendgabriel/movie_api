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

// Connect to MongoDB database (update to 'myFlixDB')
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
  Movies.findOne({ Title: title }) // Match case with the schema
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

// GET /genres/:name - Returns data about a genre by name
app.get('/genres/:name', (req, res) => {
  const { name } = req.params;
  Movies.find({ 'Genre.Name': name }) // Find movies by genre name
    .then((movies) => {
      if (movies.length > 0) {
        const genre = movies[0].Genre; // Use the first movie's genre
        res.json({ genreName: name, description: genre.Description });
      } else {
        res.status(404).json({ error: 'Genre not found' });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Error retrieving genre' });
    });
});

// GET /directors/:name - Returns data about a director by name
app.get('/directors/:name', (req, res) => {
  const { name } = req.params;
  Movies.find({ 'Director.Name': name }) // Find movies by director's name
    .then((movies) => {
      if (movies.length > 0) {
        const director = movies[0].Director; // Use the first movie's director details
        res.json({
          name: director.Name,
          bio: director.Bio,
          birthYear: director.birthYear,
          deathYear: director.deathYear,
        });
      } else {
        res.status(404).json({ error: 'Director not found' });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Error retrieving director' });
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

// PUT /users/:username - Updates user information (username, password, email, birthday)
app.put('/users/:username', (req, res) => {
  const { username } = req.params;
  const { password, email, birthday } = req.body;

  Users.findOneAndUpdate(
    { Username: username },
    { $set: { Password: password, Email: email, Birthday: birthday } },
    { new: true } // Return the updated user
  )
    .then((user) => {
      if (user) {
        res.json({ message: 'User updated successfully', user });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Error updating user' });
    });
});

// PUT /users/:username/favorites - Adds/removes movie from user's favorites
app.put('/users/:username/favorites', (req, res) => {
  const { username } = req.params;
  const { movieId, action } = req.body; // action should be 'add' or 'remove'

  Users.findOne({ Username: username })
    .then((user) => {
      if (user) {
        if (action === 'add') {
          user.FavoriteMovies.push(movieId); // Add movieId to favorites
        } else if (action === 'remove') {
          user.FavoriteMovies.pull(movieId); // Remove movieId from favorites
        } else {
          return res.status(400).json({ error: 'Invalid action' });
        }

        user
          .save() // Save the updated user
          .then(() => res.json({ message: 'Favorites updated', user }))
          .catch((err) => {
            console.error(err);
            res.status(500).json({ error: 'Error updating favorites' });
          });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Error retrieving user' });
    });
});

// DELETE /users/:username - Deregisters a user (deletes user from database)
app.delete('/users/:username', (req, res) => {
  const { username } = req.params;

  Users.findOneAndDelete({ Username: username }) // Find and delete user
    .then((user) => {
      if (user) {
        res.json({ message: 'User deregistered successfully', user });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Error deregistering user' });
    });
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
