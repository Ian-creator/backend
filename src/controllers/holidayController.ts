import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getHolidays = async (req: Request, res: Response) => {
    try {
        const holidays = await prisma.holiday.findMany({
            orderBy: { date: 'asc' }
        });
        res.json(holidays);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch holidays' });
    }
};

export const addHoliday = async (req: Request, res: Response) => {
    const { name, date, type } = req.body;
    const userId = (req as any).user.id;

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
    } catch (error) {
        res.status(500).json({ error: 'Failed to add holiday' });
    }
};

export const deleteHoliday = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user.id;

    try {
        await prisma.holiday.delete({
            where: { id: id as string }

        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'DELETE_HOLIDAY',
                targetTable: 'Holiday',
                targetId: id as string,
                details: `Deleted holiday ${id as string}`

            }
        });

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete holiday' });
    }
};

export const autoUpdateHolidays = async (req: Request, res: Response) => {
    // This would typically call an external API. 
    // For now, let's implement a mockup that adds some standard holidays if they don't exist.
    const userId = (req as any).user.id;
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
    } catch (error) {
        res.status(500).json({ error: 'Failed to auto-update holidays' });
    }
};
