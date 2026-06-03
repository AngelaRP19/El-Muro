const axios = require('axios');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const AUTH_MONGO_URL = 'mongodb://localhost:27017';
const SUBJECTS_MONGO_URL = 'mongodb://localhost:27019';
const POSTS_MONGO_URL = 'mongodb://localhost:27018';

const AUTH_BASE = 'http://localhost:3000/api/auth';
const CAREER_BASE = 'http://localhost:8001/api/carreras';
const TOPICS_BASE = 'http://localhost:8000/api/v1/topics';
const POSTS_BASE = 'http://localhost:8002/api/posts';

async function seed() {
  console.log('🌱 Starting Seeder...');

  // 1. Seed Users (MongoDB auth_service)
  console.log('👤 Seeding Users to Auth MongoDB...');
  const authClient = new MongoClient(AUTH_MONGO_URL);
  await authClient.connect();
  const authDb = authClient.db('auth_service');

  const hashedPassword = await bcrypt.hash('password123', 10);
  const now = new Date();

  const usersToSeed = [
    {
      nombre: 'David Rodríguez',
      correo: 'david.rodriguez26@uptc.edu.co',
      password: hashedPassword,
      rol: 'estudiante',
      apodo: 'david.rodriguez26',
      puntos: 500,
      estaActivo: true,
      isVerified: true,
      failedLoginAttempts: 0,
      lockUntil: null,
      twoFactorEnabled: false,
      createdAt: now,
      updatedAt: now
    },
    {
      nombre: 'Student Demo',
      correo: 'student_demo@uptc.edu.co',
      password: hashedPassword,
      rol: 'estudiante',
      apodo: 'student_demo',
      puntos: 100,
      estaActivo: true,
      isVerified: true,
      failedLoginAttempts: 0,
      lockUntil: null,
      twoFactorEnabled: false,
      createdAt: now,
      updatedAt: now
    },
    {
      nombre: 'Admin Demo',
      correo: 'admin_demo@uptc.edu.co',
      password: hashedPassword,
      rol: 'admin',
      apodo: 'admin_demo',
      puntos: 100,
      estaActivo: true,
      isVerified: true,
      failedLoginAttempts: 0,
      lockUntil: null,
      twoFactorEnabled: false,
      createdAt: now,
      updatedAt: now
    }
  ];

  for (const u of usersToSeed) {
    await authDb.collection('users').updateOne(
      { correo: u.correo },
      { $set: u },
      { upsert: true }
    );
    console.log(`   Upserted user: ${u.correo} (${u.rol})`);
  }
  await authClient.close();

  // 2. Obtain JWTs
  console.log('🔑 Authenticating and obtaining tokens...');
  const login = async (correo, password) => {
    try {
      const res = await axios.post(`${AUTH_BASE}/login`, { correo, password });
      return res.data.token;
    } catch (err) {
      console.error(`Failed to login ${correo}:`, err.response?.data || err.message);
      throw err;
    }
  };

  const adminToken = await login('admin_demo@uptc.edu.co', 'password123');
  const studentToken = await login('david.rodriguez26@uptc.edu.co', 'password123');

  const headersAdmin = { headers: { Authorization: `Bearer ${adminToken}`, 'x-role': 'admin' } };
  const headersStudent = { headers: { Authorization: `Bearer ${studentToken}` } };

  // 3. Seed Careers (career-service via HTTP)
  console.log('📚 Seeding Careers to Career Service...');
  const careerNames = [
    { nombre: 'Ingeniería de Sistemas', descripcion: 'Facultad de Ingeniería', duracion_semestres: 10 },
    { nombre: 'Diseño Gráfico', descripcion: 'Facultad de Artes', duracion_semestres: 8 },
    { nombre: 'Licenciatura en Matemáticas', descripcion: 'Facultad de Ciencias de la Educación', duracion_semestres: 10 }
  ];

  const careerIds = {};

  const existingCareersRes = await axios.get(`${CAREER_BASE}/`, headersStudent);
  const existingCareers = existingCareersRes.data;

  for (const c of careerNames) {
    const found = existingCareers.find(ec => ec.nombre === c.nombre);
    if (found) {
      careerIds[c.nombre] = found.id;
      console.log(`   Career already exists: "${c.nombre}" with ID ${found.id}`);
    } else {
      const createRes = await axios.post(`${CAREER_BASE}/crear`, c, headersAdmin);
      careerIds[c.nombre] = createRes.data.id;
      console.log(`   Created Career: "${c.nombre}" with ID ${createRes.data.id}`);
    }
  }

  // 4. Seed Subjects (MongoDB subjects_service)
  console.log('📖 Seeding Subjects to Subjects MongoDB...');
  const subjectsClient = new MongoClient(SUBJECTS_MONGO_URL);
  await subjectsClient.connect();
  const subjectsDb = subjectsClient.db('subjects_service');

  // Let's clear subjects to avoid duplicates
  await subjectsDb.collection('subjects').deleteMany({});

  const subjectsToSeed = [
    {
      _id: '1',
      name: 'Álgebra Lineal',
      description: 'Matrices y sistemas de ecuaciones lineales',
      semester: 1,
      careerId: careerIds['Licenciatura en Matemáticas'],
      createdAt: now,
      updatedAt: now
    },
    {
      _id: '2',
      name: 'Cálculo Diferencial',
      description: 'Límites, derivadas y aplicaciones',
      semester: 2,
      careerId: careerIds['Licenciatura en Matemáticas'],
      createdAt: now,
      updatedAt: now
    },
    {
      _id: '3',
      name: 'Introducción a la Programación',
      description: 'Conceptos básicos de algoritmos y POO',
      semester: 1,
      careerId: careerIds['Ingeniería de Sistemas'],
      createdAt: now,
      updatedAt: now
    },
    {
      _id: '4',
      name: 'Bases de Datos',
      description: 'SQL, NoSQL, modelamiento relacional y documental',
      semester: 4,
      careerId: careerIds['Ingeniería de Sistemas'],
      createdAt: now,
      updatedAt: now
    },
    {
      _id: '5',
      name: 'Arquitectura de Software',
      description: 'Clean architecture y patrones de diseño de sistemas modernos',
      semester: 6,
      careerId: careerIds['Ingeniería de Sistemas'],
      createdAt: now,
      updatedAt: now
    },
    {
      _id: '6',
      name: 'Teoría del Color',
      description: 'Fundamentos visuales, armonía y propiedades del color',
      semester: 1,
      careerId: careerIds['Diseño Gráfico'],
      createdAt: now,
      updatedAt: now
    },
    {
      _id: '7',
      name: 'Ilustración Digital',
      description: 'Técnicas digitales de pintura e ilustración vectorial',
      semester: 3,
      careerId: careerIds['Diseño Gráfico'],
      createdAt: now,
      updatedAt: now
    }
  ];

  for (const s of subjectsToSeed) {
    await subjectsDb.collection('subjects').insertOne(s);
  }
  console.log(`   Seeded ${subjectsToSeed.length} subjects.`);
  await subjectsClient.close();

  // 5. Seed Topics (topics-service via HTTP)
  console.log('🔖 Seeding Topics to Topics Service...');
  const topicsToSeed = [
    { name: 'Matrices', description: 'Operaciones básicas, determinantes y sistemas lineales', materia_id: 1 },
    { name: 'Limites', description: 'Conceptos iniciales de límites, continuidad y asíntotas', materia_id: 2 },
    { name: 'Programacion Orientada a Objetos', description: 'Clases, objetos, encapsulamiento, herencia y polimorfismo', materia_id: 3 },
    { name: 'SQL vs NoSQL', description: 'Comparativa de bases de datos relacionales frente a documentales o clave-valor', materia_id: 4 },
    { name: 'Clean Architecture', description: 'Capas y dependencias, principios SOLID e independencia de frameworks', materia_id: 5 },
    { name: 'Colorimetría', description: 'Teoría y Armonías de Color para composición visual', materia_id: 6 }
  ];

  const topicsRes = await axios.get(TOPICS_BASE);
  const existingTopics = Array.isArray(topicsRes.data) ? topicsRes.data : (topicsRes.data.items || topicsRes.data.data || []);

  const topicIds = {};

  for (const t of topicsToSeed) {
    const found = existingTopics.find(et => et.name === t.name);
    if (found) {
      topicIds[t.name] = found.id;
      console.log(`   Topic already exists: "${t.name}" with ID ${found.id}`);
    } else {
      const createRes = await axios.post(TOPICS_BASE, t, headersAdmin);
      topicIds[t.name] = createRes.data.id;
      console.log(`   Created Topic: "${t.name}" with ID ${createRes.data.id}`);
    }
  }

  // 6. Seed Posts (MongoDB posts_service)
  console.log('📝 Seeding Sample Posts to Posts MongoDB...');
  const postsClient = new MongoClient(POSTS_MONGO_URL);
  await postsClient.connect();
  const postsDb = postsClient.db('posts_service');

  // Let's clear existing posts to avoid duplicate pollution
  await postsDb.collection('posts').deleteMany({});
  await postsClient.close();

  const postsToSeed = [
    {
      title: 'Guía completa de Matrices',
      description: 'Una guía detallada de matrices y transformaciones lineales',
      textContent: 'CONTENIDO PROTEGIDO: Matrices de nxn, cálculo de determinantes y cálculo de autovalores/autovectores por métodos analíticos.',
      topicId: topicIds['Matrices'],
      accessPoints: 3
    },
    {
      title: 'Cálculo de Límites al Infinito',
      description: 'Ejercicios resueltos de límites indeterminados',
      textContent: 'CONTENIDO PROTEGIDO: Ejercicios paso a paso resolviendo indeterminaciones de tipo [infinito - infinito] y [1^infinito] usando límites notables.',
      topicId: topicIds['Limites'],
      accessPoints: 3
    },
    {
      title: 'Patrón Repository en Spring Boot',
      description: 'Ejemplo de implementación del patrón repository en Java',
      textContent: 'El patrón repository actúa como una abstracción sobre el almacenamiento de datos, permitiendo separar la capa de dominio de la infraestructura...',
      topicId: topicIds['Clean Architecture'],
      accessPoints: 0
    },
    {
      title: 'Teoría y Armonía del Color',
      description: 'Conceptos de colorimetría para diseñadores',
      textContent: 'CONTENIDO PROTEGIDO: Uso del círculo cromático, esquemas monocromáticos, análogos, triadas y complementarios divididos en composiciones editoriales.',
      topicId: topicIds['Colorimetría'],
      accessPoints: 3
    }
  ];

  for (const p of postsToSeed) {
    const res = await axios.post(POSTS_BASE, p, headersStudent);
    console.log(`   Created Post: "${p.title}" (ID: ${res.data.id})`);
  }

  console.log('🌟 Seeding Completed Successfully! 🌟');
}

seed().catch(err => {
  console.error('💥 Seeder Failed:', err.response?.data || err.message);
  process.exit(1);
});
