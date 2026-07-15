async function test() {
  try {
    const baseURL = 'http://localhost:5005/api/v1';
    
    const registerA = await fetch(`${baseURL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User A', email: `a${Date.now()}@a.com`, password: 'password' })
    });
    const aData = await registerA.json();
    console.log(aData); const aToken = aData.data?.accessToken;
    
    const registerB = await fetch(`${baseURL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User B', email: `b${Date.now()}@b.com`, password: 'password' })
    });
    const bData = await registerB.json();
    const bToken = bData.data.accessToken;
    
    const createRoom = await fetch(`${baseURL}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aToken}` },
      body: JSON.stringify({ name: 'Test Public Room', type: 'public', activeMode: 'both' })
    });
    const roomData = await createRoom.json();
    const room = roomData.data.room;
    console.log('Room created:', room.slug);
    
    const getRoom = await fetch(`${baseURL}/rooms/slug/${room.slug}`, {
      headers: { Authorization: `Bearer ${bToken}` }
    });
    console.log('User B getRoomBySlug status:', getRoom.status);
    console.log('User B getRoomBySlug body:', await getRoom.text());
    
    const getSessions = await fetch(`${baseURL}/rooms/${room._id}/sessions`, {
      headers: { Authorization: `Bearer ${bToken}` }
    });
    console.log('User B getRoomSessions status:', getSessions.status);
    console.log('User B getRoomSessions body:', await getSessions.text());
    
  } catch (err) {
    console.error('Setup failed:', err);
  }
}
test();
