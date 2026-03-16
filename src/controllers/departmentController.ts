import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createDepartment = async (req: Request, res: Response) => {
  const { name } = req.body;

  try {
    const newDept = await prisma.department.create({
      data: { name }
    });

    await prisma.auditLog.create({
      data: {
        userId: (req as any).user.id,
        action: 'CREATE_DEPARTMENT',
        targetTable: 'Department',
        targetId: newDept.id,
        details: `Created department ${name}`
      }
    });

    res.status(201).json(newDept);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create department' });
  }
};

export const getDepartments = async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      }
    });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};
