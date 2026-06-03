const getToken = () => sessionStorage.getItem('elmuro_token');

let logoutCallback: (() => void) | null = null;

export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

const clearAuth = () => {
  sessionStorage.removeItem('elmuro_token');
  if (logoutCallback) {
    logoutCallback();
  }
};

const apiFetch = async (url: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { cache: 'no-store', ...options, headers });

  if (response.status === 401) {
    clearAuth();
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }

  if (!response.ok) {
    let errorMsg = 'Ha ocurrido un error inesperado';
    try {
      const errorData = await response.json();
      errorMsg = errorData.message || errorData.error || errorMsg;
    } catch {
    }
    throw new Error(errorMsg);
  }

  if (response.status === 204) return null;

  return response.json();
};

export const api = {
  getMe: () => apiFetch('/api/auth/me'),

  getPoints: () => apiFetch('/api/auth/me/puntos'),
  updateProfile: (data: { nombre?: string; apodo?: string; password?: string }) =>
    apiFetch('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getFeed: (limit = 20) => apiFetch(`/api/posts/feed/latest?limit=${limit}`),
  getPostsByTopic: (temaId: string) => apiFetch(`/api/posts?temaId=${temaId}`),
  createPost: (data: { title: string; description: string; textContent: string; topicId: string; accessPoints: number }) =>
    apiFetch('/api/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  accessPost: (postId: string | number) => apiFetch(`/api/posts/${postId}`),
  votePost: (postId: string | number) => apiFetch(`/api/posts/${postId}/vote`, { method: 'POST' }),
  deletePost: (postId: string | number) => apiFetch(`/api/posts/${postId}`, { method: 'DELETE' }),
  togglePostVisibility: (postId: string | number) =>
    apiFetch(`/api/posts/${postId}/visibility`, {
      method: 'PATCH',
    }),

  getTopics: () => apiFetch('/api/v1/topics'),

  getSubjects: () => apiFetch('/api/subjects'),

  getCareers: () => apiFetch('/api/carreras/'),

  getComments: (postId: number) => apiFetch(`/api/posts/${postId}/comments`),
  addComment: (postId: number, text: string) =>
    apiFetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
};