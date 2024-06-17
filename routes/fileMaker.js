const { Router } = require('express');
const { getFilemakerToken } = require('../controllers/filemaker-server');

const router = Router();

router.get('/', getFilemakerToken);

module.exports = router;
