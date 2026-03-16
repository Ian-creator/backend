"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeStaff = exports.assignStaff = exports.createProject = exports.getProjects = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getProjects = async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            include: {
                department: { select: { name: true } },
                assignments: {
                    include: {
                        user: {
                            select: { fullName: true, username: true, role: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(projects);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
};
exports.getProjects = getProjects;
const createProject = async (req, res) => {
    const { name, description, startDate, endDate, status, departmentId } = req.body;
    const adminId = req.user.id;
    try {
        const project = await prisma.project.create({
            data: {
                name,
                description,
                departmentId,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                status: status || 'PLANNING'
            }
        });
        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: adminId,
                action: 'CREATE_PROJECT',
                targetTable: 'Project',
                targetId: project.id,
                details: `Created project: ${name}`
            }
        });
        res.status(201).json(project);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create project' });
    }
};
exports.createProject = createProject;
const assignStaff = async (req, res) => {
    const { projectId, userId, role } = req.body;
    const adminId = req.user.id;
    try {
        const assignment = await prisma.projectAssignment.upsert({
            where: {
                projectId_userId: { projectId, userId }
            },
            update: { role },
            create: { projectId, userId, role }
        });
        // Notify user
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        await prisma.notification.create({
            data: {
                userId,
                title: 'New Project Assignment',
                content: `You have been assigned to the project: ${project?.name} as ${role || 'Member'}.`,
                type: 'info'
            }
        });
        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: adminId,
                action: 'ASSIGN_PROJECT_STAFF',
                targetTable: 'ProjectAssignment',
                targetId: assignment.id,
                details: `Assigned user ${userId} to project ${projectId}`
            }
        });
        res.json(assignment);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to assign staff' });
    }
};
exports.assignStaff = assignStaff;
const removeStaff = async (req, res) => {
    const { id } = req.params;
    const adminId = req.user.id;
    try {
        await prisma.projectAssignment.delete({
            where: { id: id }
        });
        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: adminId,
                action: 'REMOVE_PROJECT_STAFF',
                targetTable: 'ProjectAssignment',
                targetId: id,
                details: `Removed assignment ${id}`
            }
        });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to remove staff from project' });
    }
};
exports.removeStaff = removeStaff;
