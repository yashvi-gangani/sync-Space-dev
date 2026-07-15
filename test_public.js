const axios = require('axios');
const mongoose = require('mongoose');

async function testPublic() {
  try {
    // We will connect to DB to create a test user and public room
    await mongoose.connect('mongodb://localhost:27017/syncspace');
    const User = require('./server/src/models/User');
    const Room = require('./server/src/models/Room');

    // Setup User A
    let userA = await User.findOne({ email: 'test_a@test.com' });
    if (!userA) userA = await User.create({ name: 'User A', email: 'test_a@test.com', password: 'password123' });

    // Setup User B
    let userB = await User.findOne({ email: 'test_b@test.com' });
    if (!userB) userB = await User.create({ name: 'User B', email: 'test_b@test.com', password: 'password123' });

    // User A creates public room
    const room = await Room.create({
      name: 'Public Test',
      type: 'public',
      owner: userA._id,
      members: [{ user: userA._id, role: 'owner' }],
      slug: 'testpub1'
    });

    // Simulate User B calling getRoomBySlug in room.service
    const roomService = require('./server/src/services/room.service');
    
    console.log('Fetching public room for User B...');
    const fetchedRoom = await roomService.getRoomBySlug('testpub1', userB._id);
    console.log('Room fetched. Members:', fetchedRoom.members.map(m => m.user.toString()));
    console.log('Does User B exist in members?', fetchedRoom.members.some(m => m.user.toString() === userB._id.toString()));

    await Room.deleteOne({ _id: room._id });
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}
testPublic();
