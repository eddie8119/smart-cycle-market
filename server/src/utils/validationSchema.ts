import * as yup from 'yup';

export const newUserSchema = yup.object({
  name: yup.string().required('Name is missing'),
  email: yup.string().email('Invalid email!').required('Email is missing'),
  password: yup
    .string()
    .required('Password is missing')
    .min(8, 'Password should be at least 8 chars long!'),
});
