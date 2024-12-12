const passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  Models = require('./models.js'),
  passportJWT = require('passport-jwt');

let Users = Models.User,
  JWTStrategy = passportJWT.Strategy,
  ExtractJWT = passportJWT.ExtractJwt;

// Local Strategy for username and password authentication
passport.use(
  new LocalStrategy(async (username, password, callback) => {
    await Users.findOne({ username: username })
      .then((user) => {
        if (!user) {
          console.log('Incorrect username');
          return callback(null, false, {
            message: 'Incorrect username or password.',
          });
        }
        if (!user.validatePassword(password)) {
          console.log('Incorrect password');
          return callback(null, false, { message: 'Incorrect password.' });
        }
        return callback(null, user);
      })
      .catch((error) => {
        if (error) {
          console.log('Error in LocalStrategy:', error);
          return callback(error);
        }
      });
  })
);

// JWT Strategy for authenticating users based on JWT
passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'your_jwt_secret', // Check the secret here
    },
    async (jwtPayload, callback) => {
      console.log('Received JWT Payload:', jwtPayload); // Log the payload

      // Check if _id exists in the payload
      if (!jwtPayload._id) {
        console.log('No _id found in JWT payload');
        return callback(null, false, { message: 'JWT missing user ID' });
      }

      return await Users.findById(jwtPayload._id)
        .then((user) => {
          if (!user) {
            console.log('User not found in JWT strategy');
            return callback(null, false, { message: 'User not found' });
          }
          console.log('User found:', user); // Log found user
          return callback(null, user);
        })
        .catch((error) => {
          console.log('Error in JWT strategy:', error);
          return callback(error);
        });
    }
  )
);

module.exports = passport;
