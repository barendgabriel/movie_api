const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const Models = require('./models.js'); // Import your models
const bcrypt = require('bcrypt');

const Users = Models.User; // User model

// Local Strategy for username/password login
passport.use(
  new LocalStrategy((username, password, done) => {
    Users.findOne({ Username: username }, (err, user) => {
      if (err) return done(err);
      if (!user) return done(null, false, { message: 'Incorrect username.' });

      // Compare passwords using bcrypt
      bcrypt.compare(password, user.Password, (err, isMatch) => {
        if (err) return done(err);
        if (!isMatch)
          return done(null, false, { message: 'Incorrect password.' });
        return done(null, user);
      });
    });
  })
);

// JWT Strategy for token validation
const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: 'your_jwt_secret', // Use a secure key in production
};

passport.use(
  new JwtStrategy(opts, (jwt_payload, done) => {
    Users.findById(jwt_payload._id, (err, user) => {
      if (err) return done(err, false);
      if (user) return done(null, user);
      return done(null, false);
    });
  })
);

module.exports = passport;
