// src/hooks/useCardFinder.js
import { useState, useCallback } from 'react';
import { useApi } from '../context/ApiContext';

export const useCardFinder = () => {
  const [results, setResults] = useState(null); // null = initial, [] = empty, [...] = success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const api = useApi();

  const search = useCallback(async (categoryName) => {
    if (!categoryName) return;

    setLoading(true);
    setError(null);
    setResults(null); // Clear previous results immediately

    try {
      const data = await api.findBestCard(categoryName);
      setResults(data || []);
    } catch (e) {
      console.error('Card finder error:', e);
      setError('An error occurred while searching. Please check your connection and try again.');
      setResults([]); // Set to empty array on error to show the empty/error state
    } finally {
      setLoading(false);
    }
  }, [api]);

  const clearSearch = useCallback(() => {
    setResults(null);
    setError(null);
    setLoading(false);
  }, []);

  return { results, loading, error, search, clearSearch };
};