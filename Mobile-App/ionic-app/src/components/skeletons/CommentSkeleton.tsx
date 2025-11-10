import React from 'react';
import { IonItem, IonSkeletonText } from '@ionic/react';
import './CommentSkeleton.css';

const CommentSkeleton: React.FC = () => {
  return (
    <IonItem className="comment-skeleton">
      <IonSkeletonText animated style={{ width: '32px', height: '32px', borderRadius: '50%', marginRight: '12px' }} slot="start" />
      <div className="comment-skeleton-content">
        <IonSkeletonText animated style={{ width: '100px', height: '14px', marginBottom: '6px' }} />
        <IonSkeletonText animated style={{ width: '100%', height: '12px' }} />
        <IonSkeletonText animated style={{ width: '80%', height: '12px' }} />
      </div>
    </IonItem>
  );
};

export default CommentSkeleton;
