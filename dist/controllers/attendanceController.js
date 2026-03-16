"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeamAttendance = exports.getAttendanceHistory = exports.returnFromField = exports.logFieldVisit = exports.signIn = void 0;
const client_1 = require("@prisma/client");
const geofence_1 = require("../utils/geofence");
const server_1 = require("../server");
const prisma = new client_1.PrismaClient();
const signIn = async (req, res) => {
    const { lat, lon, method } = req.body;
    const userId = req.user.id;
    try {
        // Check geofence
        const withinOffice = (0, geofence_1.isWithinOffice)(lat, lon);
        // In a real scenario, method "auto-wifi" would be triggered by a presence detection service
        // Here we trust the client's reported method for simulation purposes
        const attendance = await prisma.attendance.create({
            data: {
                userId,
                type: 'sign-in',
                lat,
                long: lon,
                method: method || 'manual',
            }
        });
        // Notify via Socket.IO for real-time dashboard updates
        server_1.io.emit('attendance_update', { userId, type: 'sign-in' });
        // Log the action
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'SIGN_IN',
                targetTable: 'Attendance',
                targetId: attendance.id,
                details: `Employee signed in via ${method || 'manual'}`
            }
        });
        res.status(201).json({
            attendance,
            verified: withinOffice,
            message: withinOffice ? 'Signed in successfully within office geofence.' : 'Signed in, but location outside office geofence.'
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to sign in' });
    }
};
exports.signIn = signIn;
const logFieldVisit = async (req, res) => {
    const { lat, lon, details } = req.body;
    const userId = req.user.id;
    try {
        const fieldVisit = await prisma.fieldVisit.create({
            data: {
                userId,
                startTime: new Date(),
                lat,
                long: lon,
                details
            }
        });
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'FIELD_VISIT_START',
                targetTable: 'FieldVisit',
                targetId: fieldVisit.id,
                details: `Started field visit: ${details}`
            }
        });
        res.status(201).json(fieldVisit);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to log field visit' });
    }
};
exports.logFieldVisit = logFieldVisit;
const returnFromField = async (req, res) => {
    const { lat, lon } = req.body;
    const userId = req.user.id;
    try {
        // 1. Close open field visit
        const activeVisit = await prisma.fieldVisit.findFirst({
            where: { userId, endTime: null },
            orderBy: { startTime: 'desc' }
        });
        if (activeVisit) {
            await prisma.fieldVisit.update({
                where: { id: activeVisit.id },
                data: { endTime: new Date() }
            });
        }
        // 2. Record return event
        const attendance = await prisma.attendance.create({
            data: {
                userId,
                type: 'return-from-field',
                lat,
                long: lon,
                method: 'auto-wifi'
            }
        });
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'FIELD_VISIT_RETURN',
                targetTable: 'Attendance',
                targetId: attendance.id,
                details: `Returned from field visit`
            }
        });
        res.json({ attendance, message: 'Returned from field successfully.' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to record return' });
    }
};
exports.returnFromField = returnFromField;
const getAttendanceHistory = async (req, res) => {
    const userId = req.user.id;
    try {
        const [attendanceHistory, fieldVisits] = await Promise.all([
            prisma.attendance.findMany({
                where: { userId },
                orderBy: { timestamp: 'desc' },
                take: 30
            }),
            prisma.fieldVisit.findMany({
                where: { userId },
                orderBy: { startTime: 'desc' },
                take: 20
            })
        ]);
        // Normalize and combine
        const combinedHistory = [
            ...attendanceHistory,
            ...fieldVisits.map(fv => ({
                id: fv.id,
                type: 'field-visit',
                timestamp: fv.startTime,
                lat: fv.lat,
                long: fv.long,
                method: 'manual',
                details: fv.details,
                endTime: fv.endTime
            }))
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        res.json(combinedHistory.slice(0, 50));
    }
    catch (error) {
        console.error('Fetch history error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
};
exports.getAttendanceHistory = getAttendanceHistory;
const getTeamAttendance = async (req, res) => {
    const supervisorId = req.user.id;
    const role = req.user.role;
    try {
        const whereClause = (role === 'SYSTEM_ADMINISTRATOR' || role === 'EXECUTIVE' || role === 'HR_OFFICER')
            ? {}
            : { user: { supervisorId } };
        const teamHistory = await prisma.attendance.findMany({
            where: whereClause,
            include: {
                user: {
                    select: { fullName: true, jobTitle: true, photoUrl: true }
                }
            },
            orderBy: { timestamp: 'desc' },
            take: 100
        });
        res.json(teamHistory);
    }
    catch (error) {
        console.error('Fetch team attendance error:', error);
        res.status(500).json({ error: 'Failed to fetch team attendance' });
    }
};
exports.getTeamAttendance = getTeamAttendance;
