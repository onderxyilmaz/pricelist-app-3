import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Space,
  Collapse,
  Checkbox,
  InputNumber as AntInputNumber,
  message
} from 'antd';
import {
  SearchOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/env';
import styles from '../OfferTemplates.module.css';

const { TextArea } = Input;
const { Search } = Input;
const { Panel } = Collapse;

const TemplateModal = ({
  visible,
  onCancel,
  onSubmit,
  editingTemplate,
  loading
}) => {
  const [form] = Form.useForm();
  const [pricelists, setPricelists] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [itemNotes, setItemNotes] = useState({});
  const [productFilter, setProductFilter] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [expandedPanels, setExpandedPanels] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Modal açıldığında form alanına focus ver
  const handleAfterOpen = () => {
    // Modal açıldıktan sonra form alanına focus ver
    setTimeout(() => {
      const nameInput = document.querySelector('[data-testid="template-name-input"]');
      if (nameInput) {
        nameInput.focus();
      }
    }, 50);
  };

  // Pricelists'i yükle
  const fetchPricelists = async () => {
    try {
      console.log('Fetching pricelists...'); // Debug log
      const response = await axios.get(`${API_BASE_URL}/api/pricelists-with-items`);
      console.log('Pricelists response:', response.data); // Debug log
      if (response.data.success) {
        setPricelists(response.data.pricelists);
        console.log('Pricelists set:', response.data.pricelists); // Debug log
      }
    } catch (error) {
      console.error('Pricelist fetch error:', error); // Debug log
      message.error('Fiyat listeleri yüklenirken hata oluştu');
    }
  };

  // Modal açıldığında pricelists'i yükle
  useEffect(() => {
    if (visible) {
      fetchPricelists();
      
      // Get current user from localStorage
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    }
  }, [visible]);

  // Template düzenlenirken verileri yükle
  useEffect(() => {
    if (editingTemplate && visible && pricelists.length > 0) {
      form.setFieldsValue({
        name: editingTemplate.name,
        description: editingTemplate.description
      });
      
      // Eğer template'in ürünleri varsa seçili hale getir
      if (editingTemplate.items) {
        const selectedPricelistItems = [];
        const notesObj = {};
        
        // Template items'ları pricelist items'larıyla eşleştir
        editingTemplate.items.forEach(templateItem => {
          // İlgili pricelist'i bul
          const pricelist = pricelists.find(p => p.id === templateItem.pricelist_id);
          if (pricelist && pricelist.items) {
            // Pricelist içinde ilgili item'ı bul
            const pricelistItem = pricelist.items.find(item => item.product_id === templateItem.product_id);
            if (pricelistItem) {
              // Seçili item'ı oluştur (pricelist item data'sı + template quantities)
              const selectedItem = {
                ...pricelistItem, // Pricelist item data'sını kullan (doğru id dahil)
                pricelist_id: templateItem.pricelist_id,
                currency: templateItem.currency,
                quantity: templateItem.quantity || 0,
                total_price: templateItem.total_price || 0
              };
              selectedPricelistItems.push(selectedItem);
              
              // Not varsa ekle (pricelist item id'sini kullan)
              if (templateItem.note) {
                notesObj[pricelistItem.id] = templateItem.note;
              }
            }
          }
        });
        
        console.log('Matched selected items:', selectedPricelistItems); // Debug log
        console.log('Notes object:', notesObj); // Debug log
        
        setSelectedItems(selectedPricelistItems);
        setItemNotes(notesObj);
      }
    }
  }, [editingTemplate, visible, form, pricelists]);

  // Ürünleri filtrele
  const filterItems = (items) => {
    if (!productFilter.trim()) return items || [];
    
    const searchText = productFilter.toLowerCase();
    return (items || []).filter(item => {
      const nameMatch = (item.name_tr || '').toLowerCase().includes(searchText) ||
                       (item.name_en || '').toLowerCase().includes(searchText) ||
                       (item.name || '').toLowerCase().includes(searchText);
      const idMatch = (item.product_id || '').toLowerCase().includes(searchText);
      const descMatch = (item.description_tr || '').toLowerCase().includes(searchText) ||
                       (item.description_en || '').toLowerCase().includes(searchText) ||
                       (item.description || '').toLowerCase().includes(searchText);
      
      return nameMatch || idMatch || descMatch;
    });
  };

  // Ürün seçimi
  const handleItemSelection = (item, checked) => {
    if (checked) {
      const newItem = {
        ...item,
        quantity: 0,
        total_price: 0
      };
      setSelectedItems([...selectedItems, newItem]);
    } else {
      setSelectedItems(selectedItems.filter(selected => selected.id !== item.id));
      // Remove notes for unselected items
      const newNotes = { ...itemNotes };
      delete newNotes[item.id];
      setItemNotes(newNotes);
    }
  };

  // Miktar değişikliği
  const handleQuantityChange = (itemId, quantity) => {
    setSelectedItems(selectedItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity: quantity || 0,
          total_price: (quantity || 0) * item.price
        };
      }
      return item;
    }));
  };

  // Not değişikliği
  const handleNoteChange = (itemId, note) => {
    setItemNotes({
      ...itemNotes,
      [itemId]: note
    });
  };

  // Para formatı
  const formatCurrency = (amount, currency) => {
    return `${parseFloat(amount || 0).toFixed(2)} ${currency}`;
  };

  // Form gönderimi
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (selectedItems.length === 0) {
        message.warning('En az bir ürün seçmelisiniz');
        return;
      }

      if (!currentUser) {
        message.error('Kullanıcı bilgisi bulunamadı');
        return;
      }

      const templateData = {
        name: values.name,
        description: values.description,
        items: selectedItems.map(item => ({
          product_id: item.product_id,
          pricelist_id: item.pricelist_id,
          quantity: item.quantity || 0,
          price: item.price,
          total_price: item.total_price || 0,
          currency: item.currency,
          name_tr: item.name_tr,
          name_en: item.name_en,
          description_tr: item.description_tr,
          description_en: item.description_en,
          note: itemNotes[item.id] || ''
        }))
      };

      // Add user ID based on operation
      if (editingTemplate) {
        templateData.updated_by = currentUser.id;
      } else {
        templateData.created_by = currentUser.id;
      }

      await onSubmit(templateData);
      handleCancel();
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  // Modal kapatma
  const handleCancel = () => {
    form.resetFields();
    setSelectedItems([]);
    setItemNotes({});
    setProductFilter('');
    setSelectedLanguage('en');
    setExpandedPanels([]);
    onCancel();
  };

  return (
    <Modal
      title={editingTemplate ? 'Template Düzenle' : 'Yeni Template'}
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={1000}
      style={{ top: 20 }}
      className={styles.templateModal}
      destroyOnClose
      afterOpenChange={(open) => {
        if (open) {
          handleAfterOpen();
        }
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        <Form.Item
          name="name"
          label="Template Adı"
          rules={[{ required: true, message: 'Template adı gereklidir!' }]}
        >
          <Input 
            placeholder="Template adını girin" 
            autoComplete="off"
            autoFocus
            data-testid="template-name-input"
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Açıklama"
        >
          <TextArea 
            rows={2} 
            placeholder="Template açıklamasını girin" 
            autoComplete="off"
          />
        </Form.Item>

        {/* Language Selection */}
        <div style={{ marginBottom: 16, textAlign: 'center' }}>
          <Button.Group>
            <Button
              type={selectedLanguage === 'en' ? 'primary' : 'default'}
              onClick={() => setSelectedLanguage('en')}
              size="small"
              style={{ 
                backgroundColor: selectedLanguage === 'en' ? '#1890ff' : '#f0f0f0',
                color: selectedLanguage === 'en' ? 'white' : '#000'
              }}
            >
              EN
            </Button>
            <Button
              type={selectedLanguage === 'tr' ? 'primary' : 'default'}
              onClick={() => setSelectedLanguage('tr')}
              size="small"
              style={{ 
                backgroundColor: selectedLanguage === 'tr' ? '#52c41a' : '#f0f0f0',
                color: selectedLanguage === 'tr' ? 'white' : '#000'
              }}
            >
              TR
            </Button>
          </Button.Group>
        </div>

        {/* Product Search */}
        <div style={{ marginBottom: 16 }}>
          <Search
            placeholder="Ürün ara... (ürün adı, ID veya açıklama)"
            allowClear
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            style={{ width: '100%' }}
            prefix={<SearchOutlined />}
            autoComplete="off"
          />
        </div>

        {/* No results message */}
        {productFilter.trim() && pricelists.every(pricelist => filterItems(pricelist.items).length === 0) && (
          <div style={{ 
            textAlign: 'center', 
            padding: 40, 
            color: '#999',
            backgroundColor: '#f9f9f9',
            borderRadius: 6,
            marginBottom: 16 
          }}>
            <SearchOutlined style={{ fontSize: 24, marginBottom: 8 }} />
            <div>"{productFilter}" için ürün bulunamadı</div>
            <div style={{ fontSize: '12px', marginTop: 4 }}>Farklı bir arama terimi deneyin</div>
          </div>
        )}

        {/* Product Selection */}
        <Collapse 
          activeKey={expandedPanels}
          onChange={(keys) => setExpandedPanels(keys)}
          className={styles.pricelistCollapse}
        >
          {pricelists.map(pricelist => {
            const filteredItems = filterItems(pricelist.items);
            if (filteredItems.length === 0 && productFilter.trim()) {
              return null;
            }
            return (
              <Panel 
                header={`${pricelist.name} (${pricelist.currency}) - ${filteredItems.length}/${pricelist.items.length} ürün${productFilter.trim() ? ' (filtrelenmiş)' : ''}`}
                key={pricelist.id}
              >
                {filteredItems.map(item => {
                  const isSelected = selectedItems.some(selected => selected.id === item.id);
                  const selectedItem = selectedItems.find(selected => selected.id === item.id);
                  
                  return (
                    <div key={item.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '8px 0',
                      borderBottom: '1px solid #f0f0f0'
                    }}>
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) => handleItemSelection({...item, pricelist_id: pricelist.id, currency: pricelist.currency}, e.target.checked)}
                      />
                      <div style={{ flex: 1, marginLeft: 12 }}>
                        <div><strong>{selectedLanguage === 'tr' ? (item.name_tr || item.name_en || item.name) : (item.name_en || item.name_tr || item.name)}</strong> ({item.product_id})</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {(selectedLanguage === 'tr' ? (item.description_tr || item.description_en || item.description) : (item.description_en || item.description_tr || item.description)) || 'Açıklama yok'} | {item.price} {pricelist.currency} | 
                          <span style={{ 
                            color: item.stock <= 0 ? '#ff4d4f' : item.stock < 10 ? '#ff4d4f' : item.stock < 50 ? '#faad14' : '#52c41a',
                            fontWeight: 'bold',
                            marginLeft: 4
                          }}>
                            Stok: {item.stock} {item.unit}
                          </span>
                          {item.stock <= 0 && <span style={{ color: '#ff4d4f' }}> (Stok Yok!)</span>}
                          {item.stock > 0 && item.stock < 10 && <span style={{ color: '#ff4d4f' }}> (Düşük Stok!)</span>}
                        </div>
                      </div>
                      {isSelected && (
                        <div style={{ marginLeft: 12, display: 'flex', alignItems: 'center' }}>
                          <span style={{ marginRight: 8 }}>Adet:</span>
                          <AntInputNumber
                            min={0}
                            max={item.stock <= 0 ? 0 : item.stock}
                            value={selectedItem?.quantity || 0}
                            onChange={(value) => handleQuantityChange(item.id, value)}
                            disabled={item.stock <= 0}
                            style={{ width: 80 }}
                            autoComplete="off"
                          />
                          <span style={{ marginLeft: 8, fontWeight: 'bold' }}>
                            {formatCurrency(selectedItem?.total_price || 0, pricelist.currency)}
                          </span>
                          {/* Note field */}
                          <Input
                            placeholder="Açıklama (opsiyonel)"
                            value={itemNotes[item.id] || ''}
                            onChange={e => setItemNotes({ ...itemNotes, [item.id]: e.target.value })}
                            style={{ width: 180, marginLeft: 8 }}
                            autoComplete="off"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </Panel>
            );
          })}
        </Collapse>

        {/* Selected Items Summary */}
        <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5', borderRadius: 6 }}>
          <strong>Seçilen Ürünler: {selectedItems.length}</strong>
          {selectedItems.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {selectedItems.map(item => {
                // Her item için doğru pricelist'i bul
                const pricelist = pricelists.find(pl => 
                  pl.items.some(plItem => plItem.id === item.id)
                );
                return (
                  <div key={item.id} style={{ fontSize: '12px' }}>
                    {selectedLanguage === 'tr' ? (item.name_tr || item.name_en || item.name) : (item.name_en || item.name_tr || item.name)} x {item.quantity} = {formatCurrency(item.total_price, pricelist?.currency || 'EUR')}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Form Buttons */}
        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Space>
            <Button onClick={handleCancel}>
              İptal
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={selectedItems.length === 0}
            >
              {editingTemplate ? 'Güncelle' : 'Oluştur'}
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

export default TemplateModal;