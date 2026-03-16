import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';
import multer from 'multer';

const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

export const uploadWorkplan = async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    console.log('Upload failed: No file found in request');
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    console.log(`Processing upload: ${file.originalname}, user: ${(req as any).user?.username}`);

    if (!file.buffer) {
      throw new Error('File buffer is missing');
    }

    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Smarter Header Detection
    const rawRows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as any[][];
    let headerRowIndex = 0;

    // Search for a row containing keywords like CODE, OBJECTIVE, or ACTIVITY
    for (let i = 0; i < Math.min(rawRows.length, 20); i++) {
      const row = rawRows[i];
      const hasKeywords = row.some(cell =>
        typeof cell === 'string' &&
        (cell.toLowerCase().includes('code') ||
          cell.toLowerCase().includes('objective') ||
          cell.toLowerCase().includes('activity'))
      );
      if (hasKeywords) {
        headerRowIndex = i;
        break;
      }
    }

    // Parse the sheet starting from the detected header row
    const sheetData = xlsx.utils.sheet_to_json(worksheet, {
      range: headerRowIndex,
      defval: ""
    });

    console.log(`Detected header at row ${headerRowIndex + 1}. Extracted ${sheetData.length} rows.`);

    const workplan = await prisma.workplan.create({
      data: {
        userId: (req as any).user.id,
        fileName: file.originalname,
        fileUrl: 'placeholder-url',
        content: sheetData as any,
        uploadedBy: (req as any).user.username
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: (req as any).user.id,
        action: 'UPLOAD_WORKPLAN',
        targetTable: 'Workplan',
        targetId: workplan.id,
        details: `Uploaded workplan: ${file.originalname}`
      }
    });

    res.status(201).json(workplan);
  } catch (error: any) {
    console.error('Workplan upload error details:', error);
    res.status(500).json({
      error: 'Failed to process workplan',
      details: error.message || 'Unknown error'
    });
  }
};

export const getWorkplans = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const role = (req as any).user.role;

  try {
    let query: any = {};
    if (role === 'EMPLOYEE' || role === 'OFFICER' || role === 'ASSISTANT') query.userId = userId;
    // Supervisors and others can see more based on RBAC logic (simplified here)

    const workplans = await prisma.workplan.findMany({
      where: query,
      orderBy: { createdAt: 'desc' }
    });
    res.json(workplans);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workplans' });
  }
};

// Timesheet generation moved to timesheetController.ts
