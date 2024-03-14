const { Router } = require('express');
const { getAllMedicosWhiteList, getAllMedicos } = require('../controllers/medicos');


const router = Router();

router.get('/whitelist', getAllMedicosWhiteList);
router.get('/', getAllMedicos);

module.exports = router;


