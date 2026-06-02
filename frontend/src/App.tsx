import { useState, FormEvent } from 'react';
import './App.css';

type ViewState = 'login' | 'register' | 'feed';

interface Post {
  id: string;
  author: string;
  authorHandle: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  timeAgo: string;
  isLiked: boolean;
}

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('login');
  
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      author: 'Ana Martínez',
      authorHandle: '@anamartinez',
      content: '¡Acabo de terminar mi proyecto final de Ingeniería de Software! Ha sido un viaje increíble aprendiendo sobre arquitecturas modernas y microservicios. 🚀💻 #ProyectoFinal #Ingeniería',
      likes: 124,
      comments: 18,
      timeAgo: '2h',
      isLiked: false
    },
    {
      id: '2',
      author: 'Carlos Gómez',
      authorHandle: '@carlosg',
      content: '¿Alguien sabe si la cafetería central está abierta hoy? Necesito café urgentemente para sobrevivir la clase de bases de datos. ☕😭',
      likes: 45,
      comments: 5,
      timeAgo: '4h',
      isLiked: true
    },
    {
      id: '3',
      author: 'Laura Silva',
      authorHandle: '@laurasilva_art',
      content: 'Les comparto una foto de la exposición de arte de hoy en la facultad de Diseño. El talento que hay en nuestra universidad es increíble. ✨🎨',
      image: 'https://images.unsplash.com/photo-1518998053401-878c730c5e4d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      likes: 342,
      comments: 42,
      timeAgo: '5h',
      isLiked: false
    }
  ]);

  const [newPostContent, setNewPostContent] = useState('');

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setCurrentView('feed');
  };

  const handleRegister = (e: FormEvent) => {
    e.preventDefault();
    setCurrentView('feed');
  };

  const toggleLike = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));
  };

  const createPost = () => {
    if (!newPostContent.trim()) return;
    
    const newPost: Post = {
      id: Date.now().toString(),
      author: 'Tú',
      authorHandle: '@mi_usuario',
      content: newPostContent,
      likes: 0,
      comments: 0,
      timeAgo: '1m',
      isLiked: false
    };
    
    setPosts([newPost, ...posts]);
    setNewPostContent('');
  };

  if (currentView === 'login' || currentView === 'register') {
    return (
      <div className="auth-container">
        <div className="glass-panel auth-card animate-slide-up">
          <h1 className="auth-title">El Muro</h1>
          <p className="auth-subtitle">La red social exclusiva de nuestra universidad</p>
          
          <form className="auth-form" onSubmit={currentView === 'login' ? handleLogin : handleRegister}>
            {currentView === 'register' && (
              <>
                <label>Nombre Completo</label>
                <input type="text" className="input-glass" placeholder="Ej. Juan Pérez" required />
              </>
            )}
            
            <label>Correo Universitario</label>
            <input type="email" className="input-glass" placeholder="usuario@universidad.edu" required />
            
            <label>Contraseña</label>
            <input type="password" className="input-glass" placeholder="••••••••" required />
            
            <div className="auth-actions">
              <button type="submit" className="btn btn-primary">
                {currentView === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </button>
            </div>
          </form>
          
          <div className="auth-switch">
            {currentView === 'login' ? (
              <p>¿No tienes una cuenta? <a onClick={() => setCurrentView('register')}>Regístrate aquí</a></p>
            ) : (
              <p>¿Ya tienes una cuenta? <a onClick={() => setCurrentView('login')}>Inicia sesión</a></p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container animate-fade-in">
      {/* Sidebar Navigation */}
      <nav className="sidebar">
        <a href="#" className="brand">
          <i className="ph-fill ph-circles-four"></i>
          <span>El Muro</span>
        </a>
        
        <div className="nav-menu">
          <a href="#" className="nav-item active">
            <i className="ph ph-house"></i>
            <span>Inicio</span>
          </a>
          <a href="#" className="nav-item">
            <i className="ph ph-magnifying-glass"></i>
            <span>Explorar</span>
          </a>
          <a href="#" className="nav-item">
            <i className="ph ph-bell"></i>
            <span>Notificaciones</span>
          </a>
          <a href="#" className="nav-item">
            <i className="ph ph-envelope-simple"></i>
            <span>Mensajes</span>
          </a>
          <a href="#" className="nav-item">
            <i className="ph ph-bookmark-simple"></i>
            <span>Guardados</span>
          </a>
        </div>
        
        <div className="user-profile-sm" onClick={() => setCurrentView('login')}>
          <div className="avatar">D</div>
          <div className="author-info">
            <h4>Mi Perfil</h4>
            <span>Cerrar Sesión</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <div className="feed-header animate-slide-up stagger-1">
          <h2 className="feed-title">Inicio</h2>
        </div>

        {/* Create Post Area */}
        <div className="glass-card create-post animate-slide-up stagger-2">
          <div className="avatar">T</div>
          <div className="create-post-input-area">
            <textarea 
              className="create-post-input" 
              placeholder="¿Qué está pasando en la U?"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
            ></textarea>
            <div className="create-post-actions">
              <div className="action-buttons">
                <button className="icon-btn"><i className="ph ph-image"></i></button>
                <button className="icon-btn"><i className="ph ph-gif"></i></button>
                <button className="icon-btn"><i className="ph ph-smiley"></i></button>
              </div>
              <button className="btn btn-accent" onClick={createPost}>Publicar</button>
            </div>
          </div>
        </div>

        {/* Feed Posts */}
        <div className="post-feed">
          {posts.map((post, index) => (
            <div key={post.id} className={`glass-card post-card animate-slide-up stagger-${(index % 4) + 1}`}>
              <div className="post-header">
                <div className="post-author">
                  <div className="avatar" style={{ background: `linear-gradient(135deg, hsl(${Math.random() * 360}, 70%, 50%), var(--primary))` }}>
                    {post.author.charAt(0)}
                  </div>
                  <div className="author-info">
                    <h4>{post.author}</h4>
                    <span>{post.authorHandle} • {post.timeAgo}</span>
                  </div>
                </div>
                <button className="icon-btn"><i className="ph ph-dots-three"></i></button>
              </div>
              
              <div className="post-content">
                {post.content}
              </div>
              
              {post.image && (
                <img src={post.image} alt="Post image" className="post-image" />
              )}
              
              <div className="post-actions">
                <button className="post-action">
                  <i className="ph ph-chat-circle"></i>
                  <span>{post.comments}</span>
                </button>
                <button 
                  className={`post-action ${post.isLiked ? 'liked' : ''}`}
                  onClick={() => toggleLike(post.id)}
                >
                  <i className={post.isLiked ? "ph-fill ph-heart" : "ph ph-heart"}></i>
                  <span>{post.likes}</span>
                </button>
                <button className="post-action">
                  <i className="ph ph-share-network"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
