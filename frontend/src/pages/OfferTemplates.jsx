import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Popconfirm,
  Tag,
  message,
  Collapse,
  Checkbox,
  InputNumber as AntInputNumber,
  notification
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FormOutlined,
  EyeOutlined
} from '@ant-design/icons';
import axios from 'axios';
import NotificationService from '../utils/notification';

const { Title } = Typography;
const { Search } = Input;
const { Panel } = Collapse;

const OfferTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [form] = Form.useForm();
  const [currentUser, setCurrentUser] = useState(null);
  
  // Preview modal states
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [previewItems, setPreviewItems] = useState([]);
  const [previewLanguage, setPreviewLanguage] = useState('en');
  
  // Template creation states
  const [pricelists, setPricelists] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [itemNotes, setItemNotes] = useState({});
  const [productFilter, setProductFilter] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [expandedPanels, setExpandedPanels] = useState([]);

  // Filtreleme state'leri
  const [templateFilter, setTemplateFilter] = useState('');
  const [filteredTemplates, setFilteredTemplates] = useState([]);

  useEffect(() => {
    document.title = 'Price List App v3 - Teklif Templates';
    
    // Get current user from localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    
    fetchTemplates();
  }, []);

  useEffect(() => {
    return () => {
      document.title = 'Price List App v3';
    };
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/api/offer-templates');
      if (response.data.success) {
        setTemplates(response.data.templates);
      }
    } catch (error) {
      NotificationService.error('Hata', 'Teklif template\'leri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Filtreleme fonksiyonu
  const applyFilters = () => {
    let filtered = [...templates];

    // Template adı filtresi
    if (templateFilter.trim()) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(templateFilter.toLowerCase())
      );
    }

    setFilteredTemplates(filtered);
  };

  // Templates ve filtre değiştiğinde filtrelemeyi uygula
  useEffect(() => {
    applyFilters();
  }, [templates, templateFilter]);

  const fetchPricelists = async () => {
    try {
      console.log('Fetching pricelists...'); // Debug log
      const response = await axios.get('http://localhost:3001/api/pricelists-with-items');
      console.log('Pricelists response:', response.data); // Debug log
      if (response.data.success) {
        setPricelists(response.data.pricelists);
        console.log('Pricelists set:', response.data.pricelists); // Debug log
      }
    } catch (error) {
      console.error('Pricelist fetch error:', error); // Debug log
      NotificationService.error('Hata', 'Fiyat listeleri yüklenirken hata oluştu');
    }
  };

  const resetModalState = () => {
    setSelectedItems([]);
    setItemNotes({});
    setProductFilter('');
    setSelectedLanguage('en');
    setExpandedPanels([]);
    form.resetFields();
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    resetModalState();
    fetchPricelists();
    setModalVisible(true);
  };

  const handleEdit = async (template) => {
    setEditingTemplate(template);
    resetModalState(); // Reset modal state first
    
    form.setFieldsValue({
      name: template.name,
      description: template.description
    });
    
    // First fetch pricelists, then load template items
    try {
      console.log('Fetching pricelists for edit...'); // Debug log
      const pricelistResponse = await axios.get('http://localhost:3001/api/pricelists-with-items');
      console.log('Pricelists response:', pricelistResponse.data); // Debug log
      
      if (pricelistResponse.data.success) {
        setPricelists(pricelistResponse.data.pricelists);
        
        // Now load template items
        const templateResponse = await axios.get(`http://localhost:3001/api/offer-templates/${template.id}/items`);
        console.log('Template items response:', templateResponse.data); // Debug log
        
        if (templateResponse.data.success) {
          const templateItems = templateResponse.data.items;
          const selectedPricelistItems = [];
          const notesObj = {};
          
          // Match template items with pricelist items
          templateItems.forEach(templateItem => {
            // Find the corresponding pricelist
            const pricelist = pricelistResponse.data.pricelists.find(p => p.id === templateItem.pricelist_id);
            if (pricelist && pricelist.items) {
              // Find the corresponding item in the pricelist
              const pricelistItem = pricelist.items.find(item => item.product_id === templateItem.product_id);
              if (pricelistItem) {
                // Create selected item with pricelist item data but template quantities
                const selectedItem = {
                  ...pricelistItem, // Use pricelist item data (includes correct id)
                  pricelist_id: templateItem.pricelist_id,
                  currency: templateItem.currency,
                  quantity: templateItem.quantity,
                  total_price: templateItem.total_price
                };
                selectedPricelistItems.push(selectedItem);
                
                // Add note if exists (use pricelist item id for notes)
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
    } catch (error) {
      console.error('Edit template error:', error); // Debug log
      NotificationService.error('Hata', 'Template verileri yüklenirken hata oluştu');
    }
    
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    if (selectedItems.length === 0) {
      NotificationService.warning('Uyarı', 'En az bir ürün seçmelisiniz');
      return;
    }

    if (!currentUser) {
      NotificationService.error('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }

    const templateData = {
      name: values.name,
      description: values.description,
      items: selectedItems.map(item => ({
        product_id: item.product_id,
        pricelist_id: item.pricelist_id,
        quantity: item.quantity,
        price: item.price,
        total_price: item.total_price,
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

    try {
      if (editingTemplate) {
        const response = await axios.put(`http://localhost:3001/api/offer-templates/${editingTemplate.id}`, templateData);
        if (response.data.success) {
          NotificationService.success('Başarılı', 'Template güncellendi');
          fetchTemplates();
        }
      } else {
        const response = await axios.post('http://localhost:3001/api/offer-templates', templateData);
        if (response.data.success) {
          NotificationService.success('Başarılı', 'Template oluşturuldu');
          fetchTemplates();
        }
      }
      resetModalState();
      setModalVisible(false);
    } catch (error) {
      NotificationService.error('Hata', editingTemplate ? 'Güncelleme başarısız' : 'Oluşturma başarısız');
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`http://localhost:3001/api/offer-templates/${id}`);
      if (response.data.success) {
        NotificationService.success('Başarılı', 'Template silindi');
        fetchTemplates();
      }
    } catch (error) {
      NotificationService.error('Hata', 'Silme işlemi başarısız');
    }
  };

  const handlePreview = async (template) => {
    try {
      setLoading(true);
      
      // Template items ve fiyat listesi bilgilerini al
      const [itemsResponse, pricelistsResponse] = await Promise.all([
        axios.get(`http://localhost:3001/api/offer-templates/${template.id}/items`),
        axios.get('http://localhost:3001/api/pricelists-with-items')
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
        NotificationService.error('Hata', 'Template öğeleri yüklenemedi');
      }
    } catch (error) {
      console.error('Preview error:', error);
      NotificationService.error('Hata', 'Template önizlemesi yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

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

  const formatCurrency = (amount, currency) => {
    return `${parseFloat(amount || 0).toFixed(2)} ${currency}`;
  };

  const columns = [
    {
      title: 'Template Adı',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name, 'tr'),
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
      width: 140,
      align: 'center',
      sorter: (a, b) => a.item_count - b.item_count,
      render: (count) => (
        <Tag color={count > 0 ? 'blue' : 'default'}>
          {count} ürün
        </Tag>
      ),
    },
    {
      title: 'Oluşturan',
      key: 'creator',
      width: 120,
      ellipsis: true,
      render: (_, record) => {
        if (record.creator_first_name && record.creator_last_name) {
          return `${record.creator_first_name} ${record.creator_last_name}`;
        }
        return '-';
      },
    },
    {
      title: 'Son Düzenleyen',
      key: 'updater',
      width: 150,
      ellipsis: true,
      render: (_, record) => {
        if (record.updater_first_name && record.updater_last_name) {
          return `${record.updater_first_name} ${record.updater_last_name}`;
        }
        return record.creator_first_name && record.creator_last_name ? 
          `${record.creator_first_name} ${record.creator_last_name}` : '-';
      },
    },
    {
      title: 'Oluşturulma',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (date) => {
        const d = new Date(date);
        return d.toLocaleDateString('tr-TR') + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      },
    },
    {
      title: 'Son Güncelleme',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      sorter: (a, b) => new Date(a.updated_at) - new Date(b.updated_at),
      render: (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleString('tr-TR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      },
    },
    {
      title: 'İşlemler',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button
            type="default"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handlePreview(record)}
            title="Önizleme"
          />
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="Düzenle"
          />
          <Popconfirm
            title="Template'i silmek istediğinizden emin misiniz?"
            onConfirm={() => handleDelete(record.id)}
            okText="Evet"
            cancelText="Hayır"
          >
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
              title="Sil"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>Teklif Templates</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Yeni Template
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Search
            placeholder="Template ara..."
            allowClear
            onSearch={(value) => setTemplateFilter(value)}
            onChange={(e) => setTemplateFilter(e.target.value)}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
            autoFocus
          />
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredTemplates}
          rowKey="id"
          loading={loading}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} kayıt`,
            pageSizeOptions: ['5', '10', '20', '50'],
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      <Modal
        title={editingTemplate ? 'Template Düzenle' : 'Yeni Template'}
        open={modalVisible}
        onCancel={() => {
          resetModalState();
          setModalVisible(false);
        }}
        footer={null}
        width={1000}
        style={{ top: 20 }}
        afterOpenChange={(open) => {
          if (open) {
            // Modal açıldıktan sonra ilk alana focus
            setTimeout(() => {
              const nameInput = document.querySelector('input[placeholder="Template adını girin"]');
              if (nameInput) nameInput.focus();
            }, 100);
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
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Açıklama"
          >
            <Input.TextArea 
              rows={2} 
              placeholder="Açıklama (opsiyonel)" 
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
                    const selectedItem = selectedItems.find(selected => selected.id === item.id);
                    const isSelected = !!selectedItem;
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
                              value={selectedItem.quantity}
                              onChange={(value) => handleQuantityChange(item.id, value)}
                              disabled={item.stock <= 0}
                              style={{ width: 80 }}
                            />
                            <span style={{ marginLeft: 8, fontWeight: 'bold' }}>
                              {formatCurrency(selectedItem.total_price, pricelist.currency)}
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
                {selectedItems.map(item => (
                  <div key={item.id} style={{ fontSize: '12px' }}>
                    {selectedLanguage === 'tr' ? (item.name_tr || item.name_en || item.name) : (item.name_en || item.name_tr || item.name)} x {item.quantity} = {formatCurrency(item.total_price, item.currency)}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right', marginTop: 24 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                İptal
              </Button>
              <Button type="primary" htmlType="submit">
                {editingTemplate ? 'Güncelle' : 'Oluştur'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        title={`Template Önizlemesi: ${previewTemplate?.name}`}
        visible={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        width={1200}
        footer={[
          <Space key="preview-actions" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Space>
              <span style={{ fontWeight: 'bold', marginRight: 8 }}>Dil:</span>
              <Button.Group>
                <Button 
                  type={previewLanguage === 'en' ? 'primary' : 'default'}
                  onClick={() => setPreviewLanguage('en')}
                  style={{ 
                    backgroundColor: previewLanguage === 'en' ? '#1890ff' : '#f0f0f0',
                    borderColor: previewLanguage === 'en' ? '#1890ff' : '#d9d9d9',
                    color: previewLanguage === 'en' ? 'white' : '#666'
                  }}
                >
                  EN
                </Button>
                <Button 
                  type={previewLanguage === 'tr' ? 'primary' : 'default'}
                  onClick={() => setPreviewLanguage('tr')}
                  style={{ 
                    backgroundColor: previewLanguage === 'tr' ? '#52c41a' : '#f0f0f0',
                    borderColor: previewLanguage === 'tr' ? '#52c41a' : '#d9d9d9',
                    color: previewLanguage === 'tr' ? 'white' : '#666'
                  }}
                >
                  TR
                </Button>
              </Button.Group>
            </Space>
            <Button onClick={() => setPreviewModalVisible(false)}>Kapat</Button>
          </Space>
        ]}
      >
        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {previewTemplate && (
            <div style={{ marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0, marginBottom: 8 }}>
                {previewTemplate.name}
              </Title>
              {previewTemplate.description && (
                <p style={{ color: '#666', margin: 0, marginBottom: 16 }}>
                  {previewTemplate.description}
                </p>
              )}
            </div>
          )}
          
          {(() => {
            // Ürünleri fiyat listesine göre grupla
            const groupedItems = previewItems.reduce((groups, item) => {
              const pricelistId = item.pricelist_id;
              if (!groups[pricelistId]) {
                groups[pricelistId] = {
                  items: [],
                  pricelistName: item.pricelistName || `Fiyat Listesi ${pricelistId}`,
                  pricelistColor: item.pricelistColor || '#1890ff'
                };
              }
              groups[pricelistId].items.push(item);
              return groups;
            }, {});

            const groupedEntries = Object.entries(groupedItems);
            if (groupedEntries.length === 0) {
              return <p>Bu template'de ürün bulunmuyor.</p>;
            }

            return (
              <Collapse defaultActiveKey={groupedEntries.map((_, index) => index.toString())}>
                {groupedEntries.map(([pricelistId, group], index) => {
                  const pricelistTotal = group.items.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0);
                  const currency = group.items.length > 0 ? group.items[0].currency : 'EUR';
                  
                  return (
                    <Panel 
                      key={index.toString()}
                      header={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <span style={{ display: 'flex', alignItems: 'center' }}>
                            <div 
                              style={{ 
                                width: 12, 
                                height: 12, 
                                backgroundColor: group.pricelistColor,
                                borderRadius: '50%', 
                                marginRight: 8 
                              }} 
                            />
                            {group.pricelistName}
                          </span>
                          <Tag color="blue" style={{ margin: 0 }}>
                            {group.items.length} ürün - {pricelistTotal.toFixed(2)} {currency}
                          </Tag>
                        </div>
                      }
                    >
                      <Table
                        columns={[
                          {
                            title: 'Ürün Kodu',
                            dataIndex: 'product_id',
                            key: 'product_id',
                            width: 120,
                          },
                          {
                            title: 'Ürün Adı',
                            key: 'product_name',
                            render: (_, record) => {
                              return previewLanguage === 'tr' ? 
                                (record.name_tr || record.name_en || '-') : 
                                (record.name_en || record.name_tr || '-');
                            },
                          },
                          {
                            title: 'Açıklama',
                            key: 'description',
                            ellipsis: true,
                            render: (_, record) => {
                              return previewLanguage === 'tr' ? 
                                (record.description_tr || record.description_en || '-') : 
                                (record.description_en || record.description_tr || '-');
                            },
                          },
                          {
                            title: 'Miktar',
                            dataIndex: 'quantity',
                            key: 'quantity',
                            width: 80,
                            align: 'center',
                          },
                          {
                            title: 'Birim Fiyat',
                            key: 'price',
                            width: 120,
                            align: 'right',
                            render: (_, record) => `${record.price} ${record.currency}`,
                          },
                          {
                            title: 'Toplam',
                            key: 'total_price',
                            width: 120,
                            align: 'right',
                            render: (_, record) => `${record.total_price} ${record.currency}`,
                          },
                          {
                            title: 'Not',
                            dataIndex: 'note',
                            key: 'note',
                            ellipsis: true,
                            render: (note) => note || '-',
                          },
                        ]}
                        dataSource={group.items}
                        rowKey="id"
                        pagination={false}
                        size="small"
                      />
                    </Panel>
                  );
                })}
              </Collapse>
            );
          })()}
          
          {/* Genel Toplam */}
          <div style={{ 
            marginTop: 16, 
            padding: 16, 
            backgroundColor: '#f5f5f5', 
            borderRadius: 6,
            textAlign: 'right' 
          }}>
            <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
              Genel Toplam: {previewItems.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0).toFixed(2)} {previewItems.length > 0 ? previewItems[0].currency : 'EUR'}
            </Title>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OfferTemplates;