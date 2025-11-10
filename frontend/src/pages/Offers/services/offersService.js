// API services for offers
import axios from 'axios';
import { API_BASE_URL } from '../../../config/env';

const API_URL = `${API_BASE_URL}/api`;

export const offersService = {
  // Tüm teklifleri getir
  getAllOffers: async () => {
    const response = await axios.get(`${API_URL}/offers`);
    return response.data;
  },
  
  // Teklif detaylarını getir
  getOfferById: async (id) => {
    const response = await axios.get(`${API_URL}/offers/${id}`);
    return response.data;
  },

  // Teklif detayları ve ürünlerini getir
  getOfferDetails: async (id) => {
    const response = await axios.get(`${API_URL}/offers/${id}/details`);
    return response.data;
  },
  
  // Yeni teklif oluştur
  createOffer: async (offerData) => {
    const response = await axios.post(`${API_URL}/offers`, offerData);
    return response.data;
  },
  
  // Teklif güncelle
  updateOffer: async (id, offerData) => {
    const response = await axios.put(`${API_URL}/offers/${id}`, offerData);
    return response.data;
  },
  
  // Teklif sil
  deleteOffer: async (id) => {
    const response = await axios.delete(`${API_URL}/offers/${id}`);
    return response.data;
  },

  // Teklif numarası kontrolü
  checkOfferNumber: async (offerNo) => {
    if (!offerNo || offerNo.trim() === '') return true;
    
    try {
      const response = await axios.get(`${API_URL}/offers`);
      if (response.data.success) {
        const existingOffer = response.data.offers.find(offer => 
          offer.offer_no === offerNo.trim()
        );
        return !existingOffer; // Yoksa true, varsa false
      }
    } catch (error) {
      console.error('Offer number check error:', error);
    }
    return true;
  },

  // Firmaları getir
  fetchCompanies: async () => {
    try {
      const response = await axios.get(`${API_URL}/companies`);
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Companies fetch error:', error);
      throw error;
    }
  },

  // Müşteri ara
  searchCustomers: async (searchText) => {
    try {
      if (!searchText || searchText.trim().length < 1) {
        return [];
      }

      const response = await axios.get(`${API_URL}/customers/search`, {
        params: { query: searchText.trim() }
      });
      
      if (response.data.success) {
        return response.data.customers.map(customer => ({
          value: customer,
          label: customer
        }));
      }
      return [];
    } catch (error) {
      console.error('Customer search error:', error);
      return [];
    }
  },

  // Sonraki teklif numarasını getir
  getNextOfferNumber: async () => {
    const response = await axios.get(`${API_URL}/offers/next-number`);
    return response.data;
  },

  // Boş teklif numaralarını getir
  getAvailableOfferNumbers: async () => {
    const response = await axios.get(`${API_URL}/offers/available-numbers`);
    return response.data;
  },

  // Teklif ürünlerini kaydet
  saveOfferItems: async (offerId, items) => {
    const response = await axios.post(`${API_URL}/offers/${offerId}/items`, { items });
    return response.data;
  },

  // Teklif ürünlerini getir
  getOfferItems: async (offerId) => {
    const response = await axios.get(`${API_URL}/offers/${offerId}/items`);
    return response.data;
  }
};