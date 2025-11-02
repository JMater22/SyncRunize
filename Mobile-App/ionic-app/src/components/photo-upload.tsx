// PhotoUpload.tsx
import React from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { IonActionSheet, IonButton } from '@ionic/react';
import { camera, images, close } from 'ionicons/icons';

interface PhotoUploadProps {
  onPhotoSelected: (photoUrl: string) => void;
  buttonClass?: string;
  buttonSize?: 'small' | 'default' | 'large';
  buttonFill?: 'clear' | 'outline' | 'solid' | 'default';
  buttonText?: string;
  showIcon?: boolean;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  onPhotoSelected,
  buttonClass = '',
  buttonSize = 'small',
  buttonFill = 'clear',
  buttonText = '📷',
  showIcon = false,
}) => {
  const [showActionSheet, setShowActionSheet] = React.useState(false);

  const selectPhoto = async (source: CameraSource) => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: source,
        quality: 90,
        allowEditing: true,
        width: 600,
        height: 600,
      });

      if (photo.webPath) {
        onPhotoSelected(photo.webPath);
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
    }
  };

  const handleButtonClick = () => {
    setShowActionSheet(true);
  };

  return (
    <>
      <IonButton
        className={buttonClass}
        size={buttonSize}
        fill={buttonFill}
        onClick={handleButtonClick}
      >
        {buttonText}
      </IonButton>

      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        buttons={[
          {
            text: 'Take Photo',
            icon: camera,
            handler: () => {
              selectPhoto(CameraSource.Camera);
            },
          },
          {
            text: 'Choose from Gallery',
            icon: images,
            handler: () => {
              selectPhoto(CameraSource.Photos);
            },
          },
          {
            text: 'Cancel',
            icon: close,
            role: 'cancel',
          },
        ]}
      />
    </>
  );
};

export default PhotoUpload;