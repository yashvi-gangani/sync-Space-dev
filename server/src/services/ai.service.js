const axios = require('axios');
const Session = require('../models/Session');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');

class AIService {
  async generateSessionSummary(sessionId, roomId) {
    const session = await Session.findOne({ _id: sessionId, room: roomId }).populate('startedBy participants', 'name email');
    if (!session) throw new Error('Session not found');

    if (session.aiSummary) {
      return session.aiSummary; // Return cached summary
    }

    const messages = await ChatMessage.find({
      room: roomId,
      createdAt: { $gte: session.startedAt, $lte: session.endedAt || new Date() }
    }).populate('sender', 'name').sort({ createdAt: 1 });

    const chatText = messages.map(m => `${m.sender?.name || 'Unknown'}: ${m.content}`).join('\n');
    const participantsList = session.participants.map(p => p.name).join(', ');

    const prompt = `You are an AI assistant for a collaborative workspace called SyncSpace.
Please generate a concise, professional summary of the following collaboration session.
Highlight the main topics discussed, what was accomplished, and what code was written.

Session Information:
Duration: ${session.duration} seconds
Participants: ${participantsList}
Language: ${session.editorLanguage}

Code Snapshot at end of session:
\`\`\`${session.editorLanguage}
${session.editorSnapshot || '(No code)'}
\`\`\`

Chat transcript during session:
${chatText || '(No chat messages)'}

Provide the summary formatted as Markdown. Include a section for "Key Highlights" and "Code Summary" if applicable. Do not write any code yourself, just summarize.`;

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Google Gemini API key not configured.');
      }

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        }
      );

      const summary = response.data.candidates[0].content.parts[0].text;
      
      session.aiSummary = summary;
      await session.save();
      
      return summary;
    } catch (error) {
      console.error('AI Summary Error:', error.response?.data || error.message);
      throw new Error('Failed to generate AI summary.');
    }
  }
}

module.exports = new AIService();
