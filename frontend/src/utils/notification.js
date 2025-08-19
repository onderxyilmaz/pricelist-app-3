// Global notification instance
let notificationApi = null;

// Set the notification API instance
export const setNotificationApi = (api) => {
  notificationApi = api;
};

const NotificationService = {
  success: (message, description = '') => {
    if (notificationApi) {
      notificationApi.success({
        message,
        description,
        duration: 3,
        closable: true,
        onClose: () => {
          // Kapanırken ek işlem yok, sadece animasyon
        },
      });
    }
  },

  error: (message, description = '') => {
    if (notificationApi) {
      notificationApi.error({
        message,
        description,
        duration: 3,
        closable: true,
        onClose: () => {
          // Kapanırken ek işlem yok, sadece animasyon
        },
      });
    }
  },

  warning: (message, description = '') => {
    if (notificationApi) {
      notificationApi.warning({
        message,
        description,
        duration: 3,
        closable: true,
        onClose: () => {
          // Kapanırken ek işlem yok, sadece animasyon
        },
      });
    }
  },

  info: (message, description = '') => {
    if (notificationApi) {
      notificationApi.info({
        message,
        description,
        duration: 3,
        closable: true,
        onClose: () => {
          // Kapanırken ek işlem yok, sadece animasyon
        },
      });
    }
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
  }
};

export default NotificationService;
