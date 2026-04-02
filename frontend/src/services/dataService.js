import api from './api';

export const dataService = {
  // Series
  async getSeries(params = {}) {
    const q = new URLSearchParams();
    if (params.q) q.append('q', params.q);
    if (params.tag) q.append('tag', params.tag);
    if (params.location_id) q.append('location_id', params.location_id);
    if (params.creator_id) q.append('creator_id', params.creator_id);
    const response = await api.get(`/series${q.toString() ? '?' + q : ''}`);
    return response.data;
  },

  async createSeries(data) {
    const response = await api.post('/series', data);
    return response.data;
  },

  async updateSeries(id, data) {
    const response = await api.put(`/series/${id}`, data);
    return response.data;
  },

  async deleteSeries(id) {
    await api.delete(`/series/${id}`);
  },

  // Measurements
  async getMeasurements(params = {}) {
    const q = new URLSearchParams();
    if (params.series_ids) q.append('series_ids', params.series_ids);
    if (params.start_date) q.append('start_date', params.start_date);
    if (params.end_date) q.append('end_date', params.end_date);
    if (params.limit) q.append('limit', params.limit);
    if (params.q) q.append('q', params.q);
    if (params.quality) q.append('quality', params.quality);
    const response = await api.get(`/measurements${q.toString() ? '?' + q : ''}`);
    return response.data;
  },

  async createMeasurement(data) {
    const response = await api.post('/measurements', data);
    return response.data;
  },

  async updateMeasurement(id, data) {
    const response = await api.put(`/measurements/${id}`, data);
    return response.data;
  },

  async deleteMeasurement(id) {
    await api.delete(`/measurements/${id}`);
  },

  // Locations
  async getLocations() {
    const response = await api.get('/locations');
    return response.data;
  },

  async createLocation(data) {
    const response = await api.post('/locations', data);
    return response.data;
  },

  async updateLocation(id, data) {
    const response = await api.put(`/locations/${id}`, data);
    return response.data;
  },

  async deleteLocation(id) {
    await api.delete(`/locations/${id}`);
  },

  // Tags
  async getTags(q) {
    const params = q ? `?q=${encodeURIComponent(q)}` : '';
    const response = await api.get(`/tags${params}`);
    return response.data;
  },

  async deleteTag(id) {
    await api.delete(`/tags/${id}`);
  },

  // Users (admin)
  async getUsers() {
    const response = await api.get('/users');
    return response.data;
  },

  async blockUser(id) {
    const response = await api.patch(`/users/${id}/block`);
    return response.data;
  },

  async unblockUser(id) {
    const response = await api.patch(`/users/${id}/unblock`);
    return response.data;
  },

  async getNewContent() {
    const response = await api.get('/users/me/new-content');
    return response.data;
  },
};
