const { Router } = require('express');
const {
  getFilemakerToken,
  getRecords,
} = require('../controllers/filemaker-server');

const router = Router();

router.get('/', getFilemakerToken);
router.post('/records', getRecords);

module.exports = router;
