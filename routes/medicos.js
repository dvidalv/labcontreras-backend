const { Router } = require('express');
const {
  getAllMedicosWhiteList,
  getAllMedicos,
  getMedicoById,
  createMedico,
  deleteMedico,
  editMedico,
  verifyIdentity
} = require('../controllers/medicos');
const { validateMedico } = require('../models/medico');

const router = Router();

router.get('/whitelist', getAllMedicosWhiteList);
router.get('/', getAllMedicos);
router.get('/:id', getMedicoById);
router.delete('/:id', deleteMedico);
router.post('/', validateMedico, createMedico);
router.put('/:id/edit', verifyIdentity, editMedico);

module.exports = router;
