import { isValidObjectId } from 'mongoose';
import * as yup from 'yup';
import categories from './categories';

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex =
  /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#\$%\^&\*])[a-zA-Z\d!@#\$%\^&\*]+$/;

yup.addMethod(yup.string, 'email', function validateEmail(message) {
  return this.matches(emailRegex, {
    message,
    name: 'email',
    excludeEmptyString: true,
  });
});

export const newUserSchema = yup.object({
  name: yup.string().required('Name is missing'),
  email: yup.string().email('Invalid email!').required('Email is missing'),
  password: yup
    .string()
    .required('Password is missing')
    .min(8, 'Password should be at least 8 chars long!')
    .matches(passwordRegex, 'Password is too simple.'),
});

export const verifyTokenSchema = yup.object({
  id: yup.string().test({
    name: 'valid-id',
    message: 'Invalid user id',
    test: (value) => {
      return isValidObjectId(value);
    },
  }),
  token: yup.string().required('Token is missing'),
});

export const newProductSchema = yup.object({
  name: yup.string().required('Name is missing!'),
  description: yup.string().required('Description is missing!'),
  category: yup
    .string()
    .oneOf(categories, 'Invalid category!')
    .required('Category is missing!'),
  price: yup
    // 用 .string() 開始，但 transform 函數允許我們在驗證過程中將值轉換為所需的數字格式
    .string()
    .transform((value) => {
      //+value 是將 value 轉換成數字的運算
      if (isNaN(+value)) return '';

      return +value;
    })
    .required('Price is missing!'),
  purchasingDate: yup
    .string()
    .transform((value) => {
      try {
        return parseISO(value);
      } catch (error) {
        return '';
      }
    })
    .required('Purchasing date is missing!'),
});
