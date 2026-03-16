"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getJwtSecret = () => process.env.JWT_SECRET || 'secret';
const login = async (req, res) => {
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
        const isMatch = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            await prisma.loginLog.create({
                data: { username, success: false, userId: user.id, ipAddress: req.ip },
            });
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role, username: user.username }, getJwtSecret(), { expiresIn: '8h' });
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
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.login = login;
