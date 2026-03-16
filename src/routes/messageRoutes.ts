import { Router } from 'express';
import * as messageController from '../controllers/messageController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticate, messageController.getMessages);
router.post('/send', authenticate, messageController.sendMessage);
router.get('/:id', authenticate, messageController.getMessageDetails);

export default router;
