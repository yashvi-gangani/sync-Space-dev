const aiService = require('../services/ai.service');

const generateSummary = async (req, res) => {
  try {
    const { id: roomId, sessionId } = req.params;
    const summary = await aiService.generateSessionSummary(sessionId, roomId);
    res.status(200).json({ status: 'success', data: { summary } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  generateSummary
};
