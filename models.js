const mongoose = require('mongoose'); // Import mongoose
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing

// Define the movie schema
let movieSchema = mongoose.Schema({
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
let userSchema = mongoose.Schema({
  Username: { type: String, required: true },
  Password: { type: String, required: true },
  Email: { type: String, required: true },
  Birthday: Date,
  FavoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
});

// Add a pre-save hook to hash the password before saving
userSchema.pre('save', function (next) {
  const user = this;

  if (!user.isModified('Password')) return next(); // Only hash the password if it's modified or new

  // Hash the password
  bcrypt.hash(user.Password, 10, (err, hashedPassword) => {
    if (err) return next(err);
    user.Password = hashedPassword;
    next();
  });
});

// Function to hash the password
userSchema.statics.hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

// Method to validate the password during login
userSchema.methods.validatePassword = function (password) {
  console.log(password, this.Password);
  return bcrypt.compareSync(password, this.Password);
};

// Create the Movie and User models
let Movie = mongoose.model('Movie', movieSchema);
let User = mongoose.model('User', userSchema);

// Export the models for use in other files
module.exports.Movie = Movie;
module.exports.User = User;
