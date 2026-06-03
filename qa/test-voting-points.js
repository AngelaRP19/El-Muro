const axios = require('axios');

const AUTH_BASE = 'http://localhost:3000/api/auth';
const POSTS_BASE = 'http://localhost:8002/api/posts';

async function testVotingPoints() {
  console.log('🧪 Starting Point Awards on Likes Verification...');

  try {
    // 1. Authenticate users
    console.log('Logging in student_demo and david.rodriguez26...');
    const tokenDemo = await axios.post(`${AUTH_BASE}/login`, {
      correo: 'student_demo@uptc.edu.co',
      password: 'password123'
    }).then(res => res.data.token);

    const tokenDavid = await axios.post(`${AUTH_BASE}/login`, {
      correo: 'david.rodriguez26@uptc.edu.co',
      password: 'password123'
    }).then(res => res.data.token);

    const headersDemo = { headers: { Authorization: `Bearer ${tokenDemo}` } };
    const headersDavid = { headers: { Authorization: `Bearer ${tokenDavid}` } };

    // 2. Fetch David's initial points
    const davidInitialRes = await axios.get(`${AUTH_BASE}/me/puntos`, headersDavid);
    const initialPoints = davidInitialRes.data.puntos;
    console.log(`David's initial points: ${initialPoints}`);

    // 3. Find one of David's posts (e.g. Post 1 "Guía completa de Matrices" seeded earlier)
    console.log('Fetching latest feed...');
    const feedRes = await axios.get(`${POSTS_BASE}/feed/latest`, headersDemo);
    // Find a post authored by David (authorId matches David's user ID from me)
    const meDavid = await axios.get(`${AUTH_BASE}/me`, headersDavid);
    const davidId = meDavid.data.user.id;
    console.log(`David's User ID: ${davidId}`);

    const davidPost = feedRes.data.find(p => p.authorId === davidId);
    if (!davidPost) {
      throw new Error('No post authored by David found in feed! Run node qa/seed.js first.');
    }

    console.log(`Found David's post: "${davidPost.title}" (ID: ${davidPost.id}, Current Likes: ${davidPost.votes})`);

    // 4. student_demo likes David's post
    console.log(`student_demo liking David's post ${davidPost.id}...`);
    const voteRes = await axios.post(`${POSTS_BASE}/${davidPost.id}/vote`, {}, headersDemo);
    console.log(`Post updated likes: ${voteRes.data.votes}`);

    // 5. Fetch David's updated points
    const davidFinalRes = await axios.get(`${AUTH_BASE}/me/puntos`, headersDavid);
    const finalPoints = davidFinalRes.data.puntos;
    console.log(`David's final points: ${finalPoints}`);

    const difference = finalPoints - initialPoints;
    console.log(`Points difference: ${difference}`);

    if (difference === 3) {
      console.log('✅ PASS: David correctly received 3 points for the like on his post!');
    } else {
      console.error(`❌ FAIL: Expected difference to be 3, got ${difference}`);
      process.exit(1);
    }

  } catch (err) {
    console.error('💥 Verification Failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

testVotingPoints();
