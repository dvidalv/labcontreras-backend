const { Router } = require('express');
const {
  getFilemakerToken,
  getRecords,
  getRecordByName,
} = require('../controllers/filemaker-server');

const router = Router();

router.get('/', getFilemakerToken);
router.post('/records', getRecords);
router.post('/record', getRecordByName);

module.exports = router;
