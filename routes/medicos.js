const { Router } = require('express');
const {
  getAllMedicosWhiteList,
  getAllMedicos,
  getMedicoById,
  createMedico,
  updateMedico,
  deleteMedico,
  verifyUser,
} = require('../controllers/medicos');
const { validateMedico } = require('../models/medico');

const router = Router();

router.get('/whitelist', getAllMedicosWhiteList);
router.get('/', getAllMedicos);
router.get('/:id', getMedicoById);
router.put('/:id', updateMedico);
router.delete('/:id', deleteMedico);
router.post('/', validateMedico, createMedico);
router.put('/:id/update', verifyUser, updateMedico);

module.exports = router;
