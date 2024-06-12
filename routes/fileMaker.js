const { Router } = require('express');
const { getFilemakerData } = require('../controllers/filemaker-server');

const router = Router();

router.post('/filemaker', getFilemakerData);

module.exports = router;
