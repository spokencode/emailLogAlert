'use strict';

const express = require('express');
const morgan = require('morgan');
// this will load our .env file if we're
// running locally. On Gomix, .env files
// are automatically loaded.
require('dotenv').config();

const {logger} = require('./utilities/logger');
const {sendEmail} = require('./emailer');
// these are custom errors we've created
const {FooError, BarError, BizzError} = require('./errors');

const {ALERT_FROM_EMAIL, ALERT_FROM_NAME, ALERT_to_EMAIL} = process.env;

const app = express();

// this route handler randomly throws one of `FooError`,
// `BarError`, or `BizzError`
const russianRoulette = (req, res) => {
  const errors = [FooError, BarError, BizzError];
  throw new errors[
    Math.floor(Math.random() * errors.length)]('It blew up!');
};


app.use(morgan('common', {stream: logger.stream}));

// for any GET request, we'll run our `russianRoulette` function
app.get('*', russianRoulette);

// YOUR MIDDLEWARE FUNCTION should be activated here using
// `app.use()`. It needs to come BEFORE the `app.use` call
// below, which sends a 500 and error message to the client

const sendErrMail = (err, req, res, next) => {
  if (err instanceof FooError || err instanceof BarError) {
    //console.log(err);
    
    /*
    const emailData = {
      from: ALERT_FROM_EMAIL,
      to: ALERT_TO_EMAIL,
      subject: 'Service Alert: ${err.name}',
      text: 'ALERT: a ${err.name} occurred',
      html: '<p>${err.message}</p><p>${err.stack}</p>'
    };
    */
    
    
    const emailData = {
      from: ALERT_FROM_EMAIL,
      to: ALERT_TO_EMAIL,
      subject: `SERVICE ALERT: ${err.name}`,
      text: `Something went wrong. Here's what we know:\n\n${err.stack}`
    };
    
  
    sendEmail(emailData);  
  }
  next();
}

app.use(sendErrMail);

app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).json({error: 'Something went wrong'}).end();
});

const port = process.env.PORT || 8080;

const listener = app.listen(port, function () {
  logger.info(`Your app is listening on port ${port}`);
});
