import { Router } from 'express';
import { getProjects, createProject, assignStaff, removeStaff } from '../controllers/projectController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', getProjects);
router.post('/', authorize(['SYSTEM_ADMINISTRATOR', 'HR_OFFICER']), createProject);
router.post('/assign', authorize(['SYSTEM_ADMINISTRATOR', 'HR_OFFICER', 'SUPERVISOR', 'MANAGER', 'OFFICER']), assignStaff);
router.delete('/assign/:id', authorize(['SYSTEM_ADMINISTRATOR', 'HR_OFFICER']), removeStaff);

export default router;
