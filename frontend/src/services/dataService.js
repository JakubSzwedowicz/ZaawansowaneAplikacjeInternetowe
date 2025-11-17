import api from './api';

export const dataService = {
  // Series
  async getSeries() {
    const response = await api.get('/series');
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
    const queryParams = new URLSearchParams();
    if (params.series_ids) queryParams.append('series_ids', params.series_ids);
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const queryString = queryParams.toString();
    const response = await api.get(`/measurements${queryString ? '?' + queryString : ''}`);
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
};
