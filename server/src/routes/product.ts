import { Router } from 'express';

import { isAuth, isValidPassResetToken } from 'src/middleware/auth';
import fileParser from 'src/middleware/fileParser';
import validate from 'src/middleware/validator';
import { newProductSchema } from 'src/utils/validationSchema';

const productRouter = Router();

productRouter.post(
  '/list',
  isAuth,
  fileParser,
  validate(newProductSchema),
  listNewProduct,
);

export default productRouter;
