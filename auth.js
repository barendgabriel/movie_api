const jwt = require('jsonwebtoken');
const passport = require('passport');

require('./passport'); // Your local passport file

const generateJWTToken = (user) => {
  return jwt.sign(user, 'your_jwt_secret', {
    subject: user.username,
    expiresIn: '7d', // Token expires in 7 days
    algorithm: 'HS256', // Secure hashing algorithm
  });
};

module.exports = (app) => {
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
