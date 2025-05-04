import express from 'express';
import { registerUser, loginUser, getUserProfile, getAllBuyers } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.get('/buyers', protect, getAllBuyers);

export default router;