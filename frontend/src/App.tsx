import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import './App.css';
import GoogleCallback from './GoogleCallback';
import { api, setLogoutCallback } from './services/api';
import Explore from './components/Explore';

const AUTH_BASE = import.meta.env.VITE_AUTH_URL || '';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GOOGLE_REDIRECT = import.meta.env.VITE_GOOGLE_REDIRECT_URI || (window.location.origin + '/auth/google/callback');

type ViewState = 'login' | 'register' | 'feed' | 'google-callback' | 'loading';

interface AuthUser {
  id?: string;
  nombre: string;
  correo: string;
  role?: string;
  rol?: string;
  apodo?: string;
  puntos?: number;
}

interface Post {
  id: number;
  title: string;
  description: string;
  textContent?: string;
  fileUrl?: string;
  votes: number;
  accessPoints: number;
  blocked: boolean;
  createdAt: string;
  authorId: number;
  topicId: string;
  hidden?: boolean;
}

const getAvatarStyle = (authorId: string | number | undefined) => {
  const str = String(authorId || 'default');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return {
    background: `linear-gradient(135deg, hsl(${hue}, 70%, 50%), var(--primary))`
  };
};

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('loading');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  const [activeTab, setActiveTab] = useState<'home' | 'explore' | 'profile'>('home');

  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userPoints, setUserPoints] = useState<number>(0);

  const [profileNombre, setProfileNombre] = useState('');
  const [profileApodo, setProfileApodo] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  const [posts, setPosts] = useState<any[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [feedError, setFeedError] = useState('');

  const [topics, setTopics] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [careers, setCareers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedCareer, setSelectedCareer] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  const [imageBase64, setImageBase64] = useState<string>('');

  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');

  const [comments, setComments] = useState<Record<number, { count: number; show: boolean; list: { id: number; text: string; author: string; createdAt: string }[]; newText: string }>>({});


  const doLogout = useCallback(() => {
    sessionStorage.removeItem('elmuro_token');
    setAuthUser(null);
    setActiveTab('home');
    setUserPoints(0);
    setProfileNombre('');
    setProfileApodo('');
    setProfilePassword('');
    setProfileSuccess('');
    setProfileError('');
    setPosts([]);
    setFeedError('');
    setSelectedTopic('');
    setImageBase64('');
    setNewPostTitle('');
    setNewPostContent('');
    setComments({});
    setCurrentView('login');
  }, []);

  useEffect(() => {
    setLogoutCallback(doLogout);
  }, [doLogout]);

  useEffect(() => {
    if (window.location.pathname === '/auth/google/callback') {
      setCurrentView('google-callback');
      return;
    }

    const token = sessionStorage.getItem('elmuro_token');
    if (!token) {
      setCurrentView('login');
      return;
    }

    const validateSession = async () => {
      try {
        const response = await api.getMe();
        const userData = response.user || response;
        setAuthUser(userData);
        setCurrentView('feed');
      } catch {
        sessionStorage.removeItem('elmuro_token');
        setCurrentView('login');
      }
    };

    validateSession();
  }, []);

  const loadPoints = async () => {
    try {
      const data = await api.getPoints();
      const puntos = data?.puntos ?? data?.points ?? 0;
      setUserPoints(puntos);
    } catch (err) {
      console.error('Error cargando puntos', err);
    }
  };


  const handleToggleComments = async (postId: number) => {
    const post = posts.find(p => p.id === postId);
    if (comments[postId]?.show) {
      setComments(prev => ({ ...prev, [postId]: { ...prev[postId], show: false } }));
    } else {
      const existingComments = post?.comments || [];
      setComments(prev => ({
        ...prev,
        [postId]: { 
          count: existingComments.length, 
          show: true, 
          list: existingComments, 
          newText: prev[postId]?.newText || '' 
        }
      }));
    }
  };

  const handleAddComment = async (postId: number) => {
    const text = comments[postId]?.newText?.trim();
    if (!text) return;
    try {
      const newComment = await api.addComment(postId, text);
      setComments(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          list: [...(prev[postId]?.list || []), newComment],
          count: (prev[postId]?.count || 0) + 1,
          newText: ''
        }
      }));
    } catch (err: any) {
      alert(err.message || 'Error al agregar comentario');
    }
  };

  const loadCreationData = async () => {
    try {
      const [careersData, subjectsData, topicsData] = await Promise.all([
        api.getCareers(),
        api.getSubjects(),
        api.getTopics()
      ]);
      const careersList = Array.isArray(careersData) ? careersData : [];
      const subjectsList = Array.isArray(subjectsData) ? subjectsData : [];
      const topicsList = Array.isArray(topicsData) ? topicsData : (topicsData.data || topicsData.items || []);

      setCareers(careersList);
      setSubjects(subjectsList);
      setTopics(topicsList);
      if (careersList.length > 0) {
        setSelectedCareer(careersList[0].id.toString());
      }
    } catch (err) {
      console.error('Error cargando datos de creación', err);
    }
  };

  const loadFeed = async () => {
    setIsLoadingPosts(true);
    setFeedError('');
    try {
      const data = await api.getFeed(20);
      setPosts(data);
    } catch (err: any) {
      setFeedError(err.message || 'Error cargando el feed');
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const loadPostsByTopic = async (topicId: number | string, topicName: string) => {
    setIsLoadingPosts(true);
    setFeedError('');
    setActiveTab('home');
    try {
      const data = await api.getPostsByTopic(topicId.toString());
      setPosts(data);
    } catch (err: any) {
      setFeedError(err.message || `Error cargando trabajos del tema ${topicName}`);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    setIsLoading(true);
    try {
      const updates: any = {};
      if (profileNombre) updates.nombre = profileNombre;
      if (profileApodo) updates.apodo = profileApodo;
      if (profilePassword) updates.password = profilePassword;

      const data = await api.updateProfile(updates);
      setProfileSuccess(data.message || 'Perfil actualizado correctamente');

      const updatedUser = data.user || (data.profile ? { ...authUser, ...data.profile } : authUser);
      setAuthUser(updatedUser);
      loadPoints();
    } catch (err: any) {
      setProfileError(err.message || 'Error al actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVisibility = async (postId: number) => {
    try {
      const updatedPost = await api.togglePostVisibility(postId);
      setPosts(posts.map(p => p.id === postId ? { ...p, hidden: updatedPost.hidden } : p));
    } catch (err: any) {
      alert(err.message || 'Error al cambiar la visibilidad del post');
    }
  };

  useEffect(() => {
    if (currentView === 'feed' && authUser) {
      loadPoints();
      loadCreationData();
      loadFeed();
    }
  }, [currentView, authUser]);

  const handleLoginSuccess = useCallback((token: string, user: AuthUser) => {
    sessionStorage.setItem('elmuro_token', token);
    setAuthUser(user);
    setCurrentView('feed');
  }, []);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);
    const form = e.currentTarget;
    const correo = (form.elements.namedItem('correo') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    try {
      const res = await fetch(`${AUTH_BASE}/api/auth/login`, {
        cache: 'no-store',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Credenciales incorrectas');
      }
      const data = await res.json();
      handleLoginSuccess(data.token, data.user ?? { nombre: data.nombre, correo: data.correo, role: data.role });
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRegisterError('');
    setIsLoading(true);
    const form = e.currentTarget;
    const nombre = (form.elements.namedItem('nombre') as HTMLInputElement).value;
    const correo = (form.elements.namedItem('correo') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    try {
      const res = await fetch(`${AUTH_BASE}/api/auth/register`, {
        cache: 'no-store',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, correo, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'No se pudo crear la cuenta');
      }
      const data = await res.json();
      handleLoginSuccess(data.token, data.user ?? { nombre: data.nombre, correo: data.correo, role: data.role });
    } catch (err: unknown) {
      setRegisterError(err instanceof Error ? err.message : 'Error al registrarse');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  };

  const handleLogout = () => {
    doLogout();
  };

  const toggleLike = async (postId: number) => {
    try {
      await api.votePost(postId);
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return { ...post, votes: post.votes + 1 };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error al votar:', error);
    }
  };

  const createPost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim() || !selectedTopic) {
      alert('Por favor, ingresa el título, contenido y selecciona un tema.');
      return;
    }
    try {
      const data = {
        title: newPostTitle.trim(),
        description: newPostContent.substring(0, 100),
        textContent: newPostContent,
        fileUrl: imageBase64,
        topicId: selectedTopic,
        accessPoints: 3
      };
      const newPost = await api.createPost(data);
      setPosts([newPost, ...posts]);
      setNewPostTitle('');
      setNewPostContent('');
      setImageBase64('');
    } catch (error: any) {
      alert(error.message || 'Error creando post');
      console.error('Error creando post:', error);
    }
  };

  if (currentView === 'loading') {
    return (
      <div className="auth-container">
        <div className="glass-panel auth-card animate-slide-up" style={{ textAlign: 'center' }}>
          <div className="oauth-spinner" />
          <h2 style={{ marginTop: 24 }}>Cargando...</h2>
        </div>
      </div>
    );
  }

  if (currentView === 'google-callback') {
    return (
      <GoogleCallback
        onSuccess={handleLoginSuccess}
        onError={() => setCurrentView('login')}
      />
    );
  }

  if (currentView === 'login' || currentView === 'register') {
    return (
      <div className="auth-container">
        <div className="glass-panel auth-card animate-slide-up">
          <h1 className="auth-title">El Muro</h1>
          <p className="auth-subtitle">La red social exclusiva de nuestra universidad</p>

          <button className="btn btn-google" onClick={handleGoogleLogin}>
            <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M43.6 20.2h-1.6V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.8z" fill="#FFC107"/>
              <path d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" fill="#FF3D00"/>
              <path d="M24 44c5.5 0 10.4-2 14.1-5.3l-6.5-5.5C29.6 34.9 27 36 24 36c-5.3 0-9.7-3.3-11.3-8H6.3C9.7 35.7 16.3 44 24 44z" fill="#4CAF50"/>
              <path d="M43.6 20.2H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.5 5.5C37.2 39.3 44 34 44 24c0-1.3-.1-2.6-.4-3.8z" fill="#1976D2"/>
            </svg>
            Continuar con Google
          </button>

          <div className="auth-divider">
            <span>o</span>
          </div>

          <form className="auth-form" onSubmit={currentView === 'login' ? handleLogin : handleRegister}>
            {currentView === 'register' && (
              <>
                <label>Nombre Completo</label>
                <input name="nombre" type="text" className="input-glass" placeholder="Ej. Juan Pérez" required />
              </>
            )}

            <label>Correo Universitario</label>
            <input name="correo" type="email" className="input-glass" placeholder="usuario@universidad.edu" required />

            <label>Contraseña</label>
            <input name="password" type="password" className="input-glass" placeholder="••••••••" required />

            {loginError && <p className="auth-error">{loginError}</p>}
            {registerError && <p className="auth-error">{registerError}</p>}

            <div className="auth-actions">
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Cargando…' : (currentView === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta')}
              </button>
            </div>
          </form>

          <div className="auth-switch">
            {currentView === 'login' ? (
              <p>¿No tienes una cuenta? <a onClick={() => { setCurrentView('register'); setLoginError(''); }}>Regístrate aquí</a></p>
            ) : (
              <p>¿Ya tienes una cuenta? <a onClick={() => { setCurrentView('login'); setRegisterError(''); }}>Inicia sesión</a></p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const avatarLetter = authUser?.nombre?.charAt(0).toUpperCase() ?? 'U';

  return (
    <div className="app-container animate-fade-in">
      <nav className="sidebar">
        <a href="#" className="brand">
          <i className="ph-fill ph-circles-four"></i>
          <span>El Muro</span>
        </a>

        <div className="nav-menu">
          <a href="#" className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('home'); loadFeed(); }}>
            <i className="ph ph-house"></i>
            <span>Inicio</span>
          </a>
          <a href="#" className={`nav-item ${activeTab === 'explore' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('explore'); }}>
            <i className="ph ph-magnifying-glass"></i>
            <span>Explorar</span>
          </a>

          <a href="#" className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('profile'); setProfileNombre(authUser?.nombre || ''); setProfileApodo(authUser?.apodo || ''); setProfilePassword(''); setProfileSuccess(''); setProfileError(''); }}>
            <i className="ph ph-user"></i>
            <span>Mi Perfil</span>
          </a>
        </div>

        <div className="user-profile-sm" onClick={() => { setActiveTab('profile'); setProfileNombre(authUser?.nombre || ''); setProfileApodo(authUser?.apodo || ''); setProfilePassword(''); setProfileSuccess(''); setProfileError(''); }}>
          <div className="avatar" style={getAvatarStyle(authUser?.id || authUser?.correo)}>{avatarLetter}</div>
          <div className="author-info">
            <h4>{authUser?.nombre ?? 'Mi Perfil'}</h4>
            <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>⭐ {userPoints} puntos</span>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {activeTab === 'explore' ? (
          <Explore onTopicSelect={loadPostsByTopic} />
        ) : activeTab === 'profile' ? (
          <div className="profile-container animate-fade-in" style={{ padding: '20px' }}>
            <div className="feed-header animate-slide-up stagger-1" style={{ marginBottom: '24px' }}>
              <h2 className="feed-title">Mi Perfil</h2>
              <p style={{ color: 'var(--text-muted)' }}>Administra tu información personal y visualiza tus puntos.</p>
            </div>

            <div className="glass-card animate-slide-up stagger-2" style={{ padding: '32px', maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
                <div className="avatar" style={{ width: '80px', height: '80px', fontSize: '2.5rem', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                  {avatarLetter}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{authUser?.nombre}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>@{authUser?.apodo || 'sin_apodo'}</p>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                    <span style={{ background: 'rgba(255,255,255,0.08)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem' }}>
                      Rol: <strong style={{ textTransform: 'capitalize' }}>{authUser?.rol || authUser?.role || 'estudiante'}</strong>
                    </span>
                    <span style={{ background: 'rgba(57, 73, 171, 0.15)', color: 'var(--accent)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      ⭐ {userPoints} Puntos
                    </span>
                  </div>
                </div>
              </div>

              {profileSuccess && <div className="auth-success" style={{ marginBottom: '20px', padding: '12px', background: 'rgba(46, 204, 113, 0.15)', color: '#2ecc71', borderRadius: '8px', border: '1px solid rgba(46, 204, 113, 0.3)', fontSize: '0.9rem' }}>{profileSuccess}</div>}
              {profileError && <div className="auth-error" style={{ marginBottom: '20px', padding: '12px', background: 'rgba(231, 76, 60, 0.15)', color: '#e74c3c', borderRadius: '8px', border: '1px solid rgba(231, 76, 60, 0.3)', fontSize: '0.9rem' }}>{profileError}</div>}

              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="profileNombre" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Nombre Completo</label>
                  <input
                    type="text"
                    id="profileNombre"
                    className="input-glass"
                    value={profileNombre}
                    onChange={(e) => setProfileNombre(e.target.value)}
                    required
                    style={{ width: '100%', padding: '12px', boxSizing: 'border-box' }}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="profileApodo" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Apodo (Nombre de usuario)</label>
                  <input
                    type="text"
                    id="profileApodo"
                    className="input-glass"
                    value={profileApodo}
                    onChange={(e) => setProfileApodo(e.target.value)}
                    required
                    style={{ width: '100%', padding: '12px', boxSizing: 'border-box' }}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="profilePassword" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Nueva Contraseña (Dejar vacío para no cambiar)</label>
                  <input
                    type="password"
                    id="profilePassword"
                    className="input-glass"
                    placeholder="••••••••"
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    style={{ width: '100%', padding: '12px', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                  <button type="submit" className="btn btn-accent" disabled={isLoading} style={{ flex: 1 }}>
                    {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={handleLogout} style={{ border: '1px solid #ff4d6d', color: '#ff4d6d' }}>
                    <i className="ph ph-sign-out"></i> Cerrar Sesión
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <>
            <div className="feed-header animate-slide-up stagger-1">
              <h2 className="feed-title">Inicio</h2>
            </div>

          <div className="glass-card create-post animate-slide-up stagger-2">
            <div className="avatar" style={getAvatarStyle(authUser?.id || authUser?.correo)}>{avatarLetter}</div>
            <div className="create-post-input-area">
              <input
                type="text"
                className="input-glass"
                placeholder="Título de la publicación..."
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                style={{ width: '100%', marginBottom: '12px', padding: '10px 14px', boxSizing: 'border-box', fontSize: '1.05rem', fontWeight: 'bold', borderRadius: '8px' }}
              />
              <textarea
                className="create-post-input"
                placeholder="¿Qué estás trabajando o investigando? (Contenido)"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                style={{ minHeight: '80px' }}
              />
              {imageBase64 && (
                <div style={{ position: 'relative', marginTop: '10px', marginBottom: '10px', maxWidth: '200px' }}>
                  <img src={imageBase64} alt="Preview" style={{ width: '100%', borderRadius: '8px' }} />
                  <button onClick={() => setImageBase64('')} style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}>×</button>
                </div>
              )}
              <div className="create-post-actions" style={{ flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>

                  <label className="icon-btn" style={{ cursor: 'pointer', margin: 0 }}>
                    <i className="ph ph-image"></i>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setImageBase64(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>

                  <select
                    className="input-glass"
                    style={{ width: 'auto', padding: '8px 12px' }}
                    value={selectedCareer}
                    onChange={(e) => {
                      setSelectedCareer(e.target.value);
                      setSelectedSubject('');
                      setSelectedTopic('');
                    }}
                  >
                    <option value="" disabled>Selecciona carrera</option>
                    {careers.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre || c.name}</option>
                    ))}
                  </select>

                  <select
                    className="input-glass"
                    style={{ width: 'auto', padding: '8px 12px' }}
                    value={selectedSubject}
                    disabled={!selectedCareer}
                    onChange={(e) => {
                      setSelectedSubject(e.target.value);
                      setSelectedTopic('');
                    }}
                  >
                    <option value="">Selecciona materia</option>
                    {subjects.filter(s => String(s.careerId) === String(selectedCareer)).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>

                  <select
                    className="input-glass"
                    style={{ width: 'auto', padding: '8px 12px' }}
                    value={selectedTopic}
                    disabled={!selectedSubject}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                  >
                    <option value="">Selecciona tema</option>
                    {topics.filter(t => String(t.materia_id) === String(selectedSubject)).map(t => (
                      <option key={t.id} value={t.id}>{t.name || t.nombre}</option>
                    ))}
                  </select>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'not-allowed', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    <input
                      type="checkbox"
                      checked={true}
                      disabled={true}
                      style={{ accentColor: 'var(--accent)', width: '16px', height: '16px' }}
                    />
                    <i className="ph-fill ph-lock-key"></i> Protegido (Obligatorio)
                  </label>
                </div>
                <button className="btn btn-accent" onClick={createPost}>Publicar Trabajo</button>
              </div>
            </div>
          </div>

          <div className="post-feed">
            {isLoadingPosts ? (
              <div style={{ textAlign: 'center', padding: '40px' }}><div className="oauth-spinner" /></div>
            ) : feedError ? (
              <div className="auth-error">{feedError}</div>
            ) : posts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No hay trabajos publicados aún.</div>
            ) : posts.map((post: Post, index) => (
              <div key={post.id} className={`glass-card post-card animate-slide-up stagger-${(index % 4) + 1}`}>
                <div className="post-header">
                  <div className="post-author">
                    <div className="avatar" style={getAvatarStyle(post.authorId)}>
                      U{post.authorId ? String(post.authorId).substring(0, 2) : 'U'}
                    </div>
                    <div className="author-info">
                      <h4>{post.title}</h4>
                      <span>Autor ID: {post.authorId} • Tema ID: {post.topicId}</span>
                    </div>
                  </div>
                  {post.blocked && (
                    <span style={{ color: '#ff4d6d', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <i className="ph-fill ph-lock-key"></i> {post.accessPoints} Pts
                    </span>
                  )}
                  {post.hidden && (
                    <span style={{ color: '#e67e22', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(230, 126, 34, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                      <i className="ph-fill ph-eye-slash"></i> Oculto
                    </span>
                  )}
                </div>

                <div className="post-content" style={{ userSelect: post.blocked ? 'none' : 'auto' }}>
                  {post.blocked ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="ph-fill ph-lock-key" style={{ color: '#ff4d6d', fontSize: '1.1rem' }}></i>
                        <span>Este trabajo está protegido. Requiere <strong>{post.accessPoints} puntos</strong> para desbloquearlo.</span>
                      </p>
                      <div style={{ filter: 'blur(5px)', opacity: 0.25, userSelect: 'none', pointerEvents: 'none', fontSize: '0.85rem', lineHeight: '1.5', marginTop: '4px' }}>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin non porta diam. Curabitur sed lectus non arcu vulputate elementum. Class aptent taciti sociosqu ad litora torquent per conubia nostra.
                      </div>
                    </div>
                  ) : (
                    post.textContent || post.description
                  )}
                </div>

                {post.fileUrl && !post.blocked && (
                  <img src={post.fileUrl} alt="Post file" className="post-image" />
                )}

                {post.blocked && (
                  <button className="btn btn-primary" style={{ width: '100%', marginBottom: '24px' }} onClick={async () => {
                    try {
                      const unlocked = await api.accessPost(post.id);
                      setPosts(posts.map(p => p.id === post.id ? unlocked : p));
                      loadPoints();
                    } catch (err: any) {
                      alert(err.message || 'No se pudo desbloquear. ¿Tienes suficientes puntos?');
                    }
                  }}>
                    <i className="ph-fill ph-unlock"></i> Desbloquear por {post.accessPoints} Puntos
                  </button>
                )}

                <div className="post-actions">
                  <button className="post-action" onClick={() => handleToggleComments(post.id)}>
                    <i className="ph ph-chat-circle"></i>
                    <span>{comments[post.id]?.count ?? 0}</span>
                  </button>
                  <button
                    className="post-action"
                    onClick={() => toggleLike(post.id)}
                  >
                    <i className="ph ph-heart"></i>
                    <span>{post.votes}</span>
                  </button>
                  {!post.blocked && (
                    <button className="post-action">
                      <i className="ph ph-share-network"></i>
                    </button>
                  )}

                  {(authUser?.rol === 'admin' || authUser?.role === 'admin') && (
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                      <button
                        className="btn"
                        style={{
                          padding: '4px 12px',
                          fontSize: '0.8rem',
                          background: post.hidden ? 'rgba(46, 204, 113, 0.2)' : 'rgba(230, 126, 34, 0.2)',
                          color: post.hidden ? '#2ecc71' : '#e67e22',
                          border: post.hidden ? '1px solid #2ecc71' : '1px solid #e67e22',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          transition: 'all 0.2s'
                        }}
                        onClick={() => handleToggleVisibility(post.id)}
                      >
                        {post.hidden ? 'Hacer Visible' : 'Ocultar'}
                      </button>
                      <button
                        className="btn"
                        style={{
                          padding: '4px 12px',
                          fontSize: '0.8rem',
                          background: 'rgba(231, 76, 60, 0.2)',
                          color: '#e74c3c',
                          border: '1px solid #e74c3c',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          transition: 'all 0.2s'
                        }}
                        onClick={async () => {
                          if (confirm('¿Seguro que deseas eliminar este post?')) {
                            try {
                              await api.deletePost(post.id);
                              setPosts(posts.filter(p => p.id !== post.id));
                            } catch (err: any) {
                              alert(err.message || 'Error al eliminar');
                            }
                          }
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>

                {comments[post.id]?.show && (
                  <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <h5 style={{ margin: 0, marginBottom: '8px', color: 'var(--text)' }}>Comentarios</h5>
                      {comments[post.id].list.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Sin comentarios aún</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                          {comments[post.id].list.map((comment: any) => (
                            <div key={comment.id} style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{comment.authorName || 'Usuario'}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(comment.createdAt).toLocaleString()}</span>
                              </div>
                              <p style={{ margin: 0, fontSize: '0.9rem' }}>{comment.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        className="input-glass"
                        placeholder="Escribe un comentario..."
                        value={comments[post.id].newText || ''}
                        onChange={(e) => setComments(prev => ({ ...prev, [post.id]: { ...prev[post.id], newText: e.target.value } }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(post.id); }}
                        style={{ flex: 1, padding: '8px 12px', fontSize: '0.9rem' }}
                      />
                      <button className="btn btn-accent" style={{ padding: '8px 16px' }} onClick={() => handleAddComment(post.id)}>Enviar</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;