import { Router } from 'express';
import { createEmployee, updateEmployeeStatus, getEmployees } from '../controllers/hrController';
import { createDepartment, getDepartments } from '../controllers/departmentController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

// Only HR officers and Admins (Developers) can access these
router.use(authenticate);
router.use(authorize(['HR_OFFICER', 'SYSTEM_ADMINISTRATOR']));

router.post('/employees', createEmployee);
router.patch('/employees/:id/status', updateEmployeeStatus);
router.get('/employees', getEmployees);

router.post('/departments', createDepartment);
router.get('/departments', getDepartments);

export default router;
