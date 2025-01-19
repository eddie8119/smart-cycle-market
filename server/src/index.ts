import express from 'express';
import authRouter from 'routes/auth';
import 'src/db';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/auth', authRouter);
