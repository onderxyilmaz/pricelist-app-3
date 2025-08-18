import { notification } from 'antd';

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
        placement: 'topRight',
        duration: 4,
      });
    } else {
      notification.success({
        message,
        description,
        placement: 'topRight',
        duration: 4,
      });
    }
  },

  error: (message, description = '') => {
    if (notificationApi) {
      notificationApi.error({
        message,
        description,
        placement: 'topRight',
        duration: 4,
      });
    } else {
      notification.error({
        message,
        description,
        placement: 'topRight',
        duration: 4,
      });
    }
  },

  warning: (message, description = '') => {
    if (notificationApi) {
      notificationApi.warning({
        message,
        description,
        placement: 'topRight',
        duration: 4,
      });
    } else {
      notification.warning({
        message,
        description,
        placement: 'topRight',
        duration: 4,
      });
    }
  },

  info: (message, description = '') => {
    if (notificationApi) {
      notificationApi.info({
        message,
        description,
        placement: 'topRight',
        duration: 4,
      });
    } else {
      notification.info({
        message,
        description,
        placement: 'topRight',
        duration: 4,
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
