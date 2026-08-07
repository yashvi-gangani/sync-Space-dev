const axios = require('axios');
const FormData = require('form-data');

const PROD_API = 'https://syncspace-backend-44cl.onrender.com/api/v1';

async function runTests() {
  console.log('=== PRODUCTION UPLOAD TEST ===\n');

  // 1. Login
  let token, roomId;
  console.log('[1] Logging in...');
  try {
    const r = await axios.post(`${PROD_API}/auth/login`, {
      email: 'testupload99@example.com',
      password: 'Password123!'
    });
    token = r.data.data.accessToken;
    console.log('    ✔ Logged in, token:', token.slice(0, 20) + '...');
  } catch (e) {
    // Try registering
    console.log('    Login failed, trying register...');
    try {
      const r = await axios.post(`${PROD_API}/auth/register`, {
        name: 'Test User',
        email: `testprod_${Date.now()}@example.com`,
        password: 'Password123!'
      });
      token = r.data.data.accessToken;
      console.log('    ✔ Registered, token:', token.slice(0, 20) + '...');
    } catch (e2) {
      console.error('    ✘ Auth failed:', e2.response?.data || e2.message);
      process.exit(1);
    }
  }

  const headers = { Authorization: `Bearer ${token}` };

  // 2. Create room
  console.log('\n[2] Creating room...');
  try {
    const r = await axios.post(`${PROD_API}/rooms`, {
      name: `ProdTest_${Date.now()}`,
      description: 'Upload test room'
    }, { headers });
    roomId = r.data.data.room._id;
    console.log('    ✔ Room created, id:', roomId);
  } catch (e) {
    console.error('    ✘ Room creation failed:', e.response?.data || e.message);
    process.exit(1);
  }

  // Helper: upload file
  async function uploadFile(name, content, mimeType, endpoint = 'files') {
    const form = new FormData();
    if (endpoint === 'files') form.append('roomId', roomId);
    if (endpoint === 'documents') {
      form.append('roomId', roomId);
      form.append('title', name);
    }
    form.append('file', Buffer.from(content), { filename: name, contentType: mimeType });

    try {
      const r = await axios.post(`${PROD_API}/${endpoint}`, form, {
        headers: { ...form.getHeaders(), ...headers }
      });
      const fileUrl = endpoint === 'files'
        ? r.data.data.file.url
        : r.data.data.document.url;
      console.log(`    ✔ ${name} uploaded → ${fileUrl}`);
      return true;
    } catch (e) {
      console.error(`    ✘ ${name} FAILED:`, e.response?.data || e.message);
      return false;
    }
  }

  // 3. Upload files to /files endpoint
  console.log('\n[3] Uploading files...');
  const results = {};
  results.txt   = await uploadFile('hello.txt', 'hello world', 'text/plain');
  results.pdf   = await uploadFile('sample.pdf', '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF', 'application/pdf');
  results.png   = await uploadFile('pixel.png', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'), 'image/png');
  results.docx  = await uploadFile('test.docx', 'PK\x03\x04', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

  // 4. Upload to /documents endpoint
  console.log('\n[4] Uploading document (PDF)...');
  results.docPdf = await uploadFile('doc.pdf', '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF', 'application/pdf', 'documents');

  // 5. Get room files
  console.log('\n[5] Verifying room files list...');
  try {
    const r = await axios.get(`${PROD_API}/files/room/${roomId}`, { headers });
    const files = r.data.data.files;
    console.log(`    ✔ ${files.length} file(s) in room:`);
    files.forEach(f => console.log(`       - ${f.name} (${f.mimetype})`));
  } catch (e) {
    console.error('    ✘ Get files failed:', e.response?.data || e.message);
  }

  // Summary
  console.log('\n=== RESULTS ===');
  Object.entries(results).forEach(([k, v]) => {
    console.log(`  ${v ? '✔' : '✘'} ${k}`);
  });
  const allPassed = Object.values(results).every(Boolean);
  console.log(allPassed ? '\n✅ ALL UPLOADS PASSED' : '\n❌ SOME UPLOADS FAILED');
}

runTests().catch(console.error);
