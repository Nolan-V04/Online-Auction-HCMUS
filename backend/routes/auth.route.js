import express from 'express';
import { sendOtp, verifyOtp } from '@/middlewares/auth.controller.js';

const router = express.Router();

router.post('/signup/send-otp', sendOtp);
router.post('/signup/verify-otp', verifyOtp);

export default router;
