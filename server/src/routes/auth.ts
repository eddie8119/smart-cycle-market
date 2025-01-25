import { Router } from 'express';
import { createNewUser, verifyEmail } from 'src/controllers/auth';
import validate from 'src/middleware/validator';
import { newUserSchema } from 'src/utils/validationSchema';

const authRouter = Router();

authRouter.post('/sign-up', validate(newUserSchema), createNewUser);
authRouter.post('/verify', verifyEmail);

export default authRouter;
