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
  FormOutlined
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
  
  // Template creation states
  const [pricelists, setPricelists] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [itemNotes, setItemNotes] = useState({});
  const [productFilter, setProductFilter] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [expandedPanels, setExpandedPanels] = useState([]);

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
      width: 120,
      render: (_, record) => (
        <Space>
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
        <Table
          columns={columns}
          dataSource={templates}
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
    </div>
  );
};

export default OfferTemplates;