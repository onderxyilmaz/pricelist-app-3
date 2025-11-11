import React, { useState, useEffect, useRef } from 'react';
import { authApi } from '../../utils/api';
import NotificationService from '../../utils/notification';
import { API_BASE_URL } from '../../config/env';
import ProfileCard from './components/ProfileCard';

const Profile = ({ user, setUser }) => {
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatar: null
  });
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef(null);

  // Sayfa yüklendiğinde backend'den güncel kullanıcı bilgilerini çek
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (user?.id) {
        try {
          setInitialLoading(true);
          const response = await authApi.getUser(user.id);
          
          if (response.data.success && response.data.user) {
            const currentUser = response.data.user;
            
            // Backend'den gelen güncel bilgileri localStorage'a kaydet
            localStorage.setItem('user', JSON.stringify(currentUser));
            
            // Parent component'teki user state'ini güncelle
            if (setUser) {
              setUser(currentUser);
            }
            
            // Profile data'yı güncelle
            setProfileData({
              firstName: currentUser.first_name || '',
              lastName: currentUser.last_name || '',
              email: currentUser.email || '',
              password: '',
              confirmPassword: '',
              avatar: currentUser.avatar_filename 
                ? `${API_BASE_URL}/uploads/avatars/${currentUser.avatar_filename}`
                : null
            });
          }
        } catch (error) {
          console.error('Error fetching current user:', error);
          // Hata durumunda localStorage'dan göster (fallback)
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
        } finally {
          setInitialLoading(false);
        }
      }
    };

    fetchCurrentUser();
  }, []); // Sadece component mount olduğunda çalışsın

  // User prop'u değiştiğinde de güncelle (fallback)
  useEffect(() => {
    if (user && !initialLoading) {
      setProfileData(prev => ({
        ...prev,
        firstName: user.first_name || prev.firstName,
        lastName: user.last_name || prev.lastName,
        email: user.email || prev.email,
        avatar: user.avatar_filename 
          ? `${API_BASE_URL}/uploads/avatars/${user.avatar_filename}`
          : user.avatar || prev.avatar
      }));
    }
  }, [user, initialLoading]);

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
      NotificationService.fileTypeError();
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      NotificationService.fileSizeError();
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await authApi.uploadAvatar(user.id, formData);
      
      // ✅ Backend'den gelen güncel kullanıcı bilgisini localStorage'a kaydet
      if (response.data.success && response.data.user) {
        const updatedUser = response.data.user;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // ✅ Parent component'teki user state'ini güncelle (sayfa yenilenmeden)
        if (setUser) {
          setUser(updatedUser);
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
        
        NotificationService.avatarUploadSuccess();
      }
      
    } catch (error) {
      NotificationService.avatarUploadError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const onAvatarRemove = async () => {
    try {
      setLoading(true);
      const response = await authApi.deleteAvatar(user.id);
      
      // ✅ Backend'den gelen güncel kullanıcı bilgisini localStorage'a kaydet
      if (response.data.success && response.data.user) {
        const updatedUser = response.data.user;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // ✅ Parent component'teki user state'ini güncelle (sayfa yenilenmeden)
        if (setUser) {
          setUser(updatedUser);
        }
        
        setProfileData(prev => ({ ...prev, avatar: null }));
        NotificationService.avatarRemoveSuccess();
      }
      
    } catch (error) {
      NotificationService.avatarRemoveError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const onSave = async () => {
    // Şifre doğrulama
    if (profileData.password && profileData.password !== profileData.confirmPassword) {
      NotificationService.passwordMismatch();
      return;
    }

    const updateData = {
      first_name: profileData.firstName,
      last_name: profileData.lastName
    };

    if (profileData.password && profileData.password.trim()) {
      updateData.password = profileData.password;
    }

    try {
      setLoading(true);
      const response = await authApi.updateUser(user.id, updateData);
      
      // ✅ Backend'den gelen güncel kullanıcı bilgisini localStorage'a kaydet
      if (response.data.success && response.data.user) {
        const updatedUser = response.data.user;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // ✅ Parent component'teki user state'ini güncelle (sayfa yenilenmeden)
        if (setUser) {
          setUser(updatedUser);
        }
        
        // Formu sıfırla
        setProfileData(prev => ({
          ...prev,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
          password: '',
          confirmPassword: ''
        }));
        
        setHasChanges(false);
        NotificationService.profileUpdateSuccess(`${updatedUser.first_name} ${updatedUser.last_name}`);
      }
      
    } catch (error) {
      NotificationService.profileUpdateError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfileCard
      profileData={profileData}
      user={user}
      hasChanges={hasChanges}
      loading={loading || initialLoading}
      onInputChange={onInputChange}
      onSave={onSave}
      onFileChange={onFileChange}
      onAvatarRemove={onAvatarRemove}
      fileInputRef={fileInputRef}
    />
  );
};

export default Profile;
