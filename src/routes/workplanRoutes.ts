import { Router } from 'express';
import { uploadWorkplan, getWorkplans } from '../controllers/workplanController';
import { authenticate } from '../middleware/authMiddleware';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

router.post('/upload', upload.single('file'), uploadWorkplan);
router.get('/', getWorkplans);

export default router;
