import React, { useState, useEffect, useRef } from 'react';
import { message } from 'antd';
import { authApi } from '../../utils/api';
import ProfileCard from './components/ProfileCard';

const Profile = ({ user, onUserUpdate }) => {
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatar: null
  });
  
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        password: '',
        confirmPassword: '',
        avatar: null
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        password: '',
        confirmPassword: '',
        avatar: user.avatar
      });
    }
  }, [user]);

  const onInputChange = (field, value) => {
    setProfileData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Değişiklik kontrolü
      const hasChanges = (
        updated.firstName !== (user?.first_name || '') ||
        updated.lastName !== (user?.last_name || '') ||
        (updated.password && updated.password.trim() !== '')
      );
      
      setHasChanges(hasChanges);
      return updated;
    });
  };

  const onFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Dosya doğrulama
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      message.error('Lütfen sadece resim dosyaları (JPEG, PNG, GIF) seçiniz.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      message.error('Dosya boyutu 5MB\'tan küçük olmalıdır.');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await authApi.uploadAvatar(user.id, formData);
      
      if (response.data.success) {
        message.success('Avatar başarıyla güncellendi!');
        
        // User state'ini güncelle
        const updatedUser = {
          ...user,
          avatar_filename: response.data.filename
        };
        
        // Parent component'i (App.jsx) bilgilendir
        if (onUserUpdate) {
          onUserUpdate(updatedUser);
        }
        
        // Preview için dosyayı oku
        const reader = new FileReader();
        reader.onload = (e) => {
          setProfileData(prev => ({
            ...prev,
            avatar: e.target.result
          }));
        };
        reader.readAsDataURL(file);
      } else {
        message.error('Avatar güncellenirken bir hata oluştu: ' + response.data.message);
      }
      
    } catch (error) {
      message.error('Avatar güncellenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const onAvatarRemove = async () => {
    try {
      setLoading(true);
      const response = await authApi.deleteAvatar(user.id);
      
      if (response.data.success) {
        // User state'ini güncelle
        const updatedUser = {
          ...user,
          avatar_filename: null
        };
        
        // Parent component'i (App.jsx) bilgilendir
        if (onUserUpdate) {
          onUserUpdate(updatedUser);
        }
        
        setProfileData(prev => ({ ...prev, avatar: null }));
        message.success('Avatar başarıyla kaldırıldı!');
      } else {
        message.error('Avatar kaldırılırken bir hata oluştu: ' + response.data.message);
      }
    } catch (error) {
      message.error('Avatar kaldırılırken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const onSave = async () => {
    // Şifre doğrulama
    if (profileData.password && profileData.password !== profileData.confirmPassword) {
      message.error('Şifreler eşleşmiyor!');
      return;
    }

    const updateData = {
      firstName: profileData.firstName,
      lastName: profileData.lastName
    };

    if (profileData.password && profileData.password.trim()) {
      updateData.password = profileData.password;
    }

    try {
      setLoading(true);
      const response = await authApi.updateUser(user.id, updateData);
      
      if (response.data.success) {
        message.success('Profil başarıyla güncellendi!');
        
        // User state'ini güncelle
        const updatedUser = {
          ...user,
          first_name: response.data.user.first_name,
          last_name: response.data.user.last_name,
          email: response.data.user.email
        };
        
        // Parent component'i (App.jsx) bilgilendir
        if (onUserUpdate) {
          onUserUpdate(updatedUser);
        }
        
        // Formu sıfırla
        setProfileData(prev => ({
          ...prev,
          password: '',
          confirmPassword: ''
        }));
        
        setHasChanges(false);
      } else {
        message.error('Profil güncellenirken bir hata oluştu: ' + response.data.message);
      }
      
    } catch (error) {
      message.error('Profil güncellenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfileCard
      profileData={profileData}
      user={user}
      hasChanges={hasChanges}
      loading={loading}
      onInputChange={onInputChange}
      onSave={onSave}
      onFileChange={onFileChange}
      onAvatarRemove={onAvatarRemove}
      fileInputRef={fileInputRef}
    />
  );
};

export default Profile;
