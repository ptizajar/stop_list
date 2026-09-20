// server/src/app.ts
import express from 'express';
import stopListRoutes from './routes/stopList.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(express.json());
app.use('/api', stopListRoutes);
app.use(errorHandler);

export default app;