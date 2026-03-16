"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkplans = exports.uploadWorkplan = void 0;
const client_1 = require("@prisma/client");
const xlsx = __importStar(require("xlsx"));
const multer_1 = __importDefault(require("multer"));
const prisma = new client_1.PrismaClient();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const uploadWorkplan = async (req, res) => {
    const file = req.file;
    if (!file) {
        console.log('Upload failed: No file found in request');
        return res.status(400).json({ error: 'No file uploaded' });
    }
    try {
        console.log(`Processing upload: ${file.originalname}, user: ${req.user?.username}`);
        if (!file.buffer) {
            throw new Error('File buffer is missing');
        }
        const workbook = xlsx.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        // Smarter Header Detection
        const rawRows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
        let headerRowIndex = 0;
        // Search for a row containing keywords like CODE, OBJECTIVE, or ACTIVITY
        for (let i = 0; i < Math.min(rawRows.length, 20); i++) {
            const row = rawRows[i];
            const hasKeywords = row.some(cell => typeof cell === 'string' &&
                (cell.toLowerCase().includes('code') ||
                    cell.toLowerCase().includes('objective') ||
                    cell.toLowerCase().includes('activity')));
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
                userId: req.user.id,
                fileName: file.originalname,
                fileUrl: 'placeholder-url',
                content: sheetData,
                uploadedBy: req.user.username
            }
        });
        await prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: 'UPLOAD_WORKPLAN',
                targetTable: 'Workplan',
                targetId: workplan.id,
                details: `Uploaded workplan: ${file.originalname}`
            }
        });
        res.status(201).json(workplan);
    }
    catch (error) {
        console.error('Workplan upload error details:', error);
        res.status(500).json({
            error: 'Failed to process workplan',
            details: error.message || 'Unknown error'
        });
    }
};
exports.uploadWorkplan = uploadWorkplan;
const getWorkplans = async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;
    try {
        let query = {};
        if (role === 'EMPLOYEE' || role === 'OFFICER' || role === 'ASSISTANT')
            query.userId = userId;
        // Supervisors and others can see more based on RBAC logic (simplified here)
        const workplans = await prisma.workplan.findMany({
            where: query,
            orderBy: { createdAt: 'desc' }
        });
        res.json(workplans);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch workplans' });
    }
};
exports.getWorkplans = getWorkplans;
// Timesheet generation moved to timesheetController.ts
