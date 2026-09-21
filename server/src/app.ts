import express from 'express';
import path from 'path';
import stopListRoutes from './routes/stopList.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(express.json());

app.use('/api', stopListRoutes);

app.use(express.static(path.resolve(__dirname, '../../client/dist')));

app.use(errorHandler);

export default app;