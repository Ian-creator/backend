"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = exports.getTeamStats = exports.getEmployeeReport = exports.getDashboardStats = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getDashboardStats = async (req, res) => {
    try {
        const role = req.user.role;
        const logLimit = role === 'SYSTEM_ADMINISTRATOR' ? 50 : 5;
        const [employeeCount, departmentCount, assetCount, attendanceToday, activeFieldVisits, recentLogs] = await Promise.all([
            prisma.user.count({ where: { role: { in: ['EMPLOYEE', 'OFFICER', 'ASSISTANT'] } } }),
            prisma.department.count(),
            prisma.asset.count(),
            prisma.attendance.count({
                where: {
                    timestamp: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0))
                    },
                    type: 'sign-in'
                }
            }),
            prisma.fieldVisit.count({
                where: { endTime: null }
            }),
            prisma.auditLog.findMany({
                take: logLimit,
                orderBy: { timestamp: 'desc' },
                include: { user: { select: { fullName: true, username: true } } }
            })
        ]);
        const attendanceByDay = await prisma.attendance.groupBy({
            by: ['timestamp'],
            where: {
                timestamp: {
                    gte: new Date(new Date().setDate(new Date().getDate() - 7))
                },
                type: 'sign-in'
            },
            _count: {
                id: true
            }
        });
        res.json({
            summary: {
                employees: employeeCount,
                departments: departmentCount,
                assets: assetCount,
                attendanceToday,
                activeFieldVisits
            },
            recentLogs,
            charts: {
                attendance: attendanceByDay
            }
        });
    }
    catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};
exports.getDashboardStats = getDashboardStats;
const getEmployeeReport = async (req, res) => {
    const { userId } = req.params;
    const { start, end } = req.query;
    try {
        const attendance = await prisma.attendance.findMany({
            where: {
                userId: userId,
                timestamp: {
                    gte: start ? new Date(start) : undefined,
                    lte: end ? new Date(end) : undefined
                }
            },
            orderBy: { timestamp: 'asc' }
        });
        const fieldVisits = await prisma.fieldVisit.findMany({
            where: {
                userId: userId,
                startTime: {
                    gte: start ? new Date(start) : undefined,
                    lte: end ? new Date(end) : undefined
                }
            },
            orderBy: { startTime: 'asc' }
        });
        res.json({ attendance, fieldVisits });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate employee report' });
    }
};
exports.getEmployeeReport = getEmployeeReport;
const getTeamStats = async (req, res) => {
    const supervisorId = req.user.id;
    const role = req.user.role;
    try {
        const userWhereClause = (role === 'SYSTEM_ADMINISTRATOR' || role === 'EXECUTIVE' || role === 'HR_OFFICER')
            ? {}
            : { supervisorId };
        const [teamMembers, activeFieldVisits] = await Promise.all([
            prisma.user.findMany({
                where: userWhereClause,
                select: { id: true, fullName: true, status: true, jobTitle: true }
            }),
            prisma.fieldVisit.findMany({
                where: {
                    user: userWhereClause,
                    endTime: null
                },
                include: { user: { select: { fullName: true } } }
            })
        ]);
        const teamIds = teamMembers.map(m => m.id);
        const attendanceToday = await prisma.attendance.findMany({
            where: {
                userId: { in: teamIds },
                type: 'sign-in',
                timestamp: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
            },
            select: { userId: true }
        });
        const presentIds = new Set(attendanceToday.map((a) => a.userId));
        res.json({
            members: teamMembers.map((m) => ({
                ...m,
                isPresent: presentIds.has(m.id),
                isInField: activeFieldVisits.some((v) => v.userId === m.id)
            })),
            activeFieldVisits,
            stats: {
                total: teamMembers.length,
                present: presentIds.size,
                inField: activeFieldVisits.length
            }
        });
    }
    catch (error) {
        console.error('Fetch team stats error:', error);
        res.status(500).json({ error: 'Failed to fetch team stats' });
    }
};
exports.getTeamStats = getTeamStats;
const getAuditLogs = async (req, res) => {
    try {
        const logs = await prisma.auditLog.findMany({
            orderBy: { timestamp: 'desc' },
            include: {
                user: {
                    select: { fullName: true, username: true }
                }
            }
        });
        res.json(logs);
    }
    catch (error) {
        console.error('Fetch audit logs error:', error);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
};
exports.getAuditLogs = getAuditLogs;
