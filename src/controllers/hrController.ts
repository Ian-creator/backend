import { Request, Response } from 'express';
import { PrismaClient, Role, Status } from '@prisma/client';
import bcrypt from 'bcrypt';


const prisma = new PrismaClient();

export const createEmployee = async (req: Request, res: Response) => {
  const { 
    username, password, fullName, jobTitle, nin, role, 
    departmentId, supervisorId, photoUrl 
  } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash: hashedPassword,
        fullName,
        jobTitle,
        nin,
        role: role as Role,
        departmentId: departmentId || null,
        supervisorId: supervisorId || null,
        photoUrl,
        status: Status.ACTIVE
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: (req as any).user.id,
        action: 'CREATE_EMPLOYEE',
        targetTable: 'User',
        targetId: newUser.id,
        details: `Created employee ${username}`
      }
    });

    res.status(201).json(newUser);
  } catch (error: any) {
    console.error('Create employee error:', error);
    if (error.code === 'P2002') {
      const target = error.meta?.target || [];
      return res.status(400).json({ error: `An employee with this ${target.join(', ')} already exists.` });
    }
    res.status(500).json({ error: error.message || 'Failed to create employee' });
  }
};

export const updateEmployeeStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: id as string },
      data: { status: status as Status }

    });

    await prisma.auditLog.create({
      data: {
        userId: (req as any).user.id,
        action: 'UPDATE_STATUS',
        targetTable: 'User',
        targetId: id as string,
        details: `Updated status of ${updatedUser.username} to ${status as string}`

      }
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
};

export const getEmployees = async (req: Request, res: Response) => {
  try {
    const employees = await prisma.user.findMany({
      include: {
        department: true,
        supervisor: {
          select: { id: true, fullName: true }
        }
      },
      where: {
        NOT: { role: 'SYSTEM_ADMINISTRATOR' } // Hide admin records from HR
      }
    });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};
