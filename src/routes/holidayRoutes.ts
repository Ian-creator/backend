import { Router } from 'express';
import * as holidayController from '../controllers/holidayController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticate, holidayController.getHolidays);
router.post('/', authenticate, authorize(['HR_OFFICER']), holidayController.addHoliday);
router.delete('/:id', authenticate, authorize(['HR_OFFICER']), holidayController.deleteHoliday);
router.post('/auto-update', authenticate, authorize(['HR_OFFICER']), holidayController.autoUpdateHolidays);

export default router;
