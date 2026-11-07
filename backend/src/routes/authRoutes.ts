import { Router } from 'express';
import { login, register, getProfile } from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticateToken, getProfile);

export default router;
