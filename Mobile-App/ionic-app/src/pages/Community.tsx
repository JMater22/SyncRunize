import { useState, useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonTextarea,
  IonSegment,
  IonSegmentButton,
  IonIcon,
  IonImg,
  IonSearchbar,
  IonModal,
  IonButtons,
  IonToast,
  IonActionSheet,
  IonSpinner,
} from "@ionic/react";
import {
  trophy,
  chatboxEllipses,
  people,
  camera,
  images,
  close,
} from "ionicons/icons";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import CommunityChallengesTab from "../components/CommunityChallengesTab";
import CommunityFeedTab from "../components/CommunityFeedTab";
import GroupCard from "../components/group-card";
import { usePushNotifications } from "../components/push-notification";
import { useUser } from "../contexts/UserContext";
import { usePosts } from "../contexts/PostsContext";
import { GroupsApi, Group } from "../services/groups";
import "../theme/Community.css";

const Community: React.FC = () => {
  const [tab, setTab] = useState<"challenges" | "feed" | "groups">("feed");
  const { currentUser } = useUser();
  const { fetchFeed } = usePosts();
  const location = useLocation<{ focusChallengeId?: number }>();
  const history = useHistory();
  const [focusedChallengeId, setFocusedChallengeId] = useState<number | undefined>(undefined);
  // Groups state
  const [groups, setGroups] = useState<Group[]>([]);
  const [userGroups, setUserGroups] = useState<number[]>([]); // IDs of groups user is member of
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<"all" | "joined" | "not-joined">("all");

  // Create Group Modal state
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupPhoto, setGroupPhoto] = useState<string | null>(null);
  const [showPhotoActionSheet, setShowPhotoActionSheet] = useState(false);

  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning'>('success');

  const triggerToast = (message: string, color: 'success' | 'danger' | 'warning' = 'success') => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  useEffect(() => {
    const focusId = location.state?.focusChallengeId;
    if (focusId) {
      setTab('challenges');
      setFocusedChallengeId(focusId);
      const { focusChallengeId: _removed, ...rest } = location.state || {};
      history.replace({
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
        state: Object.keys(rest).length ? rest : undefined,
      });
    }
  }, [history, location]);

  // Fetch groups when the tab is active
  useEffect(() => {
    if (tab === 'groups') {
      fetchGroups();
    }
  }, [tab]);

  const fetchGroups = async () => {
    if (!currentUser) {
      console.log('[Community] No current user, skipping fetchGroups');
      return;
    }

    try {
      setLoadingGroups(true);
      setGroupsError(null);

      console.log('[Community] Fetching all groups...');
      // Fetch all groups (includes privacy filtering on backend)
      const allGroups = await GroupsApi.getAllGroups();
      console.log('[Community] All groups fetched:', allGroups);
      setGroups(Array.isArray(allGroups) ? allGroups : []);

      console.log('[Community] Fetching user joined groups for user:', currentUser.user_id);
      // Fetch user's joined groups
      const joinedGroups: any = await GroupsApi.getUserJoinedGroups(currentUser.user_id);
      console.log('[Community] Joined groups fetched:', joinedGroups);

      // Handle both possible response formats: array of numbers OR array of Group objects
      let joinedGroupIds: number[] = [];
      if (Array.isArray(joinedGroups)) {
        if (joinedGroups.length > 0 && typeof joinedGroups[0] === 'number') {
          // API returned array of IDs directly
          joinedGroupIds = joinedGroups as number[];
        } else {
          // API returned array of Group objects
          joinedGroupIds = joinedGroups.map((g: any) => g.group_id);
        }
      }
      console.log('[Community] Joined group IDs:', joinedGroupIds);
      setUserGroups(joinedGroupIds);
    } catch (err: any) {
      console.error('[Community] Failed to fetch groups:', err);
      setGroupsError(err.message || 'Failed to fetch groups');
      setGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  // Initialize push notifications
  usePushNotifications({
    onNotificationReceived: (notification) => {
      console.log('Notification received:', notification);
      setToastMessage(notification.title || 'New notification');
      setToastColor('success');
      setShowToast(true);
    },
    onNotificationActionPerformed: (notification) => {
      console.log('Notification tapped:', notification);

      const data = notification.notification.data;
      if (data?.type === 'comment' || data?.type === 'like') {
        setTab('feed');
        fetchFeed(); // Refresh feed
      } else if (data?.type === 'challenge') {
        setTab('challenges');
      } else if (data?.type === 'group') {
        setTab('groups');
      }
    }
  });
  /** 📸 Select Photo for Group - Android Platform */
  const selectGroupPhoto = async (source: CameraSource) => {
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
        setGroupPhoto(photo.webPath);
        setToastMessage("Group photo added!");
        setToastColor('success');
        setShowToast(true);
      }
    } catch (error) {
      console.error("Camera error:", error);
      setToastMessage("Failed to select photo.");
      setToastColor('danger');
      setShowToast(true);
    }
  };

  const handleAddGroupPhoto = () => {
    setShowPhotoActionSheet(true);
  };

  const handleRemoveGroupPhoto = () => {
    setGroupPhoto(null);
    setToastMessage("Photo removed.");
    setToastColor('success');
    setShowToast(true);
  };

  const handleCreateGroup = async () => {
    if (!currentUser) {
      setToastMessage('Please log in to create a group');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    if (!groupName.trim()) {
      setToastMessage("Please enter a group name");
      setToastColor('warning');
      setShowToast(true);
      return;
    }

    if (!groupPhoto) {
      setToastMessage("Please add a group photo");
      setToastColor('warning');
      setShowToast(true);
      return;
    }

    try {
      await GroupsApi.createGroup(currentUser.user_id, {
        name: groupName.trim(),
        description: groupDescription.trim(),
        group_picture: groupPhoto,
        privacy: false, // Public by default
      });

      setToastMessage("Group created successfully!");
      setToastColor('success');
      setShowToast(true);

      // Reset form and close modal
      setGroupName("");
      setGroupDescription("");
      setGroupPhoto(null);
      setIsCreateGroupModalOpen(false);

      // Refresh groups list
      fetchGroups();
    } catch (error: any) {
      console.error('Failed to create group:', error);
      setToastMessage(error.message || 'Failed to create group');
      setToastColor('danger');
      setShowToast(true);
    }
  };

  const handleJoinGroup = async (groupId: number) => {
    if (!currentUser) {
      triggerToast('Please log in to join groups', 'danger');
      return;
    }

    // Check if already a member
    if (userGroups.includes(groupId)) {
      triggerToast('You are already a member of this group', 'warning');
      return;
    }

    try {
      await GroupsApi.joinGroup(groupId);
      triggerToast('Joined group successfully!', 'success');

      // Add to user groups list and refresh
      setUserGroups(prev => [...prev, groupId]);

      // Optionally refresh the entire groups list to get updated member counts
      fetchGroups();
    } catch (error: any) {
      console.error('Failed to join group:', error);
      triggerToast(error.message || 'Failed to join group', 'danger');
    }
  };

  return (
    <IonPage className="community-page">
      <IonHeader className="community-header">
        <IonToolbar>
          <IonButtons slot="start">
          </IonButtons>
          <IonTitle>Community</IonTitle>
        </IonToolbar>

        <IonToolbar className="segment-toolbar">
          <IonSegment
            value={tab}
            onIonChange={(e) =>
              setTab((e.detail.value ?? "feed") as
                | "challenges"
                | "feed"
                | "groups")
            }
            className="community-segment"
          >
            <IonSegmentButton value="challenges" className="segment-btn">
              <IonIcon icon={trophy} />
              <IonLabel>Challenges</IonLabel>
            </IonSegmentButton>

            <IonSegmentButton value="feed" className="segment-btn">
              <IonIcon icon={chatboxEllipses} />
              <IonLabel>Feed</IonLabel>
            </IonSegmentButton>

            <IonSegmentButton value="groups" className="segment-btn">
              <IonIcon icon={people} />
              <IonLabel>Group</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent className="community-content">
        {tab === "challenges" && (
          <CommunityChallengesTab
            focusChallengeId={focusedChallengeId}
            onFocusHandled={() => setFocusedChallengeId(undefined)}
          />
        )}

        {tab === "feed" && (
          <CommunityFeedTab onToast={triggerToast} />
        )}

        {tab === "groups" && (
          <div className="groups-tab">
            <div className="groups-header">
              <IonButton
                className="create-groups-btn"
                onClick={() => setIsCreateGroupModalOpen(true)}
              >
                Create Groups
              </IonButton>
              <IonSearchbar
                placeholder="Search groups..."
                className="group-search"
                value={groupSearchQuery}
                onIonInput={(e) => setGroupSearchQuery(e.detail.value || '')}
              />

              {/* Filter Dropdown */}
              <IonItem lines="none" style={{ marginTop: '8px' }}>
                <IonLabel>Filter:</IonLabel>
                <IonSegment
                  value={groupFilter}
                  onIonChange={(e) => setGroupFilter(e.detail.value as "all" | "joined" | "not-joined")}
                  style={{ maxWidth: '300px' }}
                >
                  <IonSegmentButton value="all">
                    <IonLabel>All</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="joined">
                    <IonLabel>Joined</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="not-joined">
                    <IonLabel>Not Joined</IonLabel>
                  </IonSegmentButton>
                </IonSegment>
              </IonItem>
            </div>

            {loadingGroups ? (
              <div className="ion-text-center ion-padding">
                <IonSpinner name="crescent" />
                <p>Loading groups...</p>
              </div>
            ) : groupsError ? (
              <div className="ion-text-center ion-padding">
                <p style={{ color: 'var(--ion-color-danger)' }}>{groupsError}</p>
                <IonButton onClick={() => fetchGroups()} size="small">
                  Retry
                </IonButton>
              </div>
            ) : (
              <div className="groups-section">
                {(() => {
                  console.log('[Community Render] groups:', groups);
                  console.log('[Community Render] userGroups:', userGroups);
                  console.log('[Community Render] groupFilter:', groupFilter);

                  // Apply filter logic
                  let filteredGroups = groups;

                  // Filter by membership status
                  if (groupFilter === 'joined') {
                    filteredGroups = filteredGroups.filter(g => userGroups.includes(g.group_id));
                  } else if (groupFilter === 'not-joined') {
                    filteredGroups = filteredGroups.filter(g => !userGroups.includes(g.group_id));
                  }
                  // 'all' shows both joined and public non-joined groups (private groups already filtered by backend)

                  // Filter by search query
                  if (groupSearchQuery.trim()) {
                    filteredGroups = filteredGroups.filter(g =>
                      g.name.toLowerCase().includes(groupSearchQuery.toLowerCase()) ||
                      g.description?.toLowerCase().includes(groupSearchQuery.toLowerCase())
                    );
                  }

                  console.log('[Community Render] filteredGroups:', filteredGroups);

                  // Separate joined and not joined for display
                  const joinedFiltered = filteredGroups.filter(g => userGroups.includes(g.group_id));
                  const notJoinedFiltered = filteredGroups.filter(g => !userGroups.includes(g.group_id));

                  console.log('[Community Render] joinedFiltered:', joinedFiltered);
                  console.log('[Community Render] notJoinedFiltered:', notJoinedFiltered);

                  return (
                    <>
                      {/* Show joined groups if filter allows */}
                      {(groupFilter === 'all' || groupFilter === 'joined') && joinedFiltered.length > 0 && (
                        <>
                          <h2 className="section-title">Your Groups</h2>
                          <div className="group-list">
                            {joinedFiltered.map((group) => (
                              <GroupCard
                                key={group.group_id}
                                name={group.name}
                                imageSrc={group.group_picture}
                                isJoined={true}
                                routerLink={`/group-feed/${group.group_id}`}
                              />
                            ))}
                          </div>
                        </>
                      )}

                      {/* Show not joined groups if filter allows */}
                      {(groupFilter === 'all' || groupFilter === 'not-joined') && notJoinedFiltered.length > 0 && (
                        <>
                          <h2 className="section-title">
                            {groupFilter === 'not-joined' ? 'Available Groups' : 'Discover Groups'}
                          </h2>
                          <div className="group-list">
                            {notJoinedFiltered.map((group) => (
                              <GroupCard
                                key={group.group_id}
                                name={group.name}
                                imageSrc={group.group_picture}
                                showJoinButton={!group.privacy} // Show join button only for public groups
                                isJoined={false}
                                onJoin={() => handleJoinGroup(group.group_id)}
                              />
                            ))}
                          </div>
                        </>
                      )}

                      {/* No results message */}
                      {filteredGroups.length === 0 && (
                        <div className="ion-text-center ion-padding">
                          <p style={{ color: 'var(--ion-color-medium)' }}>
                            {groupSearchQuery
                              ? 'No groups found matching your search.'
                              : groupFilter === 'joined'
                              ? 'You have not joined any groups yet.'
                              : 'No groups available.'}
                          </p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Create Group Modal */}
        <IonModal isOpen={isCreateGroupModalOpen} onDidDismiss={() => setIsCreateGroupModalOpen(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Create Group</IonTitle>
              <IonButton
                slot="end"
                fill="clear"
                onClick={() => setIsCreateGroupModalOpen(false)}
              >
                Cancel
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="modal-content">
            <div className="create-form">
              <IonItem>
                <IonLabel position="stacked">Group Name</IonLabel>
                <IonInput
                  value={groupName}
                  onIonInput={e => setGroupName(e.detail.value!)}
                  placeholder="Enter group name"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Description</IonLabel>
                <IonTextarea
                  value={groupDescription}
                  onIonInput={e => setGroupDescription(e.detail.value!)}
                  placeholder="Describe your group"
                  rows={4}
                />
              </IonItem>

              {/* Group Photo Upload Section */}
              <div style={{ margin: "16px 0" }}>
                {!groupPhoto ? (
                  <IonButton
                    expand="block"
                    fill="outline"
                    onClick={handleAddGroupPhoto}
                  >
                    <IonIcon slot="start" icon={camera} />
                    Add Group Photo
                  </IonButton>
                ) : (
                  <div style={{ position: "relative", marginBottom: "16px" }}>
                    <IonImg
                      src={groupPhoto}
                      alt="Group Photo Preview"
                      style={{
                        width: "100%",
                        height: "200px",
                        objectFit: "cover",
                        borderRadius: "8px"
                      }}
                    />
                    <IonButton
                      fill="clear"
                      color="danger"
                      style={{ position: "absolute", top: "8px", right: "8px" }}
                      onClick={handleRemoveGroupPhoto}
                    >
                      <IonIcon icon={close} />
                    </IonButton>
                  </div>
                )}
              </div>

              <IonButton expand="block" onClick={handleCreateGroup}>
                Create Group
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Photo Action Sheet */}
        <IonActionSheet
          isOpen={showPhotoActionSheet}
          onDidDismiss={() => setShowPhotoActionSheet(false)}
          buttons={[
            {
              text: 'Take Photo',
              icon: camera,
              handler: () => selectGroupPhoto(CameraSource.Camera)
            },
            {
              text: 'Choose from Gallery',
              icon: images,
              handler: () => selectGroupPhoto(CameraSource.Photos)
            },
            {
              text: 'Cancel',
              role: 'cancel'
            }
          ]}
        />

        {/* Toast */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="bottom"
          color={toastColor}
        />
      </IonContent>
    </IonPage>
  );
};

export default Community;
