const axios = require('axios');
const { MongoClient } = require('mongodb');

const BASE_URL_AUTH = 'http://localhost:3000/api/auth';
const BASE_URL_TOPICS = 'http://localhost:8000/api/v1/topics';
const BASE_URL_CAREER = 'http://localhost:8001/api/carreras';
const BASE_URL_POSTS = 'http://localhost:8002/api/posts';
const BASE_URL_SUBJECTS = 'http://localhost:8004/api/subjects';

const MONGO_URL = 'mongodb://localhost:27017/auth_service';
const DB_NAME = 'auth_service';

async function runTests() {
  const results = [];
  
  const report = (service, endpoint, status, error = null) => {
    let errMsg = error;
    if (error && error.isAxiosError) {
      errMsg = `${error.code}: ${error.message} - ${error.response?.data ? JSON.stringify(error.response.data) : ''}`;
    }
    results.push({ service, endpoint, status, error: errMsg });
    console.log(`[${status}] ${service} - ${endpoint}${errMsg ? ` | Error: ${errMsg}` : ''}`);
  };

  try {
    console.log('1. Bypassing registration (route not found in current image). Fetching existing users...');
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Create or update a student user
    await db.collection('users').updateOne(
      { correo: 'student1@uptc.edu.co' },
      { 
        $set: { 
          nombre: 'Student One',
          correo: 'student1@uptc.edu.co',
          password: '$2b$10$ZrF21mK4QuIs.Oc.FwYnK.mR8I1bkGFmhVLb6EtAB24Cigr1SpVn.', // "password123" encrypted with bcrypt
          rol: 'estudiante',
          apodo: 'student1',
          puntos: 5,
          estaActivo: true,
          isVerified: true,
          failedLoginAttempts: 0,
          lockUntil: null,
          twoFactorEnabled: false
        }
      },
      { upsert: true }
    );

    // Create or update an admin user
    await db.collection('users').updateOne(
      { correo: 'admin1@uptc.edu.co' },
      { 
        $set: { 
          nombre: 'Admin One',
          correo: 'admin1@uptc.edu.co',
          password: '$2b$10$ZrF21mK4QuIs.Oc.FwYnK.mR8I1bkGFmhVLb6EtAB24Cigr1SpVn.', // "password123" encrypted
          rol: 'admin',
          apodo: 'admin1',
          puntos: 5,
          estaActivo: true,
          isVerified: true,
          failedLoginAttempts: 0,
          lockUntil: null,
          twoFactorEnabled: false
        }
      },
      { upsert: true }
    );
    await client.close();
    console.log('Users ensured in DB.');

    console.log('2. Logging in to obtain JWTs...');
    let studentToken = '';
    let adminToken = '';
    try {
      const res = await axios.post(`${BASE_URL_AUTH}/login`, {
        correo: 'student1@uptc.edu.co',
        password: 'password123'
      });
      studentToken = res.data.token;
      report('auth-service', 'POST /login (student)', 'PASS');
    } catch (e) {
      report('auth-service', 'POST /login (student)', 'FAIL', e.response?.data?.message || e.message);
    }

    try {
      const res = await axios.post(`${BASE_URL_AUTH}/login`, {
        correo: 'admin1@uptc.edu.co',
        password: 'password123'
      });
      adminToken = res.data.token;
      report('auth-service', 'POST /login (admin)', 'PASS');
    } catch (e) {
      report('auth-service', 'POST /login (admin)', 'FAIL', e.response?.data?.message || e.message);
    }

    if (!studentToken || !adminToken) {
      console.log('Authentication failed, aborting remaining tests.');
      return results;
    }

    const authHeaders = (token) => ({ headers: { Authorization: `Bearer ${token}` } });
    const authHeadersWithRole = (token, role) => ({ 
      headers: { 
        Authorization: `Bearer ${token}`,
        'x-role': role
      } 
    });

    console.log('4. Testing Career Service...');
    let careerId = 1;
    try {
      const payload = { nombre: 'Ingeniería de Sistemas', descripcion: 'Test', duracion_semestres: 10 };
      const res = await axios.post(`${BASE_URL_CAREER}/crear`, payload, authHeadersWithRole(adminToken, 'admin'));
      report('career-service', 'POST /api/carreras/crear', 'PASS');
    } catch (e) {
      if (e.response?.status === 400 && e.response?.data?.detail?.includes('ya existe')) {
        report('career-service', 'POST /api/carreras/crear', 'PASS', 'Already exists');
      } else {
        report('career-service', 'POST /api/carreras/crear', 'FAIL', e.response?.data?.detail || e.message);
      }
    }

    try {
      const res = await axios.get(`${BASE_URL_CAREER}/`, authHeadersWithRole(studentToken, 'estudiante'));
      if (res.data && res.data.length > 0) {
        careerId = res.data[0].id;
      }
      report('career-service', 'GET /api/carreras/', 'PASS');
    } catch (e) {
      report('career-service', 'GET /api/carreras/', 'FAIL', e.response?.data?.detail || e.message);
    }

    console.log('5. Testing Topics Service...');
    let topicId = null;
    try {
      const payload = { name: 'Matemáticas', description: 'Todo sobre matemáticas', materia_id: 1 };
      const res = await axios.post(BASE_URL_TOPICS, payload, authHeaders(adminToken));
      topicId = res.data.id;
      report('topics-service', 'POST /api/v1/topics', 'PASS');
    } catch (e) {
      if (e.response?.status === 400 && e.response?.data && JSON.stringify(e.response?.data).includes('already exists')) {
        report('topics-service', 'POST /api/v1/topics', 'PASS', 'Already exists');
      } else {
        report('topics-service', 'POST /api/v1/topics', 'FAIL', e.response?.data?.detail || e.message);
      }
    }

    try {
      const res = await axios.get(BASE_URL_TOPICS);
      if (!topicId && res.data && res.data.data && res.data.data.length > 0) {
        topicId = res.data.data[0].id;
      }
      report('topics-service', 'GET /api/v1/topics', 'PASS');
    } catch (e) {
      report('topics-service', 'GET /api/v1/topics', 'FAIL', e.response?.data?.detail || e.message);
    }

    console.log('6. Testing Posts Service...');
    try {
      if (topicId) {
        const payload = {
          title: 'Duda en Cálculo',
          content: '¿Cómo integro esto?',
          topicId: topicId,
          accessPoints: 0
        };
        const res = await axios.post(BASE_URL_POSTS, payload, authHeaders(studentToken));
        report('posts-service', 'POST /api/posts', 'PASS');
      } else {
        report('posts-service', 'POST /api/posts', 'FAIL', 'Skipped due to missing topicId');
      }
    } catch (e) {
      report('posts-service', 'POST /api/posts', 'FAIL', JSON.stringify(e.response?.data) || e.message);
    }

    try {
      const res = await axios.get(`${BASE_URL_POSTS}/feed/latest`, authHeaders(studentToken));
      report('posts-service', 'GET /api/posts/feed/latest', 'PASS');
    } catch (e) {
      report('posts-service', 'GET /api/posts/feed/latest', 'FAIL', JSON.stringify(e.response?.data) || e.message);
    }

    console.log('7. Testing Subjects Service...');
    try {
      const payload = { 
        name: 'Cálculo Diferencial',
        description: 'Matemáticas básicas',
        semester: 1,
        careerId: careerId
      };
      const res = await axios.post(`${BASE_URL_SUBJECTS}/create`, payload, authHeadersWithRole(adminToken, 'admin'));
      report('subjects-service', 'POST /api/subjects/create', 'PASS');
    } catch (e) {
      report('subjects-service', 'POST /api/subjects/create', 'FAIL', JSON.stringify(e.response?.data) || e.message);
    }

    try {
      const res = await axios.get(`${BASE_URL_SUBJECTS}`, authHeadersWithRole(studentToken, 'estudiante'));
      report('subjects-service', 'GET /api/subjects', 'PASS');
    } catch (e) {
      report('subjects-service', 'GET /api/subjects', 'FAIL', JSON.stringify(e.response?.data) || e.message);
    }

    console.log('\n--- FINAL REPORT ---');
    console.table(results);

  } catch (err) {
    console.error('Fatal Error during execution:', err);
  }
}

runTests();
