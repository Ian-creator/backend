"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const workplanController_1 = require("../controllers/workplanController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.use(authMiddleware_1.authenticate);
router.post('/upload', upload.single('file'), workplanController_1.uploadWorkplan);
router.get('/', workplanController_1.getWorkplans);
exports.default = router;
