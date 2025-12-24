import express from 'express';
import * as userService from '../services/user.service.js';
const router = express.Router();

router.post('/signup', async function (req, res) {
    try {
        const { name, email, password, address } = req.body;

        if (!name || !email || !password || !address) {
            return res.status(400).json({
                result_code: 1,
                result_message: 'Missing required fields'
            });
        }
        const existingUser = await userService.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                result_code: 1,
                result_message: 'Email already in use'
            });
        }
        const newUser = await userService.createUser({ name, email, password, address });
        return res.status(201).json({
            result_code: 0,
            result_message: 'User created successfully',
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                address: newUser.address
            }
        });
    } catch (err) {
        console.error('/api/users/signup error', err);
        return res.status(500).json({
            result_code: 1,
            result_message: 'Internal server error'
        });
    }
});

export default router;