const { Router } = require('express');
const {
  getAllMedicosWhiteList,
  getAllMedicos,
  getMedicoById,
  createMedico,
  deleteMedico,
  editMedico,
} = require('../controllers/medicos');

const {
  signinMedico,
  getFilemakerToken,
} = require('../controllers/filemaker-server');

const { validateMedico } = require('../models/medico');

const router = Router();

router.get('/whitelist', getAllMedicosWhiteList);
router.get('/', getAllMedicos);
router.get('/:id', getMedicoById);
router.delete('/:id', deleteMedico);
router.post('/', validateMedico, createMedico);
router.put('/:id/edit', editMedico);
router.post('/signin', signinMedico);
router.get('/refreshToken', getFilemakerToken);

module.exports = router;
