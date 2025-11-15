import React, { useState, useEffect } from 'react';
import { Modal, Radio, Select, Row, Col, Alert, Image } from 'antd';
import { companyApi } from '../../../../utils/api';
import { API_BASE_URL } from '../../../../config/env';
import styles from './ExcelExportModal.module.css';

const { Option } = Select;

const ExcelExportModal = ({ visible, onCancel, onConfirm, offer }) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logoPosition, setLogoPosition] = useState('left'); // 'left' or 'right'
  const [centerCompanyId, setCenterCompanyId] = useState(null);
  const [offerCompany, setOfferCompany] = useState(null);
  const [teknogrupCompany, setTeknogrupCompany] = useState(null);

  useEffect(() => {
    if (visible && offer) {
      // State'leri resetle
      setLogoPosition('left');
      setCenterCompanyId(null);
      setOfferCompany(null);
      setTeknogrupCompany(null);
      
      fetchCompanies();
    } else {
      // Modal kapandığında state'leri temizle
      setLogoPosition('left');
      setCenterCompanyId(null);
      setOfferCompany(null);
      setTeknogrupCompany(null);
    }
  }, [visible, offer]);

  useEffect(() => {
    // Companies yüklendikten sonra offer company bilgisini ayarla
    if (companies.length > 0 && offer?.company_id) {
      const company = companies.find(c => c.id === offer.company_id);
      if (company) {
        setOfferCompany({ id: company.id, company_name: company.company_name });
      } else if (offer.company_name) {
        // Eğer companies listesinde yoksa ama offer'da company_name varsa
        setOfferCompany({ id: offer.company_id, company_name: offer.company_name });
      }
    }
  }, [companies, offer]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await companyApi.getCompanies();
      if (response.data && Array.isArray(response.data)) {
        setCompanies(response.data);
        
        // Teknogrup veya Teknogroup ile başlayan firmayı bul
        const teknogrup = response.data.find(c => 
          c.company_name && c.company_name.toLowerCase().startsWith('teknogrup')
        );
        const teknogroup = response.data.find(c => 
          c.company_name && c.company_name.toLowerCase().startsWith('teknogroup')
        );
        
        setTeknogrupCompany(teknogrup || teknogroup || null);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    const config = {
      logoPosition, // 'left' or 'right'
      centerCompanyId,
      offerCompany: offerCompany?.id || null,
      teknogrupCompany: teknogrupCompany?.id || null,
    };
    onConfirm(config);
  };

  const hasOfferCompanyLogo = offerCompany && companies.find(c => c.id === offerCompany.id)?.logo_filename;

  // Logo pozisyonu değiştiğinde otomatik olarak karşı tarafı ayarla
  const handleLogoPositionChange = (e) => {
    const newPosition = e.target.value;
    setLogoPosition(newPosition);
  };

  return (
    <Modal
      title="Excel'e Aktar - Logo Ayarları"
      open={visible}
      onCancel={onCancel}
      onOk={handleConfirm}
      okText="Excel'e Aktar"
      cancelText="İptal"
      width={600}
    >
      <div className={styles.modalContent}>
        {offerCompany && (
          <>
            <Alert
              message={`Teklifte seçili firma: ${offerCompany.company_name}`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            {hasOfferCompanyLogo ? (
              <div className={styles.section}>
                <h4>Firma Logosu Konumu</h4>
                <Radio.Group 
                  value={logoPosition} 
                  onChange={handleLogoPositionChange}
                  className={styles.radioGroup}
                >
                  <Radio value="left">Sol Taraf</Radio>
                  <Radio value="right">Sağ Taraf</Radio>
                </Radio.Group>
                
                {logoPosition === 'left' && (
                  <div className={styles.logoPreview}>
                    <div className={styles.previewRow}>
                      <div className={styles.previewCell}>
                        <div className={styles.logoPlaceholder}>
                          <Image
                            src={`${API_BASE_URL}/uploads/company_logos/${companies.find(c => c.id === offerCompany.id)?.logo_filename}`}
                            alt={offerCompany.company_name}
                            preview={false}
                            style={{ maxWidth: '100px', maxHeight: '60px' }}
                          />
                          <div className={styles.logoLabel}>Seçili Firma</div>
                        </div>
                      </div>
                      <div className={styles.previewCell}>
                        {teknogrupCompany?.logo_filename ? (
                          <div className={styles.logoPlaceholder}>
                            <Image
                              src={`${API_BASE_URL}/uploads/company_logos/${teknogrupCompany.logo_filename}`}
                              alt={teknogrupCompany.company_name}
                              preview={false}
                              style={{ maxWidth: '100px', maxHeight: '60px' }}
                            />
                            <div className={styles.logoLabel}>
                              {teknogrupCompany.company_name}
                            </div>
                          </div>
                        ) : (
                          <div className={styles.logoPlaceholderEmpty}>
                            <div className={styles.emptyLabel}>Boş</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {logoPosition === 'right' && (
                  <div className={styles.logoPreview}>
                    <div className={styles.previewRow}>
                      <div className={styles.previewCell}>
                        {teknogrupCompany?.logo_filename ? (
                          <div className={styles.logoPlaceholder}>
                            <Image
                              src={`${API_BASE_URL}/uploads/company_logos/${teknogrupCompany.logo_filename}`}
                              alt={teknogrupCompany.company_name}
                              preview={false}
                              style={{ maxWidth: '100px', maxHeight: '60px' }}
                            />
                            <div className={styles.logoLabel}>
                              {teknogrupCompany.company_name}
                            </div>
                          </div>
                        ) : (
                          <div className={styles.logoPlaceholderEmpty}>
                            <div className={styles.emptyLabel}>Boş</div>
                          </div>
                        )}
                      </div>
                      <div className={styles.previewCell}>
                        <div className={styles.logoPlaceholder}>
                          <Image
                            src={`${API_BASE_URL}/uploads/company_logos/${companies.find(c => c.id === offerCompany.id)?.logo_filename}`}
                            alt={offerCompany.company_name}
                            preview={false}
                            style={{ maxWidth: '100px', maxHeight: '60px' }}
                          />
                          <div className={styles.logoLabel}>Seçili Firma</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Alert
                message="Seçili firmanın logosu bulunmamaktadır."
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
          </>
        )}

        <div className={styles.section}>
          <h4>Orta Alan Logo</h4>
          <Select
            placeholder="Firma seçin (isteğe bağlı)"
            style={{ width: '100%' }}
            value={centerCompanyId}
            onChange={setCenterCompanyId}
            allowClear
            loading={loading}
          >
            {companies
              .filter(c => c.logo_filename) // Sadece logosu olan firmalar
              .map(company => (
                <Option key={company.id} value={company.id}>
                  {company.company_name}
                </Option>
              ))}
          </Select>
          {centerCompanyId && (
            <div className={styles.centerLogoPreview} style={{ marginTop: 12 }}>
              <Image
                src={`${API_BASE_URL}/uploads/company_logos/${companies.find(c => c.id === centerCompanyId)?.logo_filename}`}
                alt={companies.find(c => c.id === centerCompanyId)?.company_name}
                preview={false}
                style={{ maxWidth: '150px', maxHeight: '90px' }}
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ExcelExportModal;

