import React from 'react';
import ProfileHeader from './ProfileHeader';
import AvatarUpload from './AvatarUpload';
import ProfileForm from './ProfileForm';
import styles from '../Profile.module.css';

const ProfileCard = ({
  profileData,
  user,
  hasChanges,
  loading,
  onInputChange,
  onSave,
  onFileChange,
  onAvatarRemove,
  fileInputRef
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.profileCard}>
        <ProfileHeader profileData={profileData} />
        
        <div className={styles.profileContent}>
          <AvatarUpload
            user={user}
            profileData={profileData}
            onFileChange={onFileChange}
            onAvatarRemove={onAvatarRemove}
            fileInputRef={fileInputRef}
          />
          
          <ProfileForm
            profileData={profileData}
            hasChanges={hasChanges}
            loading={loading}
            onInputChange={onInputChange}
            onSave={onSave}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;