"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmployees = exports.updateEmployeeStatus = exports.createEmployee = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
const createEmployee = async (req, res) => {
    const { username, password, fullName, jobTitle, nin, role, departmentId, supervisorId, photoUrl } = req.body;
    try {
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                username,
                passwordHash: hashedPassword,
                fullName,
                jobTitle,
                nin,
                role: role,
                departmentId: departmentId || null,
                supervisorId: supervisorId || null,
                photoUrl,
                status: client_1.Status.ACTIVE
            }
        });
        // Log the action
        await prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: 'CREATE_EMPLOYEE',
                targetTable: 'User',
                targetId: newUser.id,
                details: `Created employee ${username}`
            }
        });
        res.status(201).json(newUser);
    }
    catch (error) {
        console.error('Create employee error:', error);
        if (error.code === 'P2002') {
            const target = error.meta?.target || [];
            return res.status(400).json({ error: `An employee with this ${target.join(', ')} already exists.` });
        }
        res.status(500).json({ error: error.message || 'Failed to create employee' });
    }
};
exports.createEmployee = createEmployee;
const updateEmployeeStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const updatedUser = await prisma.user.update({
            where: { id: id },
            data: { status: status }
        });
        await prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: 'UPDATE_STATUS',
                targetTable: 'User',
                targetId: id,
                details: `Updated status of ${updatedUser.username} to ${status}`
            }
        });
        res.json(updatedUser);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update status' });
    }
};
exports.updateEmployeeStatus = updateEmployeeStatus;
const getEmployees = async (req, res) => {
    try {
        const employees = await prisma.user.findMany({
            include: {
                department: true,
                supervisor: {
                    select: { id: true, fullName: true }
                }
            },
            where: {
                NOT: { role: 'SYSTEM_ADMINISTRATOR' } // Hide admin records from HR
            }
        });
        res.json(employees);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
};
exports.getEmployees = getEmployees;
