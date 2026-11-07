import { Router } from 'express';
import {
  getAllBookings,
  createBooking,
  updateBookingStatus
} from '../controllers/facilityController.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';

const router = Router();

router.get('/', authenticateToken, getAllBookings);
router.post('/', authenticateToken, createBooking);
router.put('/:id/status', authenticateToken, requireRole(['PENGURUS']), updateBookingStatus);

export default router;
