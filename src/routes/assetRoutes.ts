import { Router } from 'express';
import { createAsset, getAssets, updateAsset } from '../controllers/assetController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

// List assets is available to most, but creation/update is restricted
router.get('/', getAssets);

router.use(authorize(['HR_OFFICER', 'SYSTEM_ADMINISTRATOR', 'EXECUTIVE']));
router.post('/', createAsset);
router.patch('/:id', updateAsset);

export default router;
