import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import * as userService from '../services/user.service.js';

export function setupPassport(passport) {
  // Local strategy: username + password
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'username',
        passwordField: 'password'
      },
      async (username, password, done) => {
        try {
          const user = await userService.findByUsername(username);
          if (!user) {
            return done(null, false, { message: 'Tên đăng nhập không tồn tại' });
          }

          if (!user.is_email_verified) {
            return done(null, false, { message: 'Vui lòng xác thực email trước khi đăng nhập' });
          }

          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return done(null, false, { message: 'Mật khẩu không chính xác' });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Session serialization
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await userService.findById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}
