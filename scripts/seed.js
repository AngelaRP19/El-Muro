const MESH_URLS = {
  auth: 'http://localhost:3000/api/auth',
  careers: 'http://localhost:8001/api/carreras',
  topics: 'http://localhost:8000/api/v1/topics',
  posts: 'http://localhost:8002/api/posts'
};

async function post(url, body, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  
  if (!res.ok) {
    const err = await res.text();
    console.warn(`[WARN] Failed POST to ${url}: ${res.status} ${err}`);
    return null;
  }
  return res.json();
}

async function get(url, token = null) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  return res.json();
}

async function seed() {
  console.log('🌱 Starting Seed Process...');
  
  // 1. Create Careers
  console.log('📚 Creating Careers...');
  const career1 = await post(`${MESH_URLS.careers}/crear`, {
    name: 'Ingeniería de Sistemas',
    faculty: 'Ingeniería',
    description: 'Carrera de tecnología e informática'
  });
  const career2 = await post(`${MESH_URLS.careers}/crear`, {
    name: 'Diseño Gráfico',
    faculty: 'Artes',
    description: 'Carrera de diseño visual'
  });

  // 2. Create Topics
  console.log('🔖 Creating Topics...');
  const topic1 = await post(MESH_URLS.topics, {
    name: 'Arquitectura de Software',
    description: 'Patrones y diseño de sistemas',
    career_id: career1 ? career1.id : 1
  });
  const topic2 = await post(MESH_URLS.topics, {
    name: 'Bases de Datos',
    description: 'SQL y NoSQL',
    career_id: career1 ? career1.id : 1
  });

  // 3. Create Users
  console.log('👤 Creating Users...');
  const user1 = await post(`${MESH_URLS.auth}/register`, {
    nombre: 'Admin UPTC',
    correo: 'admin@uptc.edu.co',
    password: 'password123'
  });
  
  const user2 = await post(`${MESH_URLS.auth}/register`, {
    nombre: 'Estudiante Prueba',
    correo: 'estudiante@uptc.edu.co',
    password: 'password123'
  });

  if (!user1 || !user2) {
    console.error('❌ Failed to create users, cannot proceed with posts.');
    return;
  }

  const tokenAdmin = user1.token;
  const tokenStudent = user2.token;

  // 4. Create Posts
  console.log('📝 Creating Posts...');
  const tId = topic1 ? topic1.id : 1;

  await post(MESH_URLS.posts, {
    title: 'Apuntes de Clean Architecture',
    description: 'Resumen completo de Clean Architecture por Uncle Bob.',
    textContent: 'El principio de dependencia dicta que las capas internas no deben saber nada de las capas externas...',
    topicId: tId,
    accessPoints: 3 // This will make it protected
  }, tokenStudent);

  await post(MESH_URLS.posts, {
    title: 'Duda sobre MongoDB',
    description: 'Alguien sabe cómo hacer un aggregate complex?',
    textContent: 'Tengo una colección de posts y necesito hacer un lookup con usuarios pero me da timeout.',
    topicId: tId,
    accessPoints: 0 // Public
  }, tokenAdmin);

  console.log('✅ Seeding complete!');
}

seed().catch(console.error);
