// TemplateStep - Step 2 (Template Mode): Template Seçimi
import React, { useState, useEffect } from 'react';
import { Table, Input, Tag, Button, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import axios from 'axios';
import NotificationService from '../../../../utils/notification';
import styles from './OfferWizard.module.css';

const { Search } = Input;

const TemplateStep = ({ 
  offerData,
  onNext,
  onPrev,
  selectedTemplate,
  setSelectedTemplate,
  templateFilter,
  setTemplateFilter,
  pricelists,
  setSelectedItems
}) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTemplates();
    
    // Autofocus - Template arama alanı
    const tryFocus = (attempt = 0) => {
      const templateSearchInput = document.querySelector('input[placeholder="Template ara..."]');
      if (templateSearchInput && templateSearchInput.offsetParent !== null) {
        templateSearchInput.focus();
      } else if (attempt < 5) {
        setTimeout(() => tryFocus(attempt + 1), 100);
      }
    };
    setTimeout(() => tryFocus(), 100);
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3000/api/offer-templates');
      if (response.data.success) {
        setTemplates(response.data.templates || []);
      }
    } catch (error) {
      console.error('Templates fetch error:', error);
      NotificationService.error('Hata', 'Template\'ler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTemplates = () => {
    if (!templateFilter || templateFilter.trim() === '') {
      return templates;
    }
    
    const filterLower = templateFilter.toLowerCase();
    return templates.filter(template => {
      const nameMatch = template.name?.toLowerCase().includes(filterLower);
      const descriptionMatch = template.description?.toLowerCase().includes(filterLower);
      return nameMatch || descriptionMatch;
    });
  };

  const handleNext = async () => {
    if (selectedTemplate) {
      // Template seçilmişse template items'ları yükle
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:3000/api/offer-templates/${selectedTemplate.id}/items`);
        if (response.data.success) {
          // Template'den gelen ürünleri mevcut pricelist items ile eşleştir
          const templateItems = response.data.items.map(templateItem => {
            // Mevcut pricelist'lerde bu ürünü bul
            const currentPricelist = pricelists.find(p => p.id === templateItem.pricelist_id);
            if (currentPricelist && currentPricelist.items) {
              const currentItem = currentPricelist.items.find(item => 
                item.product_id === templateItem.product_id
              );
              
              if (currentItem) {
                // Mevcut item bulundu, güncel bilgilerle birleştir
                return {
                  ...currentItem, // Güncel pricelist item bilgileri
                  id: currentItem.id, // Güncel pricelist_item_id
                  pricelist_id: templateItem.pricelist_id, // Template'deki pricelist_id'yi koru
                  quantity: templateItem.quantity, // Template'deki miktar
                  price: templateItem.price, // Template'deki fiyat
                  total_price: templateItem.quantity * templateItem.price,
                  description_tr: templateItem.description_tr || currentItem.description_tr,
                  description_en: templateItem.description_en || currentItem.description_en,
                  note: templateItem.note || ''
                };
              }
            }
            
            // Eğer mevcut pricelist'te bulunamazsa null döndür (filtrelenecek)
            console.warn('Template item not found in current pricelists:', templateItem);
            return null;
          }).filter(Boolean); // null olanları filtrele
          
          console.log('Template items loaded:', templateItems);
          setSelectedItems(templateItems);
          onNext(); // Ürün seçimi adımına geç
        }
      } catch (error) {
        console.error('Template items error:', error);
        NotificationService.error('Hata', 'Template ürünleri yüklenemedi');
      } finally {
        setLoading(false);
      }
    } else {
      // Template seçilmemişse direkt ürün seçimi adımına geç
      setSelectedItems([]);
      onNext();
    }
  };

  const columns = [
    {
      title: 'Template Adı',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Açıklama',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Ürün Sayısı',
      dataIndex: 'item_count',
      key: 'item_count',
      width: 100,
      align: 'center',
      render: (count) => <Tag color="blue">{count} ürün</Tag>,
    },
    {
      title: 'Oluşturan',
      key: 'creator',
      width: 120,
      render: (_, record) => {
        if (record.creator_first_name && record.creator_last_name) {
          return `${record.creator_first_name} ${record.creator_last_name}`;
        }
        return '-';
      },
    },
    {
      title: 'Seç',
      key: 'select',
      width: 80,
      render: (_, record) => (
        <Button
          type={selectedTemplate?.id === record.id ? 'primary' : 'default'}
          size="small"
          onClick={() => {
            // Toggle seçimi: eğer zaten seçiliyse kaldır, değilse seç
            if (selectedTemplate?.id === record.id) {
              setSelectedTemplate(null);
            } else {
              setSelectedTemplate(record);
            }
          }}
        >
          {selectedTemplate?.id === record.id ? 'Seçildi' : 'Seç'}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <strong>Teklif:</strong> {offerData.offer_no} | <strong>Müşteri:</strong> {offerData.customer || '-'}
      </div>

      <div style={{ marginBottom: 16 }}>
        <p style={{ color: '#666' }}>Bir template seçin:</p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Search
          placeholder="Template ara..."
          allowClear
          value={templateFilter}
          onChange={(e) => setTemplateFilter(e.target.value)}
          onSearch={(value) => setTemplateFilter(value)}
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
          autoFocus
        />
      </div>

      <Table
        columns={columns}
        dataSource={getFilteredTemplates()}
        rowKey="id"
        pagination={false}
        loading={loading}
        size="small"
      />

      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Space>
          <Button onClick={onPrev}>Önceki Adım</Button>
          <Button 
            type="primary"
            loading={loading}
            onClick={handleNext}
          >
            {selectedTemplate ? 'Template ile Sonraki Adım' : 'Sonraki Adım'}
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default TemplateStep;

