"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAsset = exports.getAssets = exports.createAsset = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createAsset = async (req, res) => {
    const { name, category, serialNumber, purchaseDate, value, status, assignedToId, assignedToLocation } = req.body;
    try {
        const asset = await prisma.asset.create({
            data: {
                name,
                category: category,
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
                userId: req.user.id,
                action: 'CREATE_ASSET',
                targetTable: 'Asset',
                targetId: asset.id,
                details: `Recorded asset ${name} (${serialNumber})`
            }
        });
        res.status(201).json(asset);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to record asset' });
    }
};
exports.createAsset = createAsset;
const getAssets = async (req, res) => {
    try {
        const assets = await prisma.asset.findMany({
            include: {
                assignedTo: {
                    select: { id: true, fullName: true, jobTitle: true }
                }
            }
        });
        res.json(assets);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch assets' });
    }
};
exports.getAssets = getAssets;
const updateAsset = async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    try {
        if (data.purchaseDate)
            data.purchaseDate = new Date(data.purchaseDate);
        if (data.value)
            data.value = parseFloat(data.value);
        const asset = await prisma.asset.update({
            where: { id: id },
            data
        });
        await prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: 'UPDATE_ASSET',
                targetTable: 'Asset',
                targetId: id,
                details: `Updated asset ${asset.name}`
            }
        });
        res.json(asset);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update asset' });
    }
};
exports.updateAsset = updateAsset;
