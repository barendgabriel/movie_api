const jwt = require('jsonwebtoken');
const passport = require('passport');
require('./passport'); // Your local passport strategies

// Function to generate JWT tokens
const generateJWTToken = (user) => {
  return jwt.sign(user, 'your_jwt_secret', { subject: user.username }); // No expiration or algorithm, for simplicity
};

module.exports = (app) => {
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

        const token = generateJWTToken(user.toJSON());
        return res.json({ user, token });
      });
    })(req, res, next);
  });
};
