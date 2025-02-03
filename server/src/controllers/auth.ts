import { RequestHandler } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import UserModel from 'src/models/user';
import AuthVerificationTokenModel from 'src/models/authVerificationToken';
import { sendErrorRes } from 'src/utils/helper';
import { mail } from 'src/utils/mail';
import PasswordResetTokenModel from 'src/models/passwordResetToken';

const JWT_SECRET = process.env.JWT_SECRET;
const PASSWORD_RESET_LINK = process.env.PASSWORD_RESET_LINK;

export const createNewUser: RequestHandler = async (req, res) => {
  const { email, password, name } = req.body;

  const existingUser = await UserModel.findOne({ email });

  if (existingUser)
    return res
      .status(401)
      .json({ message: 'Unauthorized request, email is already in use!' });

  const user = await UserModel.create({ name, email, password });

  const token = crypto.randomBytes(36).toString('hex');
  await AuthVerificationTokenModel.create({ owner: user._id, token });

  const link = `http://localhost:8000/verify?id=${user._id}&token=${token}`;

  await mail.sendVerification(user.email, link);
};

export const verifyEmail: RequestHandler = async (req, res) => {
  const { id, token } = req.body;

  const authToken = await AuthVerificationTokenModel.findOne({ owner: id });
  if (!authToken) return sendErrorRes(res, 'unauthorized request!', 403);

  const isMatched = await authToken.compareToken(token);
  if (!isMatched)
    return sendErrorRes(res, 'unauthorized request, invalid token!', 403);

  await UserModel.findByIdAndUpdate(id, { verified: true });

  await AuthVerificationTokenModel.findByIdAndDelete(authToken._id);

  res.json({ message: 'Thanks for joining us, your email is verified.' });
};

export const generateVerificationLink: RequestHandler = async (req, res) => {
  const { id } = req.user;
  const token = crypto.randomBytes(36).toString('hex');
  const link = `http://localhost:8000/verify?id=${id}&token=${token}`;

  await AuthVerificationTokenModel.findOneAndDelete({ owner: id });
  await AuthVerificationTokenModel.create({ owner: id, token });

  await mail.sendVerification(req.user.email, link);
  res.json({ message: 'please check your email.' });
};

export const grantAccessToken: RequestHandler = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) return sendErrorRes(res, 'Unauthorized request!', 403);

  const payload = jwt.verify(refreshToken, JWT_SECRET) as { id: string };

  if (!payload.id) return sendErrorRes(res, 'Unauthorized request!', 401);

  const user = await UserModel.findOne({
    _id: payload.id,
    tokens: refreshToken,
  });

  if (!user) {
    // user is compromised, remove all the previous tokens
    await UserModel.findByIdAndUpdate(payload.id, { tokens: [] });
    return sendErrorRes(res, 'Unauthorized request!', 401);
  }

  const newAccessToken = jwt.sign({ id: user._id }, JWT_SECRET, {
    expiresIn: '15m',
  });
  const newRefreshToken = jwt.sign({ id: user._id }, JWT_SECRET);

  user.tokens = user.tokens.filter((t) => t !== refreshToken);
  user.tokens.push(newRefreshToken);
  await user.save();

  res.json({
    profile: {
      id: user._id,
      email: user.email,
      name: user.name,
      verified: user.verified,
      // avatar: user.avatar?.url,
    },
    tokens: { refresh: newRefreshToken, access: newAccessToken },
  });
};

export const signIn: RequestHandler = async (req, res) => {
  const { email, password } = req.body;

  const user = await UserModel.findOne({ email });
  if (!user) return sendErrorRes(res, 'Email/Password mismatch!', 403);

  const isMatched = await user.comparePassword(password);
  if (!isMatched) return sendErrorRes(res, 'Email/Password mismatch!', 403);

  const payload = { id: user._id };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '15m',
  });
  const refreshToken = jwt.sign(payload, JWT_SECRET);

  if (!user.tokens) user.tokens = [refreshToken];
  else user.tokens.push(refreshToken);

  await user.save();

  res.json({
    profile: {
      id: user._id,
      email: user.email,
      name: user.name,
      verified: user.verified,
      // avatar: user.avatar?.url,
    },
    tokens: { refresh: refreshToken, access: accessToken },
  });
};

export const signOut: RequestHandler = async (req, res) => {
  const { refreshToken } = req.body;
  const user = await UserModel.findOne({
    _id: req.user.id,
    tokens: refreshToken,
  });
  if (!user) return sendErrorRes(res, 'Unauthorized request!', 403);

  const newTokens = user.tokens.filter((t) => t !== refreshToken);
  user.tokens = newTokens;
  await user.save();

  res.send();
};

export const generateForgetPassLink: RequestHandler = async (req, res) => {
  const { email } = req.body;
  const user = await UserModel.findOne({ email });

  if (!user) return sendErrorRes(res, 'Account not found!', 404);

  await PasswordResetTokenModel.findOneAndDelete({ owner: user._id });

  const token = crypto.randomBytes(36).toString('hex');
  await PasswordResetTokenModel.create({ owner: user._id, token });

  const passResetLink = `${PASSWORD_RESET_LINK}?id=${user._id}&token=${token}`;
  await mail.sendPasswordResetLink(user.email, passResetLink);

  res.json({ message: 'Please check your email.' });
};

export const grantValid: RequestHandler = async (req, res) => {
  res.json({ valid: true });
};

export const sendProfile: RequestHandler = async (req, res) => {
  res.json({
    profile: req.user,
  });
};
