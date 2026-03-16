import { Router } from 'express';
import * as leaveController from '../controllers/leaveController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/my', authenticate, leaveController.getMyLeaveRequests);
router.post('/apply', authenticate, leaveController.createLeaveRequest);
router.get('/management', authenticate, leaveController.getLeaveRequestsForManagement);
router.patch('/:id/status', authenticate, leaveController.updateLeaveStatus);
router.delete('/:id', authenticate, leaveController.deleteLeaveRequest);

export default router;
