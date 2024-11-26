const passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  Models = require('./models.js'),
  passportJWT = require('passport-jwt');

let Users = Models.User,
  JWTStrategy = passportJWT.Strategy,
  ExtractJWT = passportJWT.ExtractJwt;

/**
 * Passport configuration file for authentication strategies.
 * - Defines and configures Local and JWT strategies for handling authentication.
 * - LocalStrategy: Authenticates users by checking username and password.
 * - JWTStrategy: Authenticates users by verifying a JSON Web Token.
 * @module passport
 */
passport.use(
  /**
   * Local Strategy for authenticating users based on username and password.
   *
   * @name LocalStrategy
   * @function
   * @param {Object} options - Configuration options for LocalStrategy.
   * @param {string} options.usernameField - The field in the request containing the username.
   * @param {string} options.passwordField - The field in the request containing the password.
   * @param {function} callback - The callback to be executed after authentication.
   */
  new LocalStrategy(
    {
      usernameField: 'Username',
      passwordField: 'Password',
    },
    async (username, password, callback) => {
      console.log(`${username} ${password}`);
      await Users.findOne({ Username: username })
        .then((user) => {
          if (!user) {
            console.log('incorrect username');
            return callback(null, false, {
              message: 'Incorrect username or password.',
            });
          }
          if (!user.validatePassword(password)) {
            console.log('incorrect password');
            return callback(null, false, { message: 'Incorrect password.' });
          }
          console.log('finished');
          return callback(null, user);
        })
        .catch((error) => {
          if (error) {
            console.log(error);
            return callback(error);
          }
        });
    }
  )
);

passport.use(
  /**
   * JWT Strategy for authenticating users based on JWT.
   *
   * @name JWTStrategy
   * @function
   * @param {Object} options - Configuration options for JWTStrategy.
   * @param {function} jwtFromRequest - Function to extract JWT token from request header.
   * @param {string} secretOrKey - Secret key to verify the JWT.
   * @param {function} callback - The callback to be executed after JWT verification.
   */
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'your_jwt_secret',
    },
    async (jwtPayload, callback) => {
      return await Users.findById(jwtPayload._id)
        .then((user) => {
          return callback(null, user);
        })
        .catch((error) => {
          return callback(error);
        });
    }
  )
);
