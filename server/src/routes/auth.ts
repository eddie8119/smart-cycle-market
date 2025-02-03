import { Router } from 'express';
import {
  createNewUser,
  generateVerificationLink,
  sendProfile,
  signIn,
  verifyEmail,
} from 'src/controllers/auth';
import { isAuth } from 'src/middleware/auth';
import validate from 'src/middleware/validator';
import { newUserSchema, verifyTokenSchema } from 'src/utils/validationSchema';

const authRouter = Router();

authRouter.post('/sign-up', validate(newUserSchema), createNewUser);
authRouter.post('/verify', validate(verifyTokenSchema), verifyEmail);
authRouter.post('/sign-in', signIn);
authRouter.get('/profile', isAuth, sendProfile);
authRouter.get('/verify-token', isAuth, generateVerificationLink);

export default authRouter;
