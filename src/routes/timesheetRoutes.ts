import { Router } from 'express';
import { getTimesheets, createTimesheet, updateTimesheetStatus } from '../controllers/timesheetController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', getTimesheets);
router.post('/', createTimesheet);
router.patch('/:id/status', authorize(['SUPERVISOR', 'MANAGER', 'OFFICER', 'SYSTEM_ADMIN_ISTRATOR', 'HR_OFFICER']), updateTimesheetStatus);

export default router;
