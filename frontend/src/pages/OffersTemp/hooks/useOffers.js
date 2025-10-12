// useOffers hook - Offers data management
import { useState, useCallback } from 'react';
import { offersService } from '../services/offersService';

export const useOffers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
  });

  const fetchOffers = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await offersService.getAllOffers(params);
      
      // Mock data for staging
      const mockOffers = [
        {
          id: 1,
          offer_no: 'OFF-2024-001',
          customer_name: 'Acme Corporation',
          total_amount: 15750.00,
          status: 'sent',
          created_at: '2024-01-15T10:30:00Z',
          valid_until: '2024-02-15T23:59:59Z',
          delivery_days: 7,
          products: [
            {
              id: 1,
              product_name: 'Product A',
              quantity: 10,
              unit_price: 125.50
            },
            {
              id: 2,
              product_name: 'Product B',
              quantity: 5,
              unit_price: 250.00
            }
          ]
        },
        {
          id: 2,
          offer_no: 'OFF-2024-002',
          customer_name: 'Tech Solutions Ltd.',
          total_amount: 8420.00,
          status: 'draft',
          created_at: '2024-01-16T14:20:00Z',
          valid_until: '2024-02-16T23:59:59Z',
          delivery_days: 10,
          products: []
        },
        {
          id: 3,
          offer_no: 'OFF-2024-003',
          customer_name: 'Global Industries',
          total_amount: 22100.00,
          status: 'accepted',
          created_at: '2024-01-10T09:15:00Z',
          valid_until: '2024-02-10T23:59:59Z',
          delivery_days: 5,
          products: []
        }
      ];

      setOffers(mockOffers);
      setPagination(prev => ({
        ...prev,
        total: mockOffers.length,
        current: params.page || 1,
        pageSize: params.pageSize || 10
      }));
    } catch (error) {
      console.error('Failed to fetch offers:', error);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createOffer = useCallback(async (offerData) => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await offersService.createOffer(offerData);
      console.log('Creating offer:', offerData);
      
      // Mock success
      return { success: true, id: Date.now() };
    } catch (error) {
      console.error('Failed to create offer:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOffer = useCallback(async (id, offerData) => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await offersService.updateOffer(id, offerData);
      console.log('Updating offer:', id, offerData);
      
      // Mock success
      return { success: true };
    } catch (error) {
      console.error('Failed to update offer:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteOffer = useCallback(async (id) => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // await offersService.deleteOffer(id);
      console.log('Deleting offer:', id);
      
      // Mock success
      return { success: true };
    } catch (error) {
      console.error('Failed to delete offer:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const duplicateOffer = useCallback(async (id) => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await offersService.duplicateOffer(id);
      console.log('Duplicating offer:', id);
      
      // Mock success
      return { success: true, id: Date.now() };
    } catch (error) {
      console.error('Failed to duplicate offer:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    offers,
    loading,
    pagination,
    fetchOffers,
    createOffer,
    updateOffer,
    deleteOffer,
    duplicateOffer
  };
};