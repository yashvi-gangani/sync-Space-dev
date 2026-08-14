const ReplayHistory = require('../models/ReplayHistory');
const WhiteboardSnapshot = require('../models/WhiteboardSnapshot');
const Room = require('../models/Room');
const Session = require('../models/Session');
const AppError = require('../utils/AppError');
const cloudinary = require('../config/cloudinary');
const axios = require('axios');

class ReplayService {
  async resolveRoom(roomIdOrSlug) {
    const byId = /^[0-9a-fA-F]{24}$/.test(String(roomIdOrSlug))
      ? await Room.findById(roomIdOrSlug)
      : null;
    return byId || Room.findOne({ slug: roomIdOrSlug, isActive: true });
  }

  async getReplay(roomId, sessionId, userId) {
    const room = await this.resolveRoom(roomId);
    if (!room) throw new AppError('Room not found', 404);
    const isMember = room.members.some((m) => m.user.toString() === userId.toString());
    if (!isMember) throw new AppError('Access denied', 403);

    const replay = await ReplayHistory.findOne({ room: room._id, session: sessionId })
      .populate('events.userId', 'name avatar');

    if (!replay) throw new AppError('No replay data found for this session', 404);
    return replay;
  }

  async generateSummary(roomIdOrSlug, sessionId, userId) {
  const replay = await this.getReplay(roomIdOrSlug, sessionId, userId);
  const events = replay.events || [];

  const counts = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {});

  const participants = [...new Set(
    events.map((event) => event.userName).filter(Boolean)
  )];

  const fallback = {
    title: 'Collaboration Session Summary',
    summary: participants.length
      ? `${participants.join(', ')} collaborated in this session.`
      : 'The session contains recorded collaboration events.',
    highlights: [
      `${events.length} recorded events`,
      participants.length
        ? `${participants.length} participant${participants.length === 1 ? '' : 's'}`
        : 'Participant names were not captured',
      ...Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(
          ([type, count]) =>
            `${type.replace(/_/g, ' ')}: ${count}`
        ),
    ],
    participants,
    eventCounts: counts,
    generatedBy: 'local-fallback',
  };

  // Gemini API key not configured
  if (!process.env.GEMINI_API_KEY) {
    return fallback;
  }

  try {
    const compactEvents = events.slice(0, 400).map((event) => ({
      type: event.type,
      userName: event.userName,
      data:
        event.type === 'chat'
          ? {
              content: String(event.data?.content || '').slice(0, 300),
            }
          : event.data,
    }));

    const prompt = `
You are an AI assistant that summarizes collaborative software development sessions.

Analyze the following SyncSpace collaboration session.

Return ONLY valid JSON in exactly this structure:

{
  "title": "short session title",
  "summary": "2-4 sentence summary of what happened",
  "highlights": [
    "important activity or achievement"
  ],
  "participants": ["participant names"],
  "eventCounts": {
    "event_type": 0
  }
}

Rules:
- Do not invent actions.
- Only mention activities present in the supplied events.
- Keep the summary concise and useful.
- Mention important coding, whiteboard, chat, meeting, or collaboration activity when present.
- Use the supplied participant names.
- Return JSON only.
- Do not use markdown.

Session data:

${JSON.stringify({
  participants,
  eventCounts: counts,
  events: compactEvents,
})}
`;

    const model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );

    const text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      throw new Error('Gemini returned an empty response.');
    }

    const parsed = JSON.parse(text);

    return {
      ...fallback,
      ...parsed,
      generatedBy: 'gemini',
    };
  } catch (err) {
    console.warn(
      'Gemini session summary fallback:',
      err.response?.data || err.message || err
    );

    return fallback;
  }
}

  // builds the "Session Analytics Dashboard" numbers straight from the events
  // we already record for replay, so this needs no extra tracking anywhere
  async getAnalytics(roomIdOrSlug, sessionId, userId) {
    const replay = await this.getReplay(roomIdOrSlug, sessionId, userId);
    const session = await Session.findById(sessionId).populate('participants', 'name');
    const events = replay.events || [];

    const whiteboardDrawings = events.filter((e) => e.type === 'whiteboard').length;
    const codeChanges = events.filter((e) => e.type === 'editor_update').length;
    const chatMessages = events.filter((e) => e.type === 'chat').length;
    const codeRuns = events.filter((e) => e.type === 'code_run').length;

    // tally how many events each person triggered, so we can name the most active user
    const perUser = {};
    events.forEach((e) => {
      if (!e.userName) return;
      perUser[e.userName] = (perUser[e.userName] || 0) + 1;
    });
    const mostActiveUser = Object.entries(perUser).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const durationSeconds = session?.duration
      || (session?.endedAt ? Math.round((new Date(session.endedAt) - new Date(session.startedAt)) / 1000) : 0);

    return {
      durationSeconds,
      whiteboardDrawings,
      codeChanges,
      chatMessages,
      codeRuns,
      participantCount: session?.participants?.length || 0,
      mostActiveUser,
      totalEvents: events.length,
    };
  }

  async appendEvents(roomId, sessionId, events) {
    const timestampedEvents = events.map((e) => ({ ...e, timestamp: e.timestamp || Date.now() }));
    const [replay] = await Promise.all([
      ReplayHistory.findOneAndUpdate(
        { room: roomId, session: sessionId },
        {
          $push: { events: { $each: timestampedEvents } },
          $inc: { eventCount: timestampedEvents.length },
          $set: { totalDuration: timestampedEvents[timestampedEvents.length - 1]?.timestamp || 0 },
        },
        { upsert: true, new: true }
      ),
      Session.findByIdAndUpdate(sessionId, {
        $inc: { eventCount: timestampedEvents.length },
      }),
    ]);
    return replay;
  }

  async saveSnapshot(roomId, sessionId, userId, { imageBuffer, canvasData, width, height }) {
    const result = await cloudinary.uploader.upload_stream(
      { folder: 'syncspace/snapshots', resource_type: 'image' },
      async (error, uploadResult) => {
        if (error) throw error;
        return WhiteboardSnapshot.create({
          room: roomId,
          session: sessionId,
          savedBy: userId,
          imageUrl: uploadResult.secure_url,
          imagePublicId: uploadResult.public_id,
          canvasData,
          width,
          height,
          elementCount: Array.isArray(canvasData?.shapes) ? canvasData.shapes.length : 0,
        });
      }
    );
    return result;
  }

  async getSnapshots(roomId, userId) {
    const room = await this.resolveRoom(roomId);
    if (!room) throw new AppError('Room not found', 404);
    const isMember = room.members.some((m) => m.user.toString() === userId.toString());
    if (!isMember) throw new AppError('Access denied', 403);

    return WhiteboardSnapshot.find({ room: room._id })
      .populate('savedBy', 'name avatar')
      .populate('session', 'startedAt endedAt')
      .sort({ createdAt: -1 })
      .limit(20);
  }
}

module.exports = new ReplayService();
