import { Router } from 'express';
import { signIn, logFieldVisit, returnFromField, getAttendanceHistory, getTeamAttendance } from '../controllers/attendanceController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/sign-in', signIn);
router.post('/field-visit', logFieldVisit);
router.post('/return', returnFromField);
router.get('/history', getAttendanceHistory);
router.get('/team', getTeamAttendance);

export default router;
