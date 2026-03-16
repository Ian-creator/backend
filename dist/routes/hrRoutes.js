"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const hrController_1 = require("../controllers/hrController");
const departmentController_1 = require("../controllers/departmentController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Only HR officers and Admins (Developers) can access these
router.use(authMiddleware_1.authenticate);
router.use((0, authMiddleware_1.authorize)(['HR_OFFICER', 'SYSTEM_ADMINISTRATOR']));
router.post('/employees', hrController_1.createEmployee);
router.patch('/employees/:id/status', hrController_1.updateEmployeeStatus);
router.get('/employees', hrController_1.getEmployees);
router.post('/departments', departmentController_1.createDepartment);
router.get('/departments', departmentController_1.getDepartments);
exports.default = router;
