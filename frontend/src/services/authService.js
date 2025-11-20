import api from './api';

export const authService = {
  async login(username, password) {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const { access_token } = response.data;
    localStorage.setItem('token', access_token);

    const userResponse = await api.get('/users/me');
    localStorage.setItem('user', JSON.stringify(userResponse.data));

    return userResponse.data;
  },

  async register(username, email, password) {
    const response = await api.post('/auth/register', {
      username,
      email,
      password,
    });
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const token = this.getToken();
    const user = localStorage.getItem('user');
    return token && user ? JSON.parse(user) : null;
  },

  async changePassword(currentPassword, newPassword) {
    const response = await api.patch('/users/me/password', {
      current_password: currentPassword,
      new_password: newPassword
    });
    return response.data;
  },

  getToken() {
    return localStorage.getItem('token');
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  isAdmin() {
    const user = this.getCurrentUser();
    return user?.is_admin || false;
  },
};
