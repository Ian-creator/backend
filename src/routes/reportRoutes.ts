import { Router } from 'express';
import { getDashboardStats, getEmployeeReport, getTeamStats, getAuditLogs } from '../controllers/reportController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/dashboard', getDashboardStats);
router.get('/employee/:userId', getEmployeeReport);
router.get('/team-stats', getTeamStats);
router.get('/logs', getAuditLogs);

export default router;
