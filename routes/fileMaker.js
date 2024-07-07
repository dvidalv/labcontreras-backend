const { Router } = require('express');
const {
  getFilemakerToken,
  getRecords,
  getRecordByName,
  getMail,
  getPublicaciones,
  getAllPublicaciones
} = require('../controllers/filemaker-server');

const router = Router();

router.get('/', getFilemakerToken);
router.post('/records', getRecords);
router.post('/record', getRecordByName);
router.post('/get-filemaker-data', getMail);
router.post('/', getAllPublicaciones);

module.exports = router;
