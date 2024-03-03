const { Router } = require('express');
const { validateUser } = require('../models/user');
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
} = require('../controllers/users');

const router = Router();

// Rutas de autenticación
router.post('/signin', login);
router.post('/signup', validateUser, createUser);

// Rutas de usuarios
router.route('/').get(getAllUsers);

router
  .route('/me')
  .get(authenticateToken, getCurrentUser)
  .patch(authenticateToken, updateProfile);

router.route('/me/avatar').patch(authenticateToken, updateAvatar);

// Rutas para operaciones específicas de usuario
router
  .route('/:id')
  .get(authenticateToken, getUserById)
  .delete(authenticateToken, deleteUser);

module.exports = router;
