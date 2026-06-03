const axios = require('axios');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const BASE_URL_AUTH = 'http://localhost:3000/api/auth';
const BASE_URL_TOPICS = 'http://localhost:8000/api/v1/topics';
const BASE_URL_CAREER = 'http://localhost:8001/api/carreras';
const BASE_URL_POSTS = 'http://localhost:8002/api/posts';

const MONGO_URL = 'mongodb://localhost:27017/auth_service';
const DB_NAME = 'auth_service';

async function runE2ETests() {
  console.log('🏁 Starting E2E Transversal Integration Test...');
  let hasFailed = false;

  const assert = (condition, message) => {
    if (!condition) {
      console.error(`❌ Assertion Failed: ${message}`);
      hasFailed = true;
      throw new Error(`Assertion Failed: ${message}`);
    } else {
      console.log(`✅ Assertion Passed: ${message}`);
    }
  };

  try {
    // 1. Database setup: Insert clean test users
    console.log('\n--- PHASE 1: Database Setup ---');
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    const db = client.db(DB_NAME);

    const hashedPassword = await bcrypt.hash('password123', 10);
    const now = new Date();

    console.log('Ensuring clean test users in auth database...');

    // Student A
    await db.collection('users').updateOne(
      { correo: 'student_a@uptc.edu.co' },
      { 
        $set: { 
          nombre: 'Student A Initial',
          correo: 'student_a@uptc.edu.co',
          password: hashedPassword,
          rol: 'estudiante',
          apodo: 'student_a_initial',
          puntos: 7,
          estaActivo: true,
          isVerified: true,
          failedLoginAttempts: 0,
          lockUntil: null,
          twoFactorEnabled: false,
          createdAt: now,
          updatedAt: now
        }
      },
      { upsert: true }
    );

    // Student B
    await db.collection('users').updateOne(
      { correo: 'student_b@uptc.edu.co' },
      { 
        $set: { 
          nombre: 'Student B',
          correo: 'student_b@uptc.edu.co',
          password: hashedPassword,
          rol: 'estudiante',
          apodo: 'student_b',
          puntos: 7,
          estaActivo: true,
          isVerified: true,
          failedLoginAttempts: 0,
          lockUntil: null,
          twoFactorEnabled: false,
          createdAt: now,
          updatedAt: now
        }
      },
      { upsert: true }
    );

    // Admin
    await db.collection('users').updateOne(
      { correo: 'admin_e2e@uptc.edu.co' },
      { 
        $set: { 
          nombre: 'Admin E2E',
          correo: 'admin_e2e@uptc.edu.co',
          password: hashedPassword,
          rol: 'admin',
          apodo: 'admin_e2e',
          puntos: 7,
          estaActivo: true,
          isVerified: true,
          failedLoginAttempts: 0,
          lockUntil: null,
          twoFactorEnabled: false,
          createdAt: now,
          updatedAt: now
        }
      },
      { upsert: true }
    );

    await client.close();
    console.log('DB Seeded successfully.');

    // 2. Obtain JWTs
    console.log('\n--- PHASE 2: Authentication ---');
    
    const login = async (correo, password) => {
      const res = await axios.post(`${BASE_URL_AUTH}/login`, { correo, password });
      return res.data.token;
    };

    const tokenA = await login('student_a@uptc.edu.co', 'password123');
    const tokenB = await login('student_b@uptc.edu.co', 'password123');
    const tokenAdmin = await login('admin_e2e@uptc.edu.co', 'password123');

    assert(tokenA && tokenB && tokenAdmin, 'Successfully logged in all three users.');

    const headersA = { headers: { Authorization: `Bearer ${tokenA}` } };
    const headersB = { headers: { Authorization: `Bearer ${tokenB}` } };
    const headersAdmin = { headers: { Authorization: `Bearer ${tokenAdmin}` } };
    const headersAdminWithRole = { 
      headers: { 
        Authorization: `Bearer ${tokenAdmin}`,
        'x-role': 'admin'
      } 
    };

    // 3. Find or Create Career & Topic
    console.log('\n--- PHASE 3: Careers & Topics Check ---');
    
    // Find or create Career
    let careerId = null;
    const careersRes = await axios.get(`${BASE_URL_CAREER}/`, headersB);
    const existingCareer = careersRes.data.find(c => c.nombre === 'Ingeniería de Sistemas');
    if (existingCareer) {
      careerId = existingCareer.id;
      console.log(`Found existing Career "Ingeniería de Sistemas" with ID: ${careerId}`);
    } else {
      console.log('Creating Career "Ingeniería de Sistemas"...');
      const createCareerRes = await axios.post(
        `${BASE_URL_CAREER}/crear`, 
        { nombre: 'Ingeniería de Sistemas', descripcion: 'Sistemas', duracion_semestres: 10 },
        headersAdminWithRole
      );
      careerId = createCareerRes.data.id;
      console.log(`Career created with ID: ${careerId}`);
    }

    // Find or create Topic
    let topicId = null;
    const topicsRes = await axios.get(BASE_URL_TOPICS);
    // Topics items might be directly in response or under .data or .items
    const topicsList = Array.isArray(topicsRes.data) ? topicsRes.data : (topicsRes.data.items || topicsRes.data.data || []);
    const existingTopic = topicsList.find(t => t.name === 'Arquitectura de Software');
    if (existingTopic) {
      topicId = existingTopic.id;
      console.log(`Found existing Topic "Arquitectura de Software" with ID: ${topicId}`);
    } else {
      console.log('Creating Topic "Arquitectura de Software"...');
      const createTopicRes = await axios.post(
        BASE_URL_TOPICS, 
        { name: 'Arquitectura de Software', description: 'Clean architecture', career_id: careerId, materia_id: 1 },
        headersAdmin
      );
      topicId = createTopicRes.data.id;
      console.log(`Topic created with ID: ${topicId}`);
    }

    assert(careerId !== null && topicId !== null, 'Career and Topic are available.');

    // 4. Student A edits profile
    console.log('\n--- PHASE 4: Profile Editing ---');
    console.log('Student A editing profile name and apodo...');
    const editProfileRes = await axios.put(
      `${BASE_URL_AUTH}/profile`,
      { nombre: 'Student A Updated', apodo: 'studenta_new' },
      headersA
    );
    
    assert(editProfileRes.data.user.nombre === 'Student A Updated', 'Name successfully updated in response.');
    assert(editProfileRes.data.user.apodo === 'studenta_new', 'Apodo successfully updated in response.');

    // Fetch /me to verify persistence
    const meRes = await axios.get(`${BASE_URL_AUTH}/me`, headersA);
    assert(meRes.data.user.nombre === 'Student A Updated' && meRes.data.user.apodo === 'studenta_new', 'Profile update persisted successfully.');

    // 5. Student A creates a protected post
    console.log('\n--- PHASE 5: Post Creation ---');
    console.log('Student A creating protected post...');
    const createPostRes = await axios.post(
      BASE_URL_POSTS,
      {
        title: 'E2E Architecture Guide',
        description: 'Una guía sobre clean code',
        textContent: 'SECRET DATA: Las capas internas son independientes del framework.',
        topicId: topicId,
        accessPoints: 3
      },
      headersA
    );

    const postId = createPostRes.data.id;
    console.log(`Created Post with ID: ${postId}`);
    assert(postId !== undefined, 'Post created successfully and returned ID.');

    // 6. Student B fetches feed and finds the post
    console.log('\n--- PHASE 6: Feed Retrieval and Blur Verification ---');
    const feedRes = await axios.get(`${BASE_URL_POSTS}/feed/latest?limit=10`, headersB);
    const postInFeed = feedRes.data.find(p => p.id === postId);

    assert(postInFeed !== undefined, 'Student B found the newly created post in the feed.');
    assert(postInFeed.blocked === true, 'Post is correctly marked as blocked for Student B.');
    assert(postInFeed.textContent === null || postInFeed.textContent === undefined || postInFeed.textContent === '', 'Post content is empty/hidden for Student B.');

    // 7. Student B unlocks the post and accesses it
    console.log('\n--- PHASE 7: Post Unlocking and Points Deduction ---');
    console.log(`Student B unlocking post ${postId}...`);
    
    // GET /api/posts/:id will trigger the unlock call and charge points
    const accessPostRes = await axios.get(`${BASE_URL_POSTS}/${postId}`, headersB);
    
    assert(accessPostRes.data.blocked === false, 'Post is successfully unlocked.');
    assert(accessPostRes.data.textContent.includes('SECRET DATA'), 'Post content is visible after unlock.');

    // Check Student B points
    const pointsRes = await axios.get(`${BASE_URL_AUTH}/me/puntos`, headersB);
    console.log(`Student B current points: ${pointsRes.data.puntos}`);
    assert(pointsRes.data.puntos === 4, '3 points were successfully deducted from Student B (7 -> 4).');

    // 8. Admin toggles visibility (Hides post)
    console.log('\n--- PHASE 8: Admin Capabilities (Hide Post) ---');
    console.log(`Admin hiding post ${postId}...`);
    const hideRes = await axios.patch(`${BASE_URL_POSTS}/${postId}/visibility`, {}, headersAdmin);
    assert(hideRes.data.hidden === true, 'Post visibility toggled to hidden successfully.');

    // Verify Student B cannot see the post in feed now
    const feedAfterHideRes = await axios.get(`${BASE_URL_POSTS}/feed/latest?limit=10`, headersB);
    const postInFeedAfterHide = feedAfterHideRes.data.find(p => p.id === postId);
    assert(postInFeedAfterHide === undefined, 'Hidden post does not appear in Student B feed.');

    // 9. Admin toggles visibility (Unhides post)
    console.log('\n--- PHASE 9: Admin Capabilities (Unhide Post) ---');
    console.log(`Admin restoring visibility for post ${postId}...`);
    const unhideRes = await axios.patch(`${BASE_URL_POSTS}/${postId}/visibility`, {}, headersAdmin);
    assert(unhideRes.data.hidden === false, 'Post visibility toggled back to visible successfully.');

    // Verify Student B can see it again
    const feedAfterUnhideRes = await axios.get(`${BASE_URL_POSTS}/feed/latest?limit=10`, headersB);
    const postInFeedAfterUnhide = feedAfterUnhideRes.data.find(p => p.id === postId);
    assert(postInFeedAfterUnhide !== undefined, 'Post restored and visible in Student B feed.');

    console.log('\n🌟🌟 ALL TRANSVERSAL E2E TESTS PASSED SUCCESSFULLY! 🌟🌟\n');

  } catch (error) {
    console.error('💥 Test Execution Failed:', error.response?.data || error.message);
    hasFailed = true;
  }

  if (hasFailed) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runE2ETests();
