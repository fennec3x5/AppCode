// src/context/ApiContext.js
import React, { createContext, useContext } from 'react';
import axios from 'axios';
import { API_KEY } from '../config/ApiSecrets';
import { useAuth } from './AuthContext';

const ApiContext = createContext();
const API_BASE_URL = 'https://api-ynyot3ho2q-uc.a.run.app';

export const ApiProvider = ({ children }) => {
  const { token, refreshToken } = useAuth();

  // Create axios instance with default config
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    timeout: 10000,
  });

  // Add request interceptor to include auth token
  api.interceptors.request.use(
    async (config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log('API Request:', config.method.toUpperCase(), config.url);
      return config;
    },
    (error) => {
      console.error('API Request Error:', error);
      return Promise.reject(error);
    }
  );

  // Add response interceptor for token refresh
  api.interceptors.response.use(
    (response) => {
      console.log('API Response:', response.status, response.config.url);
      return response;
    },
    async (error) => {
      console.error('API Response Error:', error.response?.status, error.message);
      
      // If token expired, try to refresh
      if (error.response?.status === 401 && error.response?.data?.error === 'Invalid token') {
        try {
          const newToken = await refreshToken();
          if (newToken) {
            // Retry the original request with new token
            error.config.headers.Authorization = `Bearer ${newToken}`;
            return api.request(error.config);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
      }
      
      return Promise.reject(error);
    }
  );

  const apiService = {
    // Cards endpoints
    getCards: async () => {
      try {
        const response = await api.get('/cards');
        return response.data;
      } catch (error) {
        console.error('Error fetching cards:', error);
        throw error;
      }
    },

    getCard: async (cardId) => {
      try {
        const response = await api.get(`/cards/${cardId}`);
        return response.data;
      } catch (error) {
        console.error(`Error fetching card ${cardId}:`, error);
        throw error;
      }
    },
    
    createCard: async (cardData) => {
      try {
        const response = await api.post('/cards', cardData);
        return response.data;
      } catch (error) {
        console.error('Error creating card:', error);
        throw error;
      }
    },
    
    updateCard: async (cardId, cardData) => {
      try {
        const response = await api.put(`/cards/${cardId}`, cardData);
        return response.data;
      } catch (error) {
        console.error('Error updating card:', error);
        throw error;
      }
    },
    
    deleteCard: async (cardId) => {
      try {
        await api.delete(`/cards/${cardId}`);
      } catch (error) {
        console.error('Error deleting card:', error);
        throw error;
      }
    },
    
    // Bonuses endpoints
    createBonus: async (cardId, bonusData) => {
      try {
        const response = await api.post(`/cards/${cardId}/bonuses`, bonusData);
        return response.data;
      } catch (error) {
        console.error('Error creating bonus:', error);
        throw error;
      }
    },
    
    updateBonus: async (cardId, bonusId, bonusData) => {
      try {
        const response = await api.put(`/cards/${cardId}/bonuses/${bonusId}`, bonusData);
        return response.data;
      } catch (error) {
        console.error('Error updating bonus:', error);
        throw error;
      }
    },
    
    deleteBonus: async (cardId, bonusId) => {
      try {
        await api.delete(`/cards/${cardId}/bonuses/${bonusId}`);
      } catch (error) {
        console.error('Error deleting bonus:', error);
        throw error;
      }
    },
    
    // Best card endpoint
    findBestCard: async (category) => {
      try {
        const response = await api.get('/best-card', { 
          params: { category } 
        });
        return response.data;
      } catch (error) {
        console.error('Error finding best card:', error);
        throw error;
      }
    },

    // User endpoints
    getUserProfile: async () => {
      try {
        const response = await api.get('/user/profile');
        return response.data;
      } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
      }
    },

    updateUserCategories: async (customCategories) => {
      try {
        const response = await api.put('/user/categories', { customCategories });
        return response.data;
      } catch (error) {
        console.error('Error updating user categories:', error);
        throw error;
      }
    },
  };

  return (
    <ApiContext.Provider value={apiService}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within ApiProvider');
  }
  return context;
};