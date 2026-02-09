import routes from './api/v1/routes.ts';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use('/api/v1', routes);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});