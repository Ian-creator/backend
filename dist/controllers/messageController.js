"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessageDetails = exports.sendMessage = exports.getMessages = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getMessages = async (req, res) => {
    const userId = req.user.id;
    try {
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            },
            include: {
                sender: { select: { fullName: true, username: true } },
                receiver: { select: { fullName: true, username: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(messages);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};
exports.getMessages = getMessages;
const sendMessage = async (req, res) => {
    const senderId = req.user.id;
    const { receiverId, subject, body } = req.body;
    try {
        const message = await prisma.message.create({
            data: {
                senderId,
                receiverId,
                subject,
                body
            }
        });
        // Also create a notification for the receiver
        await prisma.notification.create({
            data: {
                userId: receiverId,
                title: 'New Message',
                content: `You have received a new message from ${req.user.username}: ${subject}`,
                type: 'info'
            }
        });
        res.status(201).json(message);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
};
exports.sendMessage = sendMessage;
const getMessageDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const message = await prisma.message.findUnique({
            where: { id: id },
            include: {
                sender: { select: { fullName: true, username: true } },
                receiver: { select: { fullName: true, username: true } }
            }
        });
        if (!message)
            return res.status(404).json({ error: 'Message not found' });
        // Mark as read if receiver is viewing
        if (message.receiverId === req.user.id && !message.read) {
            await prisma.message.update({
                where: { id: id },
                data: { read: true }
            });
        }
        res.json(message);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch message details' });
    }
};
exports.getMessageDetails = getMessageDetails;
