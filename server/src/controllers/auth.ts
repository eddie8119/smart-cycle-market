import { RequestHandler } from 'express';
import crypto from 'crypto';
import UserModel from 'src/models/user';
import AuthVerificationTokenModel from 'src/models/authVerificationToken';
import nodemailer from 'nodemailer';
import { sendErrorRes } from 'src/utils/helper';

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

  const transport = nodemailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io',
    port: 2525,
    auth: {
      user: 'a47b4a02e523dd',
      pass: '8919e797c87aaf',
    },
  });

  await transport.sendMail({
    from: 'verification@myapp.com',
    to: user.email,
    html: `<h1>Please click on <a href="${link}">this link</a> to verify your account.</h1>`,
  });
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
