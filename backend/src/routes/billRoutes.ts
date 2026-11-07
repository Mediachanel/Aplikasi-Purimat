import { Router } from 'express';
import {
  getAllBills,
  getBillsByResident,
  getBillsSummary,
  payBill,
  generateMonthlyBills
} from '../controllers/billController.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';

const router = Router();

router.get('/', authenticateToken, getAllBills);
router.get('/summary', authenticateToken, getBillsSummary);
router.get('/resident/:residentId', authenticateToken, getBillsByResident);
router.post('/:id/pay', authenticateToken, payBill);
router.post('/generate-monthly', authenticateToken, requireRole(['PENGURUS']), generateMonthlyBills);

export default router;
