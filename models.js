const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing

// Define the movie schema
const movieSchema = mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  genre: {
    name: String,
    description: String,
  },
  director: {
    name: String,
    bio: String,
  },
  actors: [String],
  imageURL: String,
  featured: Boolean,
});

// Define the user schema
const userSchema = mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  birthday: Date,
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }], // Referencing the movie model for favorites
});

// Function to hash the password
userSchema.statics.hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

// Method to validate the password during login
userSchema.methods.validatePassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

// Create the Movie and User models
const Movie = mongoose.model('Movie', movieSchema);
const User = mongoose.model('User', userSchema);

// Export the models for use in other files
module.exports.Movie = Movie;
module.exports.User = User;
