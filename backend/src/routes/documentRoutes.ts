import { Router } from 'express';
import { getAllDocuments, createDocument } from '../controllers/documentController.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';

const router = Router();

router.get('/', authenticateToken, getAllDocuments);
router.post('/', authenticateToken, requireRole(['PENGURUS']), createDocument);

export default router;
