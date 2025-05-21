const { Router } = require('express');
const {
  validateUser,
  validateForgotPassword,
  validateResetPassword,
} = require('../models/user');
const authenticateToken = require('../middlewares/auth');
const {
  getAllUsers,
  getUserById,
  createUser,
  deleteUser,
  updateProfile,
  updateAvatar,
  login,
  getCurrentUser,
  updateUser,
  deleteImage,
  hasAdmin,
  forgotPassword,
  resetPassword,
  updateStatus,
} = require('../controllers/users');

const router = Router();

// Rutas de autenticación
router.post('/signin', login);
router.get('/verifyToken', authenticateToken, getCurrentUser);
router.post('/signup', validateUser, createUser);

// Rutas de recuperación de contraseña
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);

// Rutas de usuarios
router.route('/').get(getAllUsers);
router.route('/check-admin').get(hasAdmin);
router.patch('/:id/status', authenticateToken, updateStatus);

router.route('/me').get(getCurrentUser).patch(updateProfile);
router.put('/update', authenticateToken, updateUser);

router.route('/me/avatar').patch(updateAvatar);
router.route('/me/image/delete').delete(deleteImage);

// Rutas para operaciones específicas de usuario
router.route('/:id').get(getUserById).delete(authenticateToken, deleteUser);

module.exports = router;
