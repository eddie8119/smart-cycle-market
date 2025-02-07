import { Router } from 'express';
import {
  createNewUser,
  generateForgetPassLink,
  generateVerificationLink,
  grantAccessToken,
  grantValid,
  sendProfile,
  signIn,
  signOut,
  updateAvatar,
  verifyEmail,
} from 'src/controllers/auth';
import { isAuth, isValidPassResetToken } from 'src/middleware/auth';
import fileParser from 'src/middleware/fileParser';
import validate from 'src/middleware/validator';
import { newUserSchema, verifyTokenSchema } from 'src/utils/validationSchema';

const authRouter = Router();

authRouter.post('/sign-up', validate(newUserSchema), createNewUser);
authRouter.post('/verify', validate(verifyTokenSchema), verifyEmail);
authRouter.post('/refresh-token', grantAccessToken);
authRouter.post('/sign-in', signIn);
authRouter.post('/forget-pass', generateForgetPassLink);
authRouter.post(
  '/verify-pass-reset-token',
  validate(verifyTokenSchema),
  isValidPassResetToken,
  grantValid,
);

authRouter.get('/profile', isAuth, sendProfile);
authRouter.get('/sign-out', isAuth, signOut);
authRouter.get('/verify-token', isAuth, generateVerificationLink);

// authRouter.patch("/update-profile", isAuth, updateProfile);
authRouter.patch('/update-avatar', isAuth, fileParser, updateAvatar);

export default authRouter;
