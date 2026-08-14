const express = require('express');
const router = express.Router();
const replayController = require('../controllers/replay.controller');
const { protect } = require('../middlewares/auth');

router.use(protect);
router.get('/:roomId/sessions/:sessionId', replayController.getReplay);
router.post('/:roomId/sessions/:sessionId/summary', replayController.generateSummary);
router.get('/:roomId/sessions/:sessionId/analytics', replayController.getAnalytics);
router.get('/:roomId/snapshots', replayController.getSnapshots);

module.exports = router;
