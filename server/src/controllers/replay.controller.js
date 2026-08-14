const replayService = require('../services/replay.service');
const catchAsync = require('../utils/catchAsync');

const getReplay = catchAsync(async (req, res) => {
  const replay = await replayService.getReplay(req.params.roomId, req.params.sessionId, req.user.id);
  res.json({ success: true, data: { replay } });
});

const getSnapshots = catchAsync(async (req, res) => {
  const snapshots = await replayService.getSnapshots(req.params.roomId, req.user.id);
  res.json({ success: true, data: { snapshots } });
});

const generateSummary = catchAsync(async (req, res) => {
  const summary = await replayService.generateSummary(
    req.params.roomId,
    req.params.sessionId,
    req.user.id
  );
  res.json({ success: true, data: { summary } });
});

const getAnalytics = catchAsync(async (req, res) => {
  const analytics = await replayService.getAnalytics(
    req.params.roomId,
    req.params.sessionId,
    req.user.id
  );
  res.json({ success: true, data: { analytics } });
});

module.exports = { getReplay, getSnapshots, generateSummary, getAnalytics };
