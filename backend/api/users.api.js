import express from 'express';
import * as userService from '../services/user.service.js';
import bcrypt from 'bcryptjs';
import { sendOtpEmail } from '../utils/email.js';

const router = express.Router();

async function verifyRecaptcha(token) {
    const secret = process.env.RECAPTCHA_SECRET;
    if (!secret) {
        // Allow a known dev token when secret not set
        return token === 'dev-ok';
    }
    try {
        const resp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ secret, response: token }).toString()
        });
        const data = await resp.json();
        return !!data.success;
    } catch (e) {
        console.error('reCAPTCHA verify error', e);
        return false;
    }
}

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Step 1: Request OTP and create pending user
router.post('/request-otp', async function (req, res) {
    try {
        const { username, password, name, email, dob, address, recaptchaToken } = req.body;

        if (!username || !password || !name || !email || !dob) {
            return res.status(400).json({ result_code: -1, result_message: 'Missing required fields' });
        }

        const okCaptcha = await verifyRecaptcha(recaptchaToken);
        if (!okCaptcha) {
            return res.status(400).json({ result_code: -1, result_message: 'reCAPTCHA verification failed' });
        }

        const existedEmail = await userService.findByEmail(email);
        if (existedEmail) {
            return res.status(409).json({ result_code: -1, result_message: 'Email already in use' });
        }
        const existedUsername = await userService.findByUsername(username);
        if (existedUsername) {
            return res.status(409).json({ result_code: -1, result_message: 'Username already in use' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const otp = generateOtp();
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        const userRow = {
            username,
            password: hashed,
            name,
            email,
            dob, // expecting yyyy-mm-dd
            address: address || null,
            is_email_verified: false,
            otp_code: otp,
            otp_expires_at: expires,
            status: 1,
            role_id: 1
        };

        const inserted = await userService.add(userRow);
        const id = inserted?.[0]?.id || inserted?.id;

        // Send OTP email
        const emailResult = await sendOtpEmail(email, otp, name);
        
        if (!emailResult.success) {
            console.error('Failed to send OTP email:', emailResult.error);
            // In dev mode, show OTP preview if email fails
            return res.status(200).json({
                result_code: 0,
                result_message: 'Lỗi gửi email. Liên hệ admin để nhận OTP.',
                user_id: id,
                otp_preview: process.env.NODE_ENV !== 'production' ? otp : undefined
            });
        }

        // Email sent successfully - don't show OTP
        return res.status(200).json({
            result_code: 0,
            result_message: 'Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.',
            user_id: id
        });
    } catch (err) {
        console.error('/api/users/request-otp error', err);
        return res.status(500).json({ result_code: -1, result_message: err.message });
    }
});

// Step 2: Verify OTP
router.post('/verify-otp', async function (req, res) {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ result_code: -1, result_message: 'Missing email or otp' });
        }
        const user = await userService.findByEmail(email);
        if (!user) {
            return res.status(404).json({ result_code: -1, result_message: 'User not found' });
        }
        if (user.is_email_verified) {
            return res.status(200).json({ result_code: 0, result_message: 'Email already verified' });
        }
        if (!user.otp_code || !user.otp_expires_at) {
            return res.status(400).json({ result_code: -1, result_message: 'OTP not requested' });
        }
        const now = new Date();
        const expires = new Date(user.otp_expires_at);
        if (now > expires) {
            return res.status(400).json({ result_code: -1, result_message: 'OTP expired' });
        }
        if (String(user.otp_code) !== String(otp)) {
            return res.status(400).json({ result_code: -1, result_message: 'Invalid OTP' });
        }

        await userService.update(user.id, {
            is_email_verified: true,
            otp_code: null,
            otp_expires_at: null,
            updated_at: new Date()
        });

        return res.status(200).json({ result_code: 0, result_message: 'Email verified successfully' });
    } catch (err) {
        console.error('/api/users/verify-otp error', err);
        return res.status(500).json({ result_code: -1, result_message: err.message });
    }
});

export default router;