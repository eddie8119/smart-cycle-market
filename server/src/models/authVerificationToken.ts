import { Schema, model } from 'mongoose';

const schema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    expires: 86400,
    default: Date.now(),
  },
});

const AuthVerificationTokenModel = model('AuthVerificationToken', schema);
export default AuthVerificationTokenModel;
