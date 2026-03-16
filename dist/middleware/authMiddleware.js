"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const authenticate = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'No token, authorization denied' });
    }
    const secret = process.env.JWT_SECRET || 'secret';
    try {
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error(`Auth failed for token: ${token.substring(0, 10)}... Error:`, error.message);
        res.status(401).json({ error: 'Token is not valid' });
    }
};
exports.authenticate = authenticate;
const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(403).json({ error: 'Access denied: Insufficient permissions' });
        }
        if (req.user.role === 'SYSTEM_ADMINISTRATOR' || roles.includes(req.user.role)) {
            return next();
        }
        return res.status(403).json({ error: 'Access denied: Insufficient permissions' });
    };
};
exports.authorize = authorize;
