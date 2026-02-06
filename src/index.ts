import routes from './api/v1/routes.js';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const port = process.env.PORT;

app.use('/api/v1', routes);

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});