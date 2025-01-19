import { RequestHandler } from 'express';
import crypto from 'crypto';
import UserModel from 'src/models/user';
import AuthVerificationTokenModel from 'src/models/authVerificationToken';
import nodemailer from 'nodemailer';

export const createNewUser: RequestHandler = async (req, res) => {
  const { email, password, name } = req.body;

  if (!name) return res.status(422).json({ message: 'Name is missing!' });
  if (!email) return res.status(422).json({ message: 'Email is missing!' });
  if (!password)
    return res.status(422).json({ message: 'Password is missing!' });

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
