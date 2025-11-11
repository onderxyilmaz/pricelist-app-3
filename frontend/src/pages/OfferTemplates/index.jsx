import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import TemplatesHeader from './components/TemplatesHeader';
import TemplatesSearch from './components/TemplatesSearch';
import TemplatesTable from './components/TemplatesTable';
import TemplateModal from './components/TemplateModal';
import PreviewModal from './components/PreviewModal';
import { offerTemplatesApi, pricelistApi } from '../../utils/api';
import styles from './OfferTemplates.module.css';

const OfferTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  
  // Modal states
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [previewItems, setPreviewItems] = useState([]);
  const [previewLanguage, setPreviewLanguage] = useState('en');
  
  // Submitting state
  const [submitting, setSubmitting] = useState(false);

  // Templates listesini yükle
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await offerTemplatesApi.getTemplates();
      console.log('Templates loaded:', response.data); // Debug log
      if (response.data.success) {
        setTemplates(response.data.templates || []);
        setFilteredTemplates(response.data.templates || []);
        console.log('Templates set:', response.data.templates); // Debug log
      }
    } catch (error) {
      console.error('Templates yüklenirken hata:', error);
      message.error('Templates yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Component mount edildiğinde templates'i yükle
  useEffect(() => {
    document.title = 'Price List App v3 - Offer Templates';
    loadTemplates();
  }, []);

  useEffect(() => {
    return () => {
      document.title = 'Price List App v3';
    };
  }, []);

  // Arama filtresi
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredTemplates(templates);
    } else {
      const filtered = templates.filter(template =>
        template.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchText.toLowerCase()) ||
        template.creator_first_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        template.creator_last_name?.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredTemplates(filtered);
    }
  }, [searchText, templates]);

  // Arama metni değişikliği
  const handleSearch = (value) => {
    setSearchText(value);
  };

  // Yeni template oluşturma
  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateModalVisible(true);
  };

  // Template düzenleme
  const handleEditTemplate = async (template) => {
    try {
      setLoading(true);
      setEditingTemplate(template);
      
      // Template detaylarını yükle
      const response = await offerTemplatesApi.getTemplateItems(template.id);
      if (response.data.success) {
        const templateWithItems = {
          ...template,
          items: response.data.items
        };
        setEditingTemplate(templateWithItems);
        setTemplateModalVisible(true);
      } else {
        throw new Error('Template detayları yüklenemedi');
      }
    } catch (error) {
      console.error('Template düzenleme hatası:', error);
      message.error('Template detayları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Template önizleme
  const handlePreviewTemplate = async (template) => {
    console.log('Preview template clicked:', template); // Debug log
    try {
      setLoading(true);
      
      // Template items ve fiyat listesi bilgilerini al
      console.log('Fetching items and pricelists for template:', template.id); // Debug log
      const [itemsResponse, pricelistsResponse] = await Promise.all([
        offerTemplatesApi.getTemplateItems(template.id),
        offerTemplatesApi.getPricelistsWithItems()
      ]);
      
      if (itemsResponse.data.success && pricelistsResponse.data.success) {
        // Fiyat listesi bilgilerini template items ile eşleştir
        const pricelistsMap = {};
        pricelistsResponse.data.pricelists.forEach(pricelist => {
          pricelistsMap[pricelist.id] = {
            name: pricelist.name,
            color: pricelist.color || '#1890ff'
          };
        });
        
        // Template items'lara fiyat listesi bilgilerini ekle
        const enrichedItems = itemsResponse.data.items.map(item => ({
          ...item,
          pricelistName: pricelistsMap[item.pricelist_id]?.name || `Fiyat Listesi ${item.pricelist_id}`,
          pricelistColor: pricelistsMap[item.pricelist_id]?.color || '#1890ff'
        }));
        
        setPreviewTemplate(template);
        setPreviewItems(enrichedItems);
        setPreviewModalVisible(true);
      } else {
        throw new Error('Template önizlemesi yüklenemedi');
      }
    } catch (error) {
      console.error('Template önizleme hatası:', error);
      message.error('Template önizlemesi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Template silme
  const handleDeleteTemplate = async (templateId) => {
    try {
      setLoading(true);
      
      const response = await offerTemplatesApi.deleteTemplate(templateId);
      if (response.data.success) {
        message.success('Template başarıyla silindi');
        await loadTemplates(); // Listeyi yenile
      } else {
        throw new Error('Template silinemedi');
      }
    } catch (error) {
      console.error('Template silme hatası:', error);
      message.error(error.message || 'Template silinirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Template kaydetme (oluşturma/güncelleme)
  const handleSubmitTemplate = async (templateData) => {
    try {
      setSubmitting(true);
      
      if (editingTemplate) {
        const response = await offerTemplatesApi.updateTemplate(editingTemplate.id, templateData);
        if (response.data.success) {
          message.success('Template güncellendi');
          await loadTemplates(); // Listeyi yenile
        }
      } else {
        const response = await offerTemplatesApi.createTemplate(templateData);
        if (response.data.success) {
          message.success('Template oluşturuldu');
          await loadTemplates(); // Listeyi yenile
        }
      }
    } catch (error) {
      console.error('Template kaydetme hatası:', error);
      message.error(error.message || 'Template kaydedilirken hata oluştu');
      throw error; // Modal'ın kapanmasını engellemek için hatayı yeniden fırlat
    } finally {
      setSubmitting(false);
    }
  };

  // Modal kapatma
  const handleCloseTemplateModal = () => {
    setTemplateModalVisible(false);
    setEditingTemplate(null);
  };

  const handleClosePreviewModal = () => {
    setPreviewModalVisible(false);
    setPreviewTemplate(null);
    setPreviewItems([]);
    setPreviewLanguage('en');
  };

  // Önizleme dili değişikliği
  const handlePreviewLanguageChange = (language) => {
    setPreviewLanguage(language);
  };

  return (
    <div className={styles.templatesContainer}>
      <TemplatesHeader onCreateTemplate={handleCreateTemplate} />
      
      <TemplatesSearch
        value={searchText}
        onChange={handleSearch}
        placeholder="Template ara..."
      />

      <TemplatesTable
        templates={filteredTemplates}
        loading={loading}
        onPreview={handlePreviewTemplate}
        onEdit={handleEditTemplate}
        onDelete={handleDeleteTemplate}
      />

      {/* Template Oluşturma/Düzenleme Modal */}
      <TemplateModal
        visible={templateModalVisible}
        onCancel={handleCloseTemplateModal}
        onSubmit={handleSubmitTemplate}
        editingTemplate={editingTemplate}
        loading={submitting}
      />

      {/* Template Önizleme Modal */}
      <PreviewModal
        visible={previewModalVisible}
        template={previewTemplate}
        items={previewItems}
        language={previewLanguage}
        onLanguageChange={handlePreviewLanguageChange}
        onClose={handleClosePreviewModal}
      />
    </div>
  );
};

export default OfferTemplates;
