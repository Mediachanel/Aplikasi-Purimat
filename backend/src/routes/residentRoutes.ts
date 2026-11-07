import { Router } from 'express';
import {
  getAllResidents,
  getResidentById,
  createResident,
  updateResident,
  deleteResident
} from '../controllers/residentController.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';

const router = Router();

router.get('/', authenticateToken, getAllResidents);
router.get('/:id', authenticateToken, getResidentById);
router.post('/', authenticateToken, requireRole(['PENGURUS']), createResident);
router.put('/:id', authenticateToken, requireRole(['PENGURUS']), updateResident);
router.delete('/:id', authenticateToken, requireRole(['PENGURUS']), deleteResident);

export default router;
