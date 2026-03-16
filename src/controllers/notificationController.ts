import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getNotifications = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const notification = await prisma.notification.update({
            where: { id: id as string },
            data: { read: true }
        });
        res.json(notification);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update notification' });
    }
};

export const clearNotifications = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    try {
        await prisma.notification.deleteMany({
            where: { userId }
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear notifications' });
    }
};
