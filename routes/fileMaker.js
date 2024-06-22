const { Router } = require('express');
const {
  getFilemakerToken,
  getRecords,
  getRecordByName,
  downloadPDF
} = require('../controllers/filemaker-server');

const router = Router();

router.get('/', getFilemakerToken);
router.post('/records', getRecords);
router.post('/record', getRecordByName);
router.post('/download', downloadPDF);

module.exports = router;
