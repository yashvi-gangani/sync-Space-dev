const express = require('express');
const { executeCode } = require('../controllers/execution.controller');
const router = express.Router();

router.post('/', executeCode); /// while path is ,create

module.exports = router;
