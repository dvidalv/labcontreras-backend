const { Router } = require('express');
const { getAllMedicosWhiteList, getAllMedicos, getMedicoById } = require('../controllers/medicos');


const router = Router();

router.get('/whitelist', getAllMedicosWhiteList);
router.get('/', getAllMedicos);
router.get('/:id', getMedicoById);

module.exports = router;


