"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const assetController_1 = require("../controllers/assetController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
// List assets is available to most, but creation/update is restricted
router.get('/', assetController_1.getAssets);
router.use((0, authMiddleware_1.authorize)(['HR_OFFICER', 'SYSTEM_ADMINISTRATOR', 'EXECUTIVE']));
router.post('/', assetController_1.createAsset);
router.patch('/:id', assetController_1.updateAsset);
exports.default = router;
