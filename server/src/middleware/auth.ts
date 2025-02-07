import { RequestHandler } from 'express';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { sendErrorRes } from 'src/utils/helper';
import UserModel from 'src/models/user';
import PasswordResetTokenModel from 'src/models/passwordResetToken';

const JWT_SECRET = process.env.JWT_SECRET!;

interface UserPayload {
  id: string;
  email: string;
  name: string;
  verified: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user: UserPayload;
    }
  }
}

export const isAuth: RequestHandler = async (req, res, next) => {
  try {
    const authToken = req.headers.authorization;
    if (!authToken) return sendErrorRes(res, 'unauthorized request!', 403);

    const token = authToken.split('Bearer')[1];

    req.headers.authorization = token;

    const payload = jwt.verify(token, JWT_SECRET) as { id: string };

    const user = await UserModel.findById(payload.id);

    if (!user) return sendErrorRes(res, 'unauthorized request!', 403);

    req.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      verified: user.verified,
    };

    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return sendErrorRes(res, 'session expired!', 401);
    }
    if (error instanceof JsonWebTokenError) {
      return sendErrorRes(res, 'unauthorized access!', 401);
    }
    next(error);
  }
};

export const isValidPassResetToken: RequestHandler = async (req, res, next) => {
  try {
    const { id, token } = req.body;

    const resetPassToken = await PasswordResetTokenModel.findOne({ owner: id });
    if (!resetPassToken) return sendErrorRes(res, 'unauthorized request!', 403);

    const isMatched = await resetPassToken.compareToken(token);
    if (!isMatched) return sendErrorRes(res, 'unauthorized request!', 403);

    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return sendErrorRes(res, 'session expired!', 401);
    }
    if (error instanceof JsonWebTokenError) {
      return sendErrorRes(res, 'unauthorized access!', 401);
    }
    next(error);
  }
};
