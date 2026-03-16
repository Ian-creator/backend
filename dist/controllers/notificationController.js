"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearNotifications = exports.markAsRead = exports.getNotifications = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getNotifications = async (req, res) => {
    const userId = req.user.id;
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        res.json(notifications);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};
exports.getNotifications = getNotifications;
const markAsRead = async (req, res) => {
    const { id } = req.params;
    try {
        const notification = await prisma.notification.update({
            where: { id: id },
            data: { read: true }
        });
        res.json(notification);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update notification' });
    }
};
exports.markAsRead = markAsRead;
const clearNotifications = async (req, res) => {
    const userId = req.user.id;
    try {
        await prisma.notification.deleteMany({
            where: { userId }
        });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to clear notifications' });
    }
};
exports.clearNotifications = clearNotifications;
