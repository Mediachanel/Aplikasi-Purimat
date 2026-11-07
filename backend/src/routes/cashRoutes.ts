import { Router } from 'express';
import {
  getAllCashTransactions,
  getCashSummary,
  createCashTransaction
} from '../controllers/cashController.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';

const router = Router();

router.get('/', authenticateToken, getAllCashTransactions);
router.get('/summary', authenticateToken, getCashSummary);
router.post('/', authenticateToken, requireRole(['PENGURUS']), createCashTransaction);

export default router;
