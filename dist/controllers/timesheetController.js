"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTimesheetStatus = exports.createTimesheet = exports.getTimesheets = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getTimesheets = async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;
    try {
        let query = {};
        // Employees only see their own. Supervisors/Admins see more.
        if (role === 'EMPLOYEE' || role === 'ASSISTANT' || role === 'OFFICER') {
            query.userId = userId;
        }
        else if (role === 'SUPERVISOR' || role === 'MANAGER') {
            // Logic for supervisors to see their team's timesheets could be added here
            query.userId = userId; // For now, just own.
        }
        const timesheets = await prisma.timesheet.findMany({
            where: query,
            include: {
                user: {
                    select: {
                        fullName: true,
                        jobTitle: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(timesheets);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch timesheets' });
    }
};
exports.getTimesheets = getTimesheets;
const createTimesheet = async (req, res) => {
    const { periodStart, periodEnd, comments } = req.body;
    const userId = req.user.id;
    try {
        const start = new Date(periodStart);
        const end = new Date(periodEnd);
        // 1. Fetch all relevant logs for the period
        const [attendance, fieldVisits] = await Promise.all([
            prisma.attendance.findMany({
                where: {
                    userId,
                    timestamp: { gte: start, lte: end }
                },
                orderBy: { timestamp: 'asc' }
            }),
            prisma.fieldVisit.findMany({
                where: {
                    userId,
                    startTime: { gte: start, lte: end }
                },
                orderBy: { startTime: 'asc' }
            })
        ]);
        // 2. Calculate daily breakdown
        const dailyData = [];
        let currentDate = new Date(start);
        while (currentDate <= end) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
            // Filter logs for this specific day
            const dayAttendance = attendance.filter(a => a.timestamp.toISOString().split('T')[0] === dateStr);
            const dayFields = fieldVisits.filter(f => f.startTime.toISOString().split('T')[0] === dateStr);
            let officeMinutes = 0;
            let fieldMinutes = 0;
            // Simple heuristic: Total span from first sign-in to last activity
            // Plus specific field visit durations
            if (dayAttendance.length > 0 || dayFields.length > 0) {
                // Calculate Field Time
                dayFields.forEach(f => {
                    const fStart = f.startTime.getTime();
                    const fEnd = f.endTime ? f.endTime.getTime() : f.startTime.getTime() + (2 * 60 * 60 * 1000); // Default 2hrs if not ended
                    fieldMinutes += (fEnd - fStart) / (1000 * 60);
                });
                // Calculate Office Time (simplified: items in attendance that aren't field visits)
                // In a more complex system, we'd subtract field spans from the total office span
                if (dayAttendance.length >= 1) {
                    const firstIn = dayAttendance[0].timestamp.getTime();
                    const lastEvent = dayAttendance[dayAttendance.length - 1].timestamp.getTime();
                    const totalSpan = (lastEvent - firstIn) / (1000 * 60);
                    officeMinutes = Math.max(0, totalSpan); // Total office span
                }
            }
            dailyData.push({
                date: dateStr,
                day: dayName,
                officeHours: parseFloat((officeMinutes / 60).toFixed(1)),
                fieldHours: parseFloat((fieldMinutes / 60).toFixed(1)),
                totalHours: parseFloat(((officeMinutes + fieldMinutes) / 60).toFixed(1)),
                activities: dayFields.map(f => f.details).join(', ') || (dayAttendance.length > 0 ? 'Office Work' : '')
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        const timesheet = await prisma.timesheet.create({
            data: {
                userId,
                periodStart: start,
                periodEnd: end,
                content: dailyData,
                status: 'submitted',
                comments: comments || `Auto-generated from logs. Total hours: ${dailyData.reduce((sum, d) => sum + d.totalHours, 0)}`
            }
        });
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'CREATE_TIMESHEET',
                targetTable: 'Timesheet',
                targetId: timesheet.id,
                details: `Generated logic-based timesheet. Total hours: ${dailyData.reduce((sum, d) => sum + d.totalHours, 0)}`
            }
        });
        res.status(201).json(timesheet);
    }
    catch (error) {
        console.error('Create timesheet error:', error);
        res.status(500).json({ error: 'Failed to create timesheet' });
    }
};
exports.createTimesheet = createTimesheet;
const updateTimesheetStatus = async (req, res) => {
    const { id } = req.params;
    const { status, supervisorComment } = req.body;
    try {
        const timesheet = await prisma.timesheet.update({
            where: { id: id },
            data: {
                status: status,
                supervisorComment: supervisorComment,
                updatedAt: new Date()
            }
        });
        await prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: 'UPDATE_TIMESHEET_STATUS',
                targetTable: 'Timesheet',
                targetId: id,
                details: `Updated timesheet ${id} status to ${status}`
            }
        });
        res.json(timesheet);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update timesheet' });
    }
};
exports.updateTimesheetStatus = updateTimesheetStatus;
