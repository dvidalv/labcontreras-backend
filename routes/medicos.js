const { Router } = require('express');
const { getAllMedicos } = require('../controllers/medicos');


const router = Router();

router.get('/', getAllMedicos);

module.exports = router;


