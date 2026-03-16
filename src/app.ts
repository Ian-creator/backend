import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/authRoutes';
import hrRoutes from './routes/hrRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import assetRoutes from './routes/assetRoutes';
import workplanRoutes from './routes/workplanRoutes';
import timesheetRoutes from './routes/timesheetRoutes';
import reportRoutes from './routes/reportRoutes';
import notificationRoutes from './routes/notificationRoutes';
import messageRoutes from './routes/messageRoutes';
import leaveRoutes from './routes/leaveRoutes';
import holidayRoutes from './routes/holidayRoutes';
import projectRoutes from './routes/projectRoutes';

const app = express();

// Middleware
app.use(helmet());
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
};
app.use(cors(corsOptions));
app.use(morgan('dev'));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/workplans', workplanRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/projects', projectRoutes);
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Basic Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

export default app;
