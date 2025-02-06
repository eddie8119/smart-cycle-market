import express from 'express';
import authRouter from 'routes/auth';
import 'src/db';
import 'express-async-errors';
import 'dotenv/config';
import path from 'path';
import formidable from 'formidable';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/auth', authRouter);
app.post('/upload-file', async (req, res) => {
  const form = formidable({
    uploadDir: path.join(__dirname, 'public'),
    filename(name, ext, part, form) {
      return Date.now() + '_' + part.originalFilename;
    },
  });

  await form.parse(req);

  res.send('ok');
});

app.use(function (err, req, res, next) {
  res.status(500).json({ message: err.message });
} as express.ErrorRequestHandler);

app.listen(8000, () => {
  console.log('The app is running on http://localhost:8000');
});
