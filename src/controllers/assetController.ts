import { Request, Response } from 'express';
import { PrismaClient, AssetCategory } from '@prisma/client';

const prisma = new PrismaClient();

export const createAsset = async (req: Request, res: Response) => {
  const { 
    name, category, serialNumber, purchaseDate, value, 
    status, assignedToId, assignedToLocation 
  } = req.body;

  try {
    const asset = await prisma.asset.create({
      data: {
        name,
        category: category as AssetCategory,
        serialNumber,
        purchaseDate: new Date(purchaseDate),
        value: parseFloat(value),
        status,
        assignedToId,
        assignedToLocation
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: (req as any).user.id,
        action: 'CREATE_ASSET',
        targetTable: 'Asset',
        targetId: asset.id,
        details: `Recorded asset ${name} (${serialNumber})`
      }
    });

    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ error: 'Failed to record asset' });
  }
};

export const getAssets = async (req: Request, res: Response) => {
  try {
    const assets = await prisma.asset.findMany({
      include: {
        assignedTo: {
          select: { id: true, fullName: true, jobTitle: true }
        }
      }
    });
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
};

export const updateAsset = async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  try {
    if (data.purchaseDate) data.purchaseDate = new Date(data.purchaseDate);
    if (data.value) data.value = parseFloat(data.value);

    const asset = await prisma.asset.update({
      where: { id: id as string }
,
      data
    });

    await prisma.auditLog.create({
      data: {
        userId: (req as any).user.id,
        action: 'UPDATE_ASSET',
        targetTable: 'Asset',
        targetId: id as string,
        details: `Updated asset ${asset.name}`

      }
    });

    res.json(asset);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update asset' });
  }
};
