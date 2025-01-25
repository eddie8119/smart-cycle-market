import express from 'express';
import authRouter from 'routes/auth';
import 'src/db';
import 'express-async-errors';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/auth', authRouter);

app.use(function (err, req, res, next) {
  res.status(500).json({ message: err.message });
} as express.ErrorRequestHandler);

app.listen(8000, () => {
  console.log('The app is running on http://localhost:8000');
});
