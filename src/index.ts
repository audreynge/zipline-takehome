import routes from './api/v1/routes/index.ts';
import express from 'express';
import dotenv from 'dotenv';
import { initDb } from './database/connection.ts';
import { errorMiddleware } from './middleware/error.middleware.ts';

dotenv.config();
const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use('/api/v1', routes);
app.use(errorMiddleware);

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database schema', error);
    process.exit(1);
  });