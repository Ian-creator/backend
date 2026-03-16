"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoUpdateHolidays = exports.deleteHoliday = exports.addHoliday = exports.getHolidays = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getHolidays = async (req, res) => {
    try {
        const holidays = await prisma.holiday.findMany({
            orderBy: { date: 'asc' }
        });
        res.json(holidays);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch holidays' });
    }
};
exports.getHolidays = getHolidays;
const addHoliday = async (req, res) => {
    const { name, date, type } = req.body;
    const userId = req.user.id;
    try {
        const holiday = await prisma.holiday.create({
            data: {
                name,
                date: new Date(date),
                type: type || 'PUBLIC'
            }
        });
        // Audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'ADD_HOLIDAY',
                targetTable: 'Holiday',
                targetId: holiday.id,
                details: `Added holiday: ${name} on ${date}`
            }
        });
        res.status(201).json(holiday);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to add holiday' });
    }
};
exports.addHoliday = addHoliday;
const deleteHoliday = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        await prisma.holiday.delete({
            where: { id: id }
        });
        // Audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'DELETE_HOLIDAY',
                targetTable: 'Holiday',
                targetId: id,
                details: `Deleted holiday ${id}`
            }
        });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete holiday' });
    }
};
exports.deleteHoliday = deleteHoliday;
const autoUpdateHolidays = async (req, res) => {
    // This would typically call an external API. 
    // For now, let's implement a mockup that adds some standard holidays if they don't exist.
    const userId = req.user.id;
    const currentYear = new Date().getFullYear();
    const defaultHolidays = [
        { name: "New Year's Day", date: `${currentYear}-01-01` },
        { name: "Labour Day", date: `${currentYear}-05-01` },
        { name: "Independence Day", date: `${currentYear}-10-09` },
        { name: "Christmas Day", date: `${currentYear}-12-25` },
        { name: "Boxing Day", date: `${currentYear}-12-26` },
    ];
    try {
        let addedCount = 0;
        for (const h of defaultHolidays) {
            const exists = await prisma.holiday.findFirst({
                where: {
                    name: h.name,
                    date: new Date(h.date)
                }
            });
            if (!exists) {
                await prisma.holiday.create({
                    data: {
                        name: h.name,
                        date: new Date(h.date),
                        type: 'PUBLIC'
                    }
                });
                addedCount++;
            }
        }
        if (addedCount > 0) {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action: 'AUTO_UPDATE_HOLIDAYS',
                    targetTable: 'Holiday',
                    targetId: 'SYSTEM',
                    details: `Auto-updated ${addedCount} holidays for year ${currentYear}`
                }
            });
        }
        res.json({ message: `Successfully updated holidays. Added ${addedCount} new holidays.` });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to auto-update holidays' });
    }
};
exports.autoUpdateHolidays = autoUpdateHolidays;
