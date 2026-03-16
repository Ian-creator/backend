"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDepartments = exports.createDepartment = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createDepartment = async (req, res) => {
    const { name } = req.body;
    try {
        const newDept = await prisma.department.create({
            data: { name }
        });
        await prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: 'CREATE_DEPARTMENT',
                targetTable: 'Department',
                targetId: newDept.id,
                details: `Created department ${name}`
            }
        });
        res.status(201).json(newDept);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create department' });
    }
};
exports.createDepartment = createDepartment;
const getDepartments = async (req, res) => {
    try {
        const departments = await prisma.department.findMany({
            include: {
                _count: {
                    select: { users: true }
                }
            }
        });
        res.json(departments);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
};
exports.getDepartments = getDepartments;
