import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getMessages = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
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
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};

export const sendMessage = async (req: Request, res: Response) => {
    const senderId = (req as any).user.id;
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
                content: `You have received a new message from ${(req as any).user.username}: ${subject}`,
                type: 'info'
            }
        });

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
};

export const getMessageDetails = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const message = await prisma.message.findUnique({
            where: { id: id as string },
            include: {
                sender: { select: { fullName: true, username: true } },
                receiver: { select: { fullName: true, username: true } }
            }
        });

        if (!message) return res.status(404).json({ error: 'Message not found' });

        // Mark as read if receiver is viewing
        if (message.receiverId === (req as any).user.id && !message.read) {
            await prisma.message.update({
                where: { id: id as string },
                data: { read: true }
            });

        }

        res.json(message);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch message details' });
    }
};
