import { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonTextarea,
  IonButton,
  IonButtons,
  IonBackButton,
  IonImg,
  IonIcon,
  IonToast,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonToggle,
} from "@ionic/react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { imageOutline, closeCircle } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { RoutesApi, Route } from "../services/routes";
import { PostsApi } from "../services/posts";
import { uploadImageToSupabase } from "../lib/supabaseClient";
import { ToastService } from "../lib/toastService";
import { formatDistance, formatDuration } from "../lib/utils";
import "../theme/Create-Post.css";

const CreatePost: React.FC = () => {
  const history = useHistory();
  const { currentUser } = useUser();

  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null); // ✅ Store blob for upload
  const [selectedRouteId, setSelectedRouteId] = useState<number | undefined>(undefined);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [completedRoutes, setCompletedRoutes] = useState<Route[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // ✅ Track upload progress
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning'>('success');

  useEffect(() => {
    fetchCompletedRoutes();
  }, [currentUser]);

  const fetchCompletedRoutes = async () => {
    if (!currentUser) return;

    try {
      setLoadingRoutes(true);
      const routes = await RoutesApi.getUserRoutes(currentUser.user_id, true);
      // Filter only completed routes
      const completed = routes.filter(r => r.route_status === 'completed');
      setCompletedRoutes(completed);
    } catch (error: any) {
      console.error("Failed to fetch routes:", error);
    } finally {
      setLoadingRoutes(false);
    }
  };

  // Helper: Convert dataURL to Blob
  const dataURLtoBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // Take or pick a photo
  const handleAddPhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 40, // ✅ Lower quality for faster uploads (matches Hazard-Report)
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt, // Allows choosing camera or gallery
      });

      if (photo?.dataUrl) {
        setImage(photo.dataUrl);
        // ✅ Convert to blob immediately for faster upload later
        const blob = dataURLtoBlob(photo.dataUrl);
        setImageBlob(blob);
        console.log('[CreatePost] Image converted to blob:', (blob.size / 1024).toFixed(0), 'KB');
      }
    } catch (error) {
      console.error("Camera error:", error);
      showToastMessage("Failed to select photo.", 'danger');
    }
  };

  const handleRemovePhoto = () => {
    setImage(null);
    setImageBlob(null);
  };

  const handleCreatePost = async () => {
    // Validation: Must have either content or a route
    if (!content.trim() && !selectedRouteId) {
      return showToastMessage("Please add a caption or select a completed route.", 'warning');
    }

    try {
      setSubmitting(true);
      setUploadProgress(0);

      // ✅ Upload image to Supabase first if present
      let imageUrl: string | undefined = undefined;
      if (imageBlob) {
        console.log('[CreatePost] Uploading image to Supabase...');
        try {
          imageUrl = await uploadImageToSupabase(
            imageBlob,
            `post-${Date.now()}.jpg`,
            'posts', // Folder name in Supabase storage
            (progress) => {
              setUploadProgress(progress);
              console.log(`[CreatePost] Upload progress: ${progress}%`);
              if (import.meta.env.DEV && progress === 30) {
                ToastService.info('Uploading image...', 2000);
              }
            }
          );
          console.log('[CreatePost] Image uploaded successfully:', imageUrl);
        } catch (uploadError: any) {
          console.error('[CreatePost] Image upload failed:', uploadError);
          ToastService.error(`Failed to upload image: ${uploadError.message}`, 5000);
          setSubmitting(false);
          setUploadProgress(0);
          return;
        }
      }

      // ✅ Create post with image URL
      await PostsApi.createPost({
        content: content.trim() || undefined,
        route_id: selectedRouteId,
        visibility,
        image_url: imageUrl // ✅ Include image URL in post
      });

      showToastMessage("Post created successfully!", 'success');

      // Reset form
      setContent("");
      setImage(null);
      setImageBlob(null);
      setSelectedRouteId(undefined);
      setVisibility('public');
      setUploadProgress(0);

      // Navigate back to community feed after a short delay
      setTimeout(() => {
        history.push('/community');
      }, 1500);
    } catch (error: any) {
      console.error("Failed to create post:", error);
      showToastMessage(error.message || "Failed to create post. Please try again.", 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const showToastMessage = (message: string, color: 'success' | 'danger' | 'warning' = 'success') => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  const selectedRoute = completedRoutes.find(r => r.route_id === selectedRouteId);

  return (
    <IonPage className="create-post-page">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/community" />
          </IonButtons>
          <IonTitle>Create Post</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Caption/Content Field */}
        <IonItem>
          <IonLabel position="stacked">Caption</IonLabel>
          <IonTextarea
            value={content}
            onIonInput={(e) => setContent(e.detail.value ?? "")}
            placeholder="Share your thoughts about this run..."
            rows={4}
            disabled={submitting}
          />
        </IonItem>

        {/* Route Selection */}
        <IonItem>
          <IonLabel position="stacked">Attach Completed Route (Optional)</IonLabel>
          <IonSelect
            value={selectedRouteId}
            placeholder="Select a route"
            onIonChange={(e) => setSelectedRouteId(e.detail.value)}
            disabled={loadingRoutes || submitting}
          >
            <IonSelectOption value={undefined}>None</IonSelectOption>
            {completedRoutes.map((route) => (
              <IonSelectOption key={route.route_id} value={route.route_id}>
                {route.route_name} - {formatDistance(route.distance_km)} ({formatDuration(route.duration_seconds)})
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

        {loadingRoutes && (
          <div className="ion-text-center ion-padding">
            <IonSpinner name="crescent" />
            <p>Loading your routes...</p>
          </div>
        )}

        {/* Selected Route Preview */}
        {selectedRoute && (
          <div style={{ margin: '16px 0', padding: '12px', backgroundColor: 'var(--ion-color-light)', borderRadius: '8px' }}>
            <p style={{ margin: '4px 0', fontWeight: 'bold' }}>{selectedRoute.route_name}</p>
            <p style={{ margin: '4px 0', fontSize: '14px' }}>
              Distance: {formatDistance(selectedRoute.distance_km)} | Duration: {formatDuration(selectedRoute.duration_seconds)}
            </p>
            {selectedRoute.average_pace && (
              <p style={{ margin: '4px 0', fontSize: '14px' }}>Pace: {selectedRoute.average_pace}</p>
            )}
          </div>
        )}

        {/* Image Upload Section */}
        <div className="image-upload-section" style={{ margin: '16px 0' }}>
          {!image ? (
            <IonButton expand="block" fill="outline" onClick={handleAddPhoto} disabled={submitting}>
              <IonIcon slot="start" icon={imageOutline} />
              Add Image (Optional)
            </IonButton>
          ) : (
            <div className="preview-container">
              <IonImg
                src={image}
                alt="Preview"
                className="preview-image"
                onIonError={(e) => {
                  console.warn('[CreatePost] Image failed to load');
                  // If image fails to load, remove it from state
                  setImage(null);
                  showToastMessage('Failed to load image preview', 'warning');
                }}
              />
              <IonButton
                fill="clear"
                className="remove-image-btn"
                onClick={handleRemovePhoto}
                disabled={submitting}
              >
                <IonIcon icon={closeCircle} color="light" style={{ fontSize: "32px" }} />
              </IonButton>
            </div>
          )}
        </div>

        {/* Visibility Toggle */}
        <IonItem>
          <IonLabel>Make post private</IonLabel>
          <IonToggle
            checked={visibility === 'private'}
            onIonChange={(e) => setVisibility(e.detail.checked ? 'private' : 'public')}
            disabled={submitting}
          />
        </IonItem>
        <p style={{ fontSize: '12px', color: 'var(--ion-color-medium)', margin: '4px 16px 16px' }}>
          {visibility === 'private'
            ? 'Only you can see this post'
            : 'Visible to all your followers'}
        </p>

        {/* Create Post Button */}
        <IonButton
          expand="block"
          onClick={handleCreatePost}
          disabled={submitting || (!content.trim() && !selectedRouteId)}
        >
          {submitting ? (
            <>
              <IonSpinner name="crescent" style={{ marginRight: '8px' }} />
              Creating...
            </>
          ) : (
            'Create Post'
          )}
        </IonButton>

        {/* Toast Notification */}
        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={2000}
          position="top"
          color={toastColor}
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default CreatePost;
