import { Request, Response } from 'express';
import bcrypt from 'bcrypt';

import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getJwtSecret = () => process.env.JWT_SECRET || 'secret';

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status === 'SUSPENDED' || user.status === 'TERMINATED') {
      await prisma.loginLog.create({
        data: { username, success: false, userId: user.id, ipAddress: req.ip },
      });
      return res.status(403).json({
        error: 'Access Denied. Your account has been suspended/terminated. Please contact HR.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      await prisma.loginLog.create({
        data: { username, success: false, userId: user.id, ipAddress: req.ip },
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, username: user.username },
      getJwtSecret(),
      { expiresIn: '8h' }
    );

    await prisma.loginLog.create({
      data: { username, success: true, userId: user.id, ipAddress: req.ip },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        targetTable: 'User',
        targetId: user.id,
        details: `Logged in to the system`
      }
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
