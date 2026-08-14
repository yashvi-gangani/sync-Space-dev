const Session = require('../models/Session');
const Room = require('../models/Room');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { uploadToCloudinary } = require('../middlewares/upload');

exports.startRecording = catchAsync(async (req, res, next) => {
  const { id: roomId, sessionId } = req.params;
  const room = await Room.findById(roomId);
  
  if (!room) return next(new AppError('Room not found', 404));
  if (room.owner.toString() !== req.user.id) {
    return next(new AppError('Only the room owner can start recording', 403));
  }

  const session = await Session.findOne({ _id: sessionId, room: roomId });
  if (!session) return next(new AppError('Session not found', 404));

  session.recordingStatus = 'recording';
  session.recordedBy = req.user.id;
  await session.save();

  // Broadcast to all participants that recording has started
  const io = req.app.get('io');
  if (io) {
    io.to(roomId).emit('recording:started', { sessionId });
  }

  res.status(200).json({ status: 'success', data: { session } });
});

exports.saveRecording = catchAsync(async (req, res, next) => {
  const { id: roomId, sessionId } = req.params;
  
  const room = await Room.findById(roomId);
  if (!room) return next(new AppError('Room not found', 404));
  if (room.owner.toString() !== req.user.id) {
    return next(new AppError('Only the room owner can save recording', 403));
  }

  const session = await Session.findOne({ _id: sessionId, room: roomId });
  if (!session) return next(new AppError('Session not found', 404));

  if (!req.file) {
    session.recordingStatus = 'failed';
    await session.save();
    return next(new AppError('No recording file provided', 400));
  }

  try {
    const result = await uploadToCloudinary(req.file.buffer, 'recordings', {
      resource_type: 'video'
    });

    session.recordingUrl = result.secure_url;
    session.recordingStatus = 'completed';
    await session.save();

    const io = req.app.get('io');
    if (io) {
      io.to(roomId).emit('recording:stopped', { sessionId, recordingUrl: session.recordingUrl });
    }

    res.status(200).json({ status: 'success', data: { session } });
  } catch (error) {
    console.error('Failed to upload recording:', error);
    session.recordingStatus = 'failed';
    await session.save();
    return next(new AppError('Failed to upload recording', 500));
  }
});
