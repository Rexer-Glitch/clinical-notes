const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`
  : '/api';

function getStoredToken() {
  return localStorage.getItem('clinical_auth_token') || '';
}

function setStoredAuth(token, user) {
  if (token) {
    localStorage.setItem('clinical_auth_token', token);
  } else {
    localStorage.removeItem('clinical_auth_token');
  }
  if (user) {
    localStorage.setItem('clinical_auth_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('clinical_auth_user');
  }
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem('clinical_auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

async function request(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Handle FormData
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  let text = '';
  let data = null;
  try {
    text = await response.text();
    data = JSON.parse(text);
  } catch (e) {
    data = null;
  }

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    if (data && data.error) {
      errorMsg = data.error;
    } else if (response.status === 404) {
      errorMsg = 'Backend API endpoint not found (404). If running on Vercel, please set VITE_API_URL to your live backend server (e.g. on Render).';
    } else if (text && text.length < 200 && !text.includes('<!DOCTYPE')) {
      errorMsg = text;
    } else {
      errorMsg = `Server error (${response.status}): ${response.statusText || 'Unable to connect to backend'}`;
    }
    throw new Error(errorMsg);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return data !== null ? data : {};
  }
  return response;
}

export const api = {
  auth: {
    async login(username, password) {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      setStoredAuth(data.token, data.user);
      return data;
    },
    async register(userData) {
      const data = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      setStoredAuth(data.token, data.user);
      return data;
    },
    async me() {
      return await request('/auth/me');
    },
    logout() {
      setStoredAuth(null, null);
    },
    getCurrentUser() {
      return getStoredUser();
    },
    getToken() {
      return getStoredToken();
    }
  },

  notes: {
    async list(filters = {}) {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.search) params.append('search', filters.search);
      if (filters.ward) params.append('ward', filters.ward);
      const query = params.toString() ? `?${params.toString()}` : '';
      return await request(`/notes${query}`);
    },
    async get(id) {
      return await request(`/notes/${id}`);
    },
    async create(noteData) {
      return await request('/notes', {
        method: 'POST',
        body: JSON.stringify(noteData)
      });
    },
    async update(id, noteData) {
      return await request(`/notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(noteData)
      });
    },
    async delete(id) {
      return await request(`/notes/${id}`, {
        method: 'DELETE'
      });
    },
    async getPreview(id) {
      return await request(`/notes/${id}/export/preview`);
    },
    async updateDesign(id, designData) {
      return await request(`/notes/${id}/design`, {
        method: 'PATCH',
        body: JSON.stringify(designData)
      });
    },
    getExportDocxUrl(id, template = '') {
      const q = template ? `?template=${encodeURIComponent(template)}` : '';
      return `${API_BASE}/notes/${id}/export/docx${q}`;
    }
  },

  templates: {
    async list(type = '') {
      const q = type ? `?type=${encodeURIComponent(type)}` : '';
      return await request(`/templates${q}`);
    },
    async listDocxFiles(type = '') {
      const q = type ? `?type=${encodeURIComponent(type)}` : '';
      return await request(`/templates/docx-files${q}`);
    },
    async inspectDocx(formDataOrBody) {
      if (formDataOrBody instanceof FormData) {
        return await request('/templates/inspect-docx', {
          method: 'POST',
          body: formDataOrBody
        });
      }
      return await request('/templates/inspect-docx', {
        method: 'POST',
        body: JSON.stringify(formDataOrBody)
      });
    },
    async createOnlineLayout(layoutData) {
      return await request('/templates/online-layout', {
        method: 'POST',
        body: JSON.stringify(layoutData)
      });
    },
    async get(id) {
      return await request(`/templates/${id}`);
    },
    async createCustom(templateData) {
      return await request('/templates/custom', {
        method: 'POST',
        body: JSON.stringify(templateData)
      });
    },
    async update(id, templateData) {
      return await request(`/templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(templateData)
      });
    },
    async upload(formData) {
      return await request('/templates/upload', {
        method: 'POST',
        body: formData
      });
    },
    async delete(id) {
      return await request(`/templates/${id}`, {
        method: 'DELETE'
      });
    },
    getDownloadUrl(id) {
      return `${API_BASE}/templates/${id}/download`;
    }
  },

  ai: {
    async formatNote(text, apiKey = '') {
      return await request('/ai/format-note', {
        method: 'POST',
        body: JSON.stringify({ text, apiKey })
      });
    }
  }
};
