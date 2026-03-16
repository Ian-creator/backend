import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { isWithinOffice } from '../utils/geofence';
import { io } from '../server';

const prisma = new PrismaClient();

export const signIn = async (req: Request, res: Response) => {
  const { lat, lon, method } = req.body;
  const userId = (req as any).user.id;

  try {
    // Check geofence
    const withinOffice = isWithinOffice(lat, lon);

    // In a real scenario, method "auto-wifi" would be triggered by a presence detection service
    // Here we trust the client's reported method for simulation purposes

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        type: 'sign-in',
        lat,
        long: lon,
        method: method || 'manual',
      }
    });

    // Notify via Socket.IO for real-time dashboard updates
    io.emit('attendance_update', { userId, type: 'sign-in' });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'SIGN_IN',
        targetTable: 'Attendance',
        targetId: attendance.id,
        details: `Employee signed in via ${method || 'manual'}`
      }
    });

    res.status(201).json({
      attendance,
      verified: withinOffice,
      message: withinOffice ? 'Signed in successfully within office geofence.' : 'Signed in, but location outside office geofence.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to sign in' });
  }
};

export const logFieldVisit = async (req: Request, res: Response) => {
  const { lat, lon, details } = req.body;
  const userId = (req as any).user.id;

  try {
    const fieldVisit = await prisma.fieldVisit.create({
      data: {
        userId,
        startTime: new Date(),
        lat,
        long: lon,
        details
      }
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'FIELD_VISIT_START',
        targetTable: 'FieldVisit',
        targetId: fieldVisit.id,
        details: `Started field visit: ${details}`
      }
    });

    res.status(201).json(fieldVisit);
  } catch (error) {
    res.status(500).json({ error: 'Failed to log field visit' });
  }
};

export const returnFromField = async (req: Request, res: Response) => {
  const { lat, lon } = req.body;
  const userId = (req as any).user.id;

  try {
    // 1. Close open field visit
    const activeVisit = await prisma.fieldVisit.findFirst({
      where: { userId, endTime: null },
      orderBy: { startTime: 'desc' }
    });

    if (activeVisit) {
      await prisma.fieldVisit.update({
        where: { id: activeVisit.id },
        data: { endTime: new Date() }
      });
    }

    // 2. Record return event
    const attendance = await prisma.attendance.create({
      data: {
        userId,
        type: 'return-from-field',
        lat,
        long: lon,
        method: 'auto-wifi'
      }
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'FIELD_VISIT_RETURN',
        targetTable: 'Attendance',
        targetId: attendance.id,
        details: `Returned from field visit`
      }
    });

    res.json({ attendance, message: 'Returned from field successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record return' });
  }
};

export const getAttendanceHistory = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  try {
    const [attendanceHistory, fieldVisits] = await Promise.all([
      prisma.attendance.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: 30
      }),
      prisma.fieldVisit.findMany({
        where: { userId },
        orderBy: { startTime: 'desc' },
        take: 20
      })
    ]);

    // Normalize and combine
    const combinedHistory = [
      ...attendanceHistory,
      ...fieldVisits.map(fv => ({
        id: fv.id,
        type: 'field-visit',
        timestamp: fv.startTime,
        lat: fv.lat,
        long: fv.long,
        method: 'manual',
        details: fv.details,
        endTime: fv.endTime
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json(combinedHistory.slice(0, 50));
  } catch (error) {
    console.error('Fetch history error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};
export const getTeamAttendance = async (req: Request, res: Response) => {
  const supervisorId = (req as any).user.id;
  const role = (req as any).user.role;

  try {
    const whereClause = (role === 'SYSTEM_ADMINISTRATOR' || role === 'EXECUTIVE' || role === 'HR_OFFICER')
      ? {}
      : { user: { supervisorId } };

    const teamHistory = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        user: {
          select: { fullName: true, jobTitle: true, photoUrl: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    });
    res.json(teamHistory);
  } catch (error) {
    console.error('Fetch team attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch team attendance' });
  }
};
