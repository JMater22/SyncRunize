import React from 'react';
import { IonCard, IonCardContent, IonSkeletonText } from '@ionic/react';
import './GroupCardSkeleton.css';

const GroupCardSkeleton: React.FC = () => {
  return (
    <IonCard className="group-card-skeleton">
      <IonCardContent>
        {/* Group image skeleton */}
        <IonSkeletonText animated style={{ width: '100%', height: '120px', borderRadius: '8px', marginBottom: '12px' }} />

        {/* Group name skeleton */}
        <IonSkeletonText animated style={{ width: '70%', height: '18px', marginBottom: '8px' }} />

        {/* Description skeleton */}
        <IonSkeletonText animated style={{ width: '100%', height: '14px', marginBottom: '4px' }} />
        <IonSkeletonText animated style={{ width: '80%', height: '14px', marginBottom: '12px' }} />

        {/* Member count skeleton */}
        <IonSkeletonText animated style={{ width: '100px', height: '12px' }} />
      </IonCardContent>
    </IonCard>
  );
};

export default GroupCardSkeleton;
