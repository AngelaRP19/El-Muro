const axios = require('axios');

async function run() {
  try {
    console.log('Logging in...');
    const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
      correo: 'student_demo@uptc.edu.co',
      password: 'password123'
    });
    const token = loginRes.data.token;
    console.log('Logged in successfully. Token:', token);

    const headers = { Authorization: `Bearer ${token}` };

    console.log('Fetching feed...');
    const feedRes = await axios.get('http://localhost:8002/api/posts/feed/latest', { headers });
    const feed = feedRes.data;
    console.log(`Feed fetched. Found ${feed.length} posts.`);

    const blockedPost = feed.find(p => p.blocked);
    if (!blockedPost) {
      console.log('No blocked post found in feed! Here is the feed:', feed);
      return;
    }

    const initialPointsRes = await axios.get('http://localhost:3000/api/auth/me/puntos', { headers });
    console.log('Initial Points:', initialPointsRes.data);

    console.log(`Trying to unlock post ID ${blockedPost.id} ("${blockedPost.title}")...`);
    try {
      const viewRes = await axios.post(`http://localhost:8002/api/posts/${blockedPost.id}/view`, {}, { headers });
      console.log('SUCCESS! Post unlocked:', viewRes.data);

      const finalPointsRes = await axios.get('http://localhost:3000/api/auth/me/puntos', { headers });
      console.log('Final Points after unlock:', finalPointsRes.data);
    } catch (err) {
      console.error('ERROR ON VIEW POST ENDPOINT:');
      if (err.response) {
        console.error('Status:', err.response.status);
        console.error('Data:', JSON.stringify(err.response.data, null, 2));
      } else {
        console.error(err.message);
      }
    }
  } catch (err) {
    console.error('Global error:', err.message);
  }
}

run();
