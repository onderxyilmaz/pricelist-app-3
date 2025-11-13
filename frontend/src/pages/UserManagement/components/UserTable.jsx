import React from 'react';
import { Table, Button, Space, Popconfirm, Tag, Avatar } from 'antd';
import { EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import { API_BASE_URL } from '../../../config/env';
import styles from '../UserManagement.module.css';

const UserTable = ({ 
  users, 
  loading, 
  currentUser, 
  onEdit, 
  onDelete 
}) => {
  const canEditUser = (user) => {
    return currentUser?.id !== user.id;
  };

  const canDeleteUser = (user) => {
    return currentUser?.id !== user.id;
  };

  // Avatar renk belirleme fonksiyonu
  const getAvatarStyle = (role) => {
    if (role === 'super_admin') {
      return { backgroundColor: '#ff7a00' }; // Turuncu
    }
    return { backgroundColor: '#1890ff' }; // Mavi (varsayılan)
  };

  const columns = [
    {
      title: 'Avatar',
      dataIndex: 'avatar_filename',
      key: 'avatar',
      width: 80,
      align: 'center',
      render: (avatarFilename, record) => {
        // Eğer avatar resmi varsa göster
        if (avatarFilename) {
          return (
            <Avatar
              src={`${API_BASE_URL}/uploads/avatars/${avatarFilename}`}
              size={40}
              className={styles.userAvatar}
            />
          );
        }
        // Avatar yoksa role göre renkli avatar göster
        return (
          <Avatar 
            icon={<UserOutlined />} 
            size={40}
            style={getAvatarStyle(record.role)}
            className={styles.userAvatarPlaceholder}
          />
        );
      },
    },
    {
      title: 'Ad',
      dataIndex: 'first_name',
      key: 'first_name',
      sorter: (a, b) => a.first_name.localeCompare(b.first_name, 'tr'),
    },
    {
      title: 'Soyad',
      dataIndex: 'last_name',
      key: 'last_name',
      sorter: (a, b) => a.last_name.localeCompare(b.last_name, 'tr'),
    },
    {
      title: 'E-mail',
      dataIndex: 'email',
      key: 'email',
      sorter: (a, b) => a.email.localeCompare(b.email, 'tr'),
    },
    {
      title: 'Rol',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role) => (
        <Tag 
          className={`${styles.roleTag} ${role === 'super_admin' ? styles.superAdminTag : styles.userTag}`}
        >
          {role === 'super_admin' ? 'Süper Admin' : 'Kullanıcı'}
        </Tag>
      ),
    },
    {
      title: 'Oluşturulma',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (date) => new Date(date).toLocaleDateString('tr-TR'),
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
            onClick={() => onEdit(record)}
            disabled={!canEditUser(record)}
            title={canEditUser(record) ? "Düzenle" : "Kendi kullanıcınızı düzenleyemezsiniz"}
            className={`${styles.actionButton} ${styles.editButton}`}
          />
          <Popconfirm
            title="Kullanıcıyı silmek istediğinizden emin misiniz?"
            onConfirm={() => onDelete(record.id)}
            okText="Evet"
            cancelText="Hayır"
            disabled={!canDeleteUser(record)}
          >
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
              disabled={!canDeleteUser(record)}
              title={canDeleteUser(record) ? "Sil" : "Kendi kullanıcınızı silemezsiniz"}
              className={`${styles.actionButton} ${styles.deleteButton}`}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={users}
      rowKey="id"
      loading={loading}
      className={styles.table}
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} kayıt`,
        pageSizeOptions: ['5', '10', '20', '50'],
      }}
      scroll={{ x: 900 }}
    />
  );
};

export default UserTable;