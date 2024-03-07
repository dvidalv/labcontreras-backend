const { Router } = require('express');
const { validateUser } = require('../models/user');
const authenticateToken  = require('../middlewares/auth');
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
router.get('/verifyToken', authenticateToken, getCurrentUser);
router.post('/signup', validateUser, createUser);

// Rutas de usuarios
router.route('/').get(getAllUsers);

router
  .route('/me')
  .get(getCurrentUser)
  .patch(updateProfile);

router.route('/me/avatar').patch(updateAvatar);

// Rutas para operaciones específicas de usuario
router
  .route('/:id')
  .get(getUserById)
  .delete(deleteUser);

module.exports = router;
