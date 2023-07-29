const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { celebrate, Joi, errors } = require('celebrate');
const cors = require('cors');
const handleError = require('./middlewares/errors');
const NotFoundError = require('./errors/NotFoundError');
const { requestLogger, errorLogger } = require('./middlewares/logger');
const { limiter } = require('./utils/limiter');

const app = express();
mongoose.connect('mongodb://localhost:27017/mestodb', { family: 4 });
const { createUser, login } = require('./controllers/users');
const auth = require('./middlewares/auth');
const usersRouter = require('./routes/users');
const cardsRouter = require('./routes/cards');
const { URL } = require('./utils/constants');

app.use(express.json());
app.use(helmet());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE'],
  credentials: true,
  maxAge: 30,
}));

app.use(limiter);
app.use(requestLogger);

app.post('/signup', celebrate({
  body: Joi.object().keys({
    name: Joi.string().min(2).max(30),
    about: Joi.string().min(2).max(30),
    avatar: Joi.string().regex(URL),
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8),
  }),
}), createUser);

app.post('/signin', celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8),
  }),
}), login);
app.use(auth);
app.use('/users', usersRouter);
app.use('/cards', cardsRouter);
app.use('*', (req, res, next) => {
  next(new NotFoundError('Страница не найдена'));
});

app.use(errorLogger);
app.use(errors());
app.use(handleError);

app.listen(3000, () => {
  console.log('Сервер запущен!');
});