import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set auth token for all requests if exists
api.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem('user')
      ? JSON.parse(localStorage.getItem('user'))
      : null;

    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// API methods for movies
export const movieAPI = {
  getPopular: (page = 1) => api.get(`/movies/popular?page=${page}`),
  getTrending: (timeWindow = 'day') => api.get(`/movies/trending/${timeWindow}`),
  getDetails: (id) => api.get(`/movies/${id}`),
  getReviews: (id, type = 'movie', page = 1) => api.get(`/movies/${type}/${id}/reviews?page=${page}`),
  search: (query, page = 1) => api.get(`/movies/search?query=${query}&page=${page}`),
};

// API methods for TV shows
export const tvAPI = {
  getPopular: (page = 1) => api.get(`/movies/tv/popular?page=${page}`),
  getDetails: (id) => api.get(`/movies/tv/${id}`),
};

// API methods for users
export const userAPI = {
  register: (userData) => api.post('/users/register', userData),
  login: (userData) => api.post('/users/login', userData),
  getProfile: () => api.get('/users/profile'),
  getWatchlist: () => api.get('/users/watchlist'),
  addToWatchlist: (mediaId, mediaType, title, posterPath) =>
    api.post('/users/watchlist', { mediaId, mediaType, title, posterPath }),
  removeFromWatchlist: (mediaId) =>
    api.delete(`/users/watchlist/${mediaId}`),
  submitReview: (mediaId, mediaType, data) =>
    api.post('/reviews', { mediaId, mediaType, ...data }),
  getUserReviews: () => api.get('/reviews'),
  deleteReview: (reviewId) => api.delete(`/reviews/${reviewId}`),
};

// Helper functions for image URLs
export const getImageUrl = {
  poster: (path, size = 'w500') =>
    path ? `${TMDB_IMAGE_BASE_URL}/${size}${path}` : '/placeholder-poster.jpg',
  backdrop: (path, size = 'original') =>
    path ? `${TMDB_IMAGE_BASE_URL}/${size}${path}` : '/placeholder-backdrop.jpg',
  profile: (path, size = 'w185') =>
    path ? `${TMDB_IMAGE_BASE_URL}/${size}${path}` : '/placeholder-profile.jpg',
};

export default api; 