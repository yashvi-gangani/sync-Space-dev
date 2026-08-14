const express = require('express');
const { executeCode, reviewCode } = require('../controllers/execution.controller');
const router = express.Router();

router.post('/', executeCode);
router.post('/review', reviewCode);

module.exports = router;
