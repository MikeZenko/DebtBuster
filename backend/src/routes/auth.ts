import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/errorHandler';
import { registerSchema, loginSchema } from '../services/authService';
import { z } from 'zod';

const router = Router();

// Validation schemas for routes
const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  onboardingCompleted: z.boolean().optional(),
});

// Public routes (no authentication required)
router.post('/register', validateBody(registerSchema), AuthController.register);
router.post('/login', validateBody(loginSchema), AuthController.login);
router.post('/refresh', validateBody(refreshTokenSchema), AuthController.refresh);
router.get('/health', AuthController.health);

// Protected routes (authentication required)
router.use(authenticate);

router.post('/logout', validateBody(refreshTokenSchema), AuthController.logout);
router.get('/profile', AuthController.getProfile);
router.patch('/profile', validateBody(updateProfileSchema), AuthController.updateProfile);
router.post('/change-password', validateBody(changePasswordSchema), AuthController.changePassword);
router.get('/verify', AuthController.verifyToken);
router.get('/stats', AuthController.getUserStats);

export default router;
