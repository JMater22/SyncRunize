import React from 'react';
import { IonCard, IonCardContent, IonSkeletonText } from '@ionic/react';
import './PostCardSkeleton.css';

const PostCardSkeleton: React.FC = () => {
  return (
    <IonCard className="post-card-skeleton">
      <IonCardContent>
        {/* User info skeleton */}
        <div className="skeleton-header">
          <IonSkeletonText animated style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
          <div className="skeleton-user-info">
            <IonSkeletonText animated style={{ width: '120px', height: '16px' }} />
            <IonSkeletonText animated style={{ width: '80px', height: '12px' }} />
          </div>
        </div>

        {/* Content skeleton */}
        <div className="skeleton-content">
          <IonSkeletonText animated style={{ width: '100%', height: '14px' }} />
          <IonSkeletonText animated style={{ width: '90%', height: '14px' }} />
          <IonSkeletonText animated style={{ width: '70%', height: '14px' }} />
        </div>

        {/* Image skeleton */}
        <IonSkeletonText animated style={{ width: '100%', height: '200px', borderRadius: '8px' }} />

        {/* Route info skeleton */}
        <div className="skeleton-route-info">
          <IonSkeletonText animated style={{ width: '100px', height: '14px' }} />
          <IonSkeletonText animated style={{ width: '80px', height: '14px' }} />
        </div>

        {/* Actions skeleton */}
        <div className="skeleton-actions">
          <IonSkeletonText animated style={{ width: '60px', height: '12px' }} />
          <IonSkeletonText animated style={{ width: '60px', height: '12px' }} />
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default PostCardSkeleton;
