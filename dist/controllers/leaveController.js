"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLeaveRequest = exports.updateLeaveStatus = exports.getLeaveRequestsForManagement = exports.getMyLeaveRequests = exports.createLeaveRequest = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createLeaveRequest = async (req, res) => {
    const userId = req.user.id;
    const { type, startDate, endDate, reason, supervisorId } = req.body;
    try {
        const leaveRequest = await prisma.leaveRequest.create({
            data: {
                userId,
                supervisorId,
                type,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason,
                status: 'PENDING'
            },
            include: {
                user: { select: { fullName: true, username: true } },
                supervisor: { select: { fullName: true, username: true } }
            }
        });
        // Create notification for supervisor
        await prisma.notification.create({
            data: {
                userId: supervisorId,
                title: 'New Leave Request',
                content: `${req.user.username} has submitted a ${type} leave request from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}.`,
                type: 'info'
            }
        });
        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'CREATE_LEAVE_REQUEST',
                targetTable: 'LeaveRequest',
                targetId: leaveRequest.id,
                details: `Applied for ${type} leave from ${startDate} to ${endDate}`
            }
        });
        res.status(201).json(leaveRequest);
    }
    catch (error) {
        console.error('Error creating leave request:', error);
        res.status(500).json({ error: 'Failed to create leave request' });
    }
};
exports.createLeaveRequest = createLeaveRequest;
const getMyLeaveRequests = async (req, res) => {
    const userId = req.user.id;
    try {
        const requests = await prisma.leaveRequest.findMany({
            where: { userId },
            include: {
                supervisor: { select: { fullName: true, username: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(requests);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch leave requests' });
    }
};
exports.getMyLeaveRequests = getMyLeaveRequests;
const getLeaveRequestsForManagement = async (req, res) => {
    const { role, id: userId } = req.user;
    try {
        const whereClause = {};
        // If supervisor, only show requests assigned to them
        // If HR or Admin, show all
        if (role === 'SUPERVISOR' || role === 'MANAGER' || role === 'OFFICER') {
            whereClause.supervisorId = userId;
        }
        else if (role !== 'HR_OFFICER' && role !== 'SYSTEM_ADMINISTRATOR') {
            return res.status(403).json({ error: 'Access denied' });
        }
        const requests = await prisma.leaveRequest.findMany({
            where: whereClause,
            include: {
                user: { select: { fullName: true, jobTitle: true, department: { select: { name: true } } } },
                supervisor: { select: { fullName: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(requests);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch management leave requests' });
    }
};
exports.getLeaveRequestsForManagement = getLeaveRequestsForManagement;
const updateLeaveStatus = async (req, res) => {
    const { id } = req.params;
    const { status, supervisorComment } = req.body;
    const userId = req.user.id;
    try {
        const existingRequest = await prisma.leaveRequest.findUnique({
            where: { id: id },
            include: { user: true }
        });
        if (!existingRequest) {
            return res.status(404).json({ error: 'Leave request not found' });
        }
        const leaveRequest = await prisma.leaveRequest.update({
            where: { id: id },
            data: { status: status }
        });
        // Notify user
        await prisma.notification.create({
            data: {
                userId: existingRequest.userId,
                title: `Leave Request ${status}`,
                content: `Your leave request from ${existingRequest.startDate.toLocaleDateString()} to ${existingRequest.endDate.toLocaleDateString()} has been ${status.toLowerCase()}.`,
                type: status === 'APPROVED' ? 'success' : 'error'
            }
        });
        // Audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'UPDATE_LEAVE_STATUS',
                targetTable: 'LeaveRequest',
                targetId: id,
                details: `Updated leave status to ${status} for user ${existingRequest.user.username}`
            }
        });
        res.json(leaveRequest);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update leave status' });
    }
};
exports.updateLeaveStatus = updateLeaveStatus;
const deleteLeaveRequest = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        const request = await prisma.leaveRequest.findUnique({ where: { id: id } });
        if (!request)
            return res.status(404).json({ error: 'Request not found' });
        // Only owner can delete PENDING request, or HR/Admin can delete any?
        // Let's stick to owner for now
        if (request.userId !== userId && req.user.role !== 'HR_OFFICER' && req.user.role !== 'SYSTEM_ADMINISTRATOR') {
            return res.status(403).json({ error: 'Access denied' });
        }
        await prisma.leaveRequest.delete({ where: { id: id } });
        // Audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'DELETE_LEAVE_REQUEST',
                targetTable: 'LeaveRequest',
                targetId: id,
                details: `Deleted leave request ${id}`
            }
        });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete leave request' });
    }
};
exports.deleteLeaveRequest = deleteLeaveRequest;
