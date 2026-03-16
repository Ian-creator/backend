"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const hrRoutes_1 = __importDefault(require("./routes/hrRoutes"));
const attendanceRoutes_1 = __importDefault(require("./routes/attendanceRoutes"));
const assetRoutes_1 = __importDefault(require("./routes/assetRoutes"));
const workplanRoutes_1 = __importDefault(require("./routes/workplanRoutes"));
const timesheetRoutes_1 = __importDefault(require("./routes/timesheetRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const messageRoutes_1 = __importDefault(require("./routes/messageRoutes"));
const leaveRoutes_1 = __importDefault(require("./routes/leaveRoutes"));
const holidayRoutes_1 = __importDefault(require("./routes/holidayRoutes"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const app = (0, express_1.default)();
// Middleware
app.use((0, helmet_1.default)());
const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
};
app.use((0, cors_1.default)(corsOptions));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/hr', hrRoutes_1.default);
app.use('/api/attendance', attendanceRoutes_1.default);
app.use('/api/assets', assetRoutes_1.default);
app.use('/api/workplans', workplanRoutes_1.default);
app.use('/api/timesheets', timesheetRoutes_1.default);
app.use('/api/reports', reportRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.use('/api/messages', messageRoutes_1.default);
app.use('/api/leaves', leaveRoutes_1.default);
app.use('/api/holidays', holidayRoutes_1.default);
app.use('/api/projects', projectRoutes_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Basic Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});
exports.default = app;
