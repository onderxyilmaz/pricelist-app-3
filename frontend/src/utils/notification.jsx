import toast from 'react-hot-toast';

// Backward compatibility - no longer needed but keeping the function
export const setNotificationApi = (api) => {
  // Not needed for react-hot-toast
};

const NotificationService = {
  success: (message, description = '') => {
    toast.success(
      description ? (
        <div>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>{message}</div>
          <div style={{ fontSize: '14px' }}>{description}</div>
        </div>
      ) : (
        message
      ),
      {
        duration: 3000,
        position: 'top-center',
      }
    );
  },

  error: (message, description = '') => {
    toast.error(
      description ? (
        <div>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>{message}</div>
          <div style={{ fontSize: '14px' }}>{description}</div>
        </div>
      ) : (
        message
      ),
      {
        duration: 3000,
        position: 'top-center',
      }
    );
  },

  warning: (message, description = '') => {
    toast(
      description ? (
        <div>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>{message}</div>
          <div style={{ fontSize: '14px' }}>{description}</div>
        </div>
      ) : (
        message
      ),
      {
        duration: 3000,
        position: 'top-center',
        icon: '⚠️',
      }
    );
  },

  info: (message, description = '') => {
    toast(
      description ? (
        <div>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>{message}</div>
          <div style={{ fontSize: '14px' }}>{description}</div>
        </div>
      ) : (
        message
      ),
      {
        duration: 3000,
        position: 'top-center',
        icon: 'ℹ️',
      }
    );
  },

  // Özel login/logout mesajları
  loginSuccess: (userName) => {
    NotificationService.success(
      'Giriş Başarılı!',
      `Hoş geldiniz, ${userName}!`
    );
  },

  loginError: (errorMessage = 'E-mail veya şifre hatalı') => {
    NotificationService.error(
      'Giriş Başarısız',
      errorMessage
    );
  },

  registerSuccess: (userName) => {
    NotificationService.success(
      'Kayıt Başarılı!',
      `Hesabınız oluşturuldu, ${userName}. Artık giriş yapabilirsiniz.`
    );
  },

  registerError: (errorMessage = 'Kayıt işlemi başarısız') => {
    NotificationService.error(
      'Kayıt Başarısız',
      errorMessage
    );
  },

  logoutSuccess: () => {
    NotificationService.info(
      'Çıkış Yapıldı',
      'Güvenli bir şekilde çıkış yaptınız.'
    );
  },

  connectionError: () => {
    NotificationService.error(
      'Bağlantı Hatası',
      'Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.'
    );
  },

  // Profil işlemleri bildirimleri
  profileUpdateSuccess: (userName) => {
    NotificationService.success(
      'Profil Güncellendi!',
      `${userName}, profiliniz başarıyla güncellendi.`
    );
  },

  profileUpdateError: (errorMessage = 'Profil güncellenirken bir hata oluştu') => {
    NotificationService.error(
      'Profil Güncelleme Hatası',
      errorMessage
    );
  },

  avatarUploadSuccess: () => {
    NotificationService.success(
      'Avatar Güncellendi!',
      'Profil fotoğrafınız başarıyla güncellendi.'
    );
  },

  avatarUploadError: (errorMessage = 'Avatar yüklenirken bir hata oluştu') => {
    NotificationService.error(
      'Avatar Yükleme Hatası',
      errorMessage
    );
  },

  avatarRemoveSuccess: () => {
    NotificationService.info(
      'Avatar Kaldırıldı',
      'Profil fotoğrafınız başarıyla kaldırıldı.'
    );
  },

  avatarRemoveError: (errorMessage = 'Avatar kaldırılırken bir hata oluştu') => {
    NotificationService.error(
      'Avatar Kaldırma Hatası',
      errorMessage
    );
  },

  passwordMismatch: () => {
    NotificationService.warning(
      'Şifre Uyuşmazlığı',
      'Girdiğiniz şifreler eşleşmiyor. Lütfen kontrol edin.'
    );
  },

  fileSizeError: () => {
    NotificationService.warning(
      'Dosya Boyutu Hatası',
      'Dosya boyutu 5MB\'tan küçük olmalıdır.'
    );
  },

  fileTypeError: () => {
    NotificationService.warning(
      'Dosya Tipi Hatası',
      'Lütfen sadece resim dosyaları (JPEG, PNG, GIF) seçiniz.'
    );
  }
};

export default NotificationService;
