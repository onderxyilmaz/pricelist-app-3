import React from 'react';
import { Space, Input, Button } from 'antd';
import styles from '../Profile.module.css';

const ProfileForm = ({
  profileData,
  hasChanges,
  loading,
  onInputChange,
  onSave
}) => {
  return (
    <Space direction="vertical" className={styles.formContainer} size="large">
      <div className={styles.formItem}>
        <label className={styles.formLabel}>
          Ad
        </label>
        <Input
          value={profileData.firstName}
          onChange={(e) => onInputChange('firstName', e.target.value)}
          placeholder="Adınız"
          size="large"
          autoComplete="off"
          autoFocus
          onFocus={(e) => e.target.select()}
          className={styles.formInput}
        />
      </div>

      <div className={styles.formItem}>
        <label className={styles.formLabel}>
          Soyad
        </label>
        <Input
          value={profileData.lastName}
          onChange={(e) => onInputChange('lastName', e.target.value)}
          placeholder="Soyadınız"
          size="large"
          autoComplete="off"
          className={styles.formInput}
        />
      </div>

      <div className={styles.formItem}>
        <label className={styles.formLabel}>
          Şifre
        </label>
        <Input.Password
          value={profileData.password}
          onChange={(e) => onInputChange('password', e.target.value)}
          placeholder="Yeni şifre (boş bırakırsanız mevcut şifre korunur)"
          size="large"
          autoComplete="off"
          className={styles.passwordInput}
        />
      </div>

      <div className={styles.formItem}>
        <label className={styles.formLabel}>
          Şifre Tekrar
        </label>
        <Input.Password
          value={profileData.confirmPassword}
          onChange={(e) => onInputChange('confirmPassword', e.target.value)}
          placeholder="Yeni şifre tekrarı"
          size="large"
          autoComplete="off"
          className={styles.passwordInput}
        />
      </div>

      <div className={styles.formItem}>
        <label className={styles.formLabel}>
          E-mail
        </label>
        <Input
          value={profileData.email}
          disabled
          size="large"
          className={`${styles.formInput} ${styles.formInputDisabled}`}
        />
      </div>

      <Button
        type="primary"
        size="large"
        block
        disabled={!hasChanges}
        loading={loading}
        onClick={onSave}
        className={`${styles.saveButton} ${!hasChanges ? styles.saveButtonDisabled : ''} ${loading ? styles.saveButtonLoading : ''}`}
      >
        Değişiklikleri Kaydet
      </Button>
    </Space>
  );
};

export default ProfileForm;