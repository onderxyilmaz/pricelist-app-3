// useFilters hook - Filter state management
import { useState, useCallback, useEffect } from 'react';

export const useFilters = () => {
  const [filters, setFilters] = useState({
    searchTerm: '',
    status: '',
    customer: '',
    dateRange: []
  });

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load customers on mount
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await customersService.getAllCustomers();
      
      // Mock customer data
      const mockCustomers = [
        { id: 1, name: 'Acme Corporation' },
        { id: 2, name: 'Tech Solutions Ltd.' },
        { id: 3, name: 'Global Industries' },
        { id: 4, name: 'Digital Works Inc.' },
        { id: 5, name: 'Innovation Partners' }
      ];
      
      setCustomers(mockCustomers);
    } catch (error) {
      console.error('Failed to load customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      status: '',
      customer: '',
      dateRange: []
    });
  }, []);

  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.status) count++;
    if (filters.customer) count++;
    if (filters.dateRange && filters.dateRange.length > 0) count++;
    return count;
  }, [filters]);

  const hasActiveFilters = useCallback(() => {
    return getActiveFiltersCount() > 0;
  }, [getActiveFiltersCount]);

  return {
    filters,
    customers,
    loading,
    updateFilter,
    clearFilters,
    getActiveFiltersCount,
    hasActiveFilters,
    loadCustomers
  };
};