import { Router } from 'express';
import * as notificationController from '../controllers/notificationController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticate, notificationController.getNotifications);
router.patch('/:id/read', authenticate, notificationController.markAsRead);
router.delete('/clear', authenticate, notificationController.clearNotifications);

export default router;
