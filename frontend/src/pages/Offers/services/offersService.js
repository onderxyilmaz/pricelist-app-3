// API services for offers
import { offersApi, companyApi } from '../../../utils/api';

export const offersService = {
  // Tüm teklifleri getir
  getAllOffers: async () => {
    const response = await offersApi.getOffers();
    return response.data;
  },
  
  // Teklif detaylarını getir
  getOfferById: async (id) => {
    const response = await offersApi.getOfferById(id);
    return response.data;
  },

  // Teklif detayları ve ürünlerini getir
  getOfferDetails: async (id) => {
    const response = await offersApi.getOfferDetails(id);
    return response.data;
  },
  
  // Yeni teklif oluştur
  createOffer: async (offerData) => {
    const response = await offersApi.createOffer(offerData);
    return response.data;
  },
  
  // Teklif güncelle
  updateOffer: async (id, offerData) => {
    const response = await offersApi.updateOffer(id, offerData);
    return response.data;
  },
  
  // Teklif sil
  deleteOffer: async (id) => {
    const response = await offersApi.deleteOffer(id);
    return response.data;
  },

  // Teklif numarası kontrolü
  checkOfferNumber: async (offerNo) => {
    if (!offerNo || offerNo.trim() === '') return true;
    
    try {
      const response = await offersApi.getOffers();
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
      const response = await companyApi.getCompanies();
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.success && Array.isArray(response.data.companies)) {
        return response.data.companies;
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

      const response = await offersApi.searchCustomers(searchText.trim());
      
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
    const response = await offersApi.getNextOfferNumber();
    return response.data;
  },

  // Boş teklif numaralarını getir
  getAvailableOfferNumbers: async () => {
    const response = await offersApi.getAvailableOfferNumbers();
    return response.data;
  },

  // Teklif ürünlerini kaydet
  saveOfferItems: async (offerId, items) => {
    const response = await offersApi.saveOfferItems(offerId, items);
    return response.data;
  },

  // Teklif ürünlerini getir
  getOfferItems: async (offerId) => {
    const response = await offersApi.getOfferItems(offerId);
    return response.data;
  }
};