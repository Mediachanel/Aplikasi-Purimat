import { Router } from 'express';
import { getAllAnnouncements, createAnnouncement } from '../controllers/announcementController.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';

const router = Router();

router.get('/', authenticateToken, getAllAnnouncements);
router.post('/', authenticateToken, requireRole(['PENGURUS']), createAnnouncement);

export default router;
