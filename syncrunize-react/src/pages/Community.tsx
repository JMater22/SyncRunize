import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  IonPage,
  IonContent,
  IonSelect,
  IonSelectOption,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonButton,
  IonSearchbar,
  IonSpinner,
  IonToast,
} from "@ionic/react";

import "../components/Community/Community.css";
import { supabase } from "../supabaseClient";

interface Group {
  group_id: number;
  name: string;
  description: string;
  location?: string;
  group_picture: string;
  privacy: boolean; 
  member_count?: number;
}

const Community: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<number[]>([]);
  // Store member counts as object: { groupId: count }
  const [memberCounts, setMemberCounts] = useState<{ [groupId: number]: number }>({});
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [authToken, setAuthToken] = useState<string>("");

  // Search and Filter States
  const [searchName, setSearchName] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "joined" | "not-joined">("all");

  // Loading and Toast States
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger" | "warning">("success");

  // Helper function for toast
  const showToastMessage = (message: string, color: "success" | "danger" | "warning" = "success") => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  // Fetch current user and groups
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Get current user
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) return;

        const token = session.access_token;
        setAuthToken(token);

        const { data: user } = await axios.get(
          `${import.meta.env.VITE_API_URL}/users/me`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setCurrentUserId(user.user_id);

        // Fetch all groups (pass auth so backend returns private groups you own/joined)
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/groups/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setGroups(response.data);
        setFilteredGroups(response.data);

      } catch (error) {
        console.error("Error fetching data:", error);
        showToastMessage("Failed to load groups", "danger");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch joined groups and member counts for current user
  useEffect(() => {
    if (!currentUserId || groups.length === 0) return;

    const fetchJoinedGroupsAndCounts = async () => {
      try {
        const joinedGroupIds: number[] = [];
        const counts: { [groupId: number]: number } = {};

        // Check membership for each group
        for (const group of groups) {
          try {
            // Get all members of this group
            const res = await axios.get(
              `${import.meta.env.VITE_API_URL}/group-members/${group.group_id}/members`,
              { headers: { Authorization: `Bearer ${authToken}` } }
            );

            // Store member count for this group
            counts[group.group_id] = res.data.length;

            // Check if current user is in the members list
            const isMember = res.data.some((member: any) => member.user_id === currentUserId);
            
            if (isMember) {
              joinedGroupIds.push(group.group_id);
            }
          } catch (error) {
            // If endpoint doesn't exist yet or group has no members, set count to 0
            console.log(`Could not fetch members for group ${group.group_id}`);
            counts[group.group_id] = 0;
          }
        }

        setJoinedGroups(joinedGroupIds);
        setMemberCounts(counts);
      } catch (error) {
        console.error("Error fetching joined groups:", error);
      }
    };

    fetchJoinedGroupsAndCounts();
  }, [groups, currentUserId, authToken]);

  // Filter groups based on search and filter criteria
  useEffect(() => {
    let filtered = [...groups];

    // Filter by name
    if (searchName.trim()) {
      filtered = filtered.filter(group =>
        group.name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    // Filter by location
    if (searchLocation.trim()) {
      filtered = filtered.filter(group =>
        group.location?.toLowerCase().includes(searchLocation.toLowerCase())
      );
    }

    // Filter by joined status
    if (filterStatus === "joined") {
      filtered = filtered.filter(group => joinedGroups.includes(group.group_id));
    } else if (filterStatus === "not-joined") {
      filtered = filtered.filter(group => !joinedGroups.includes(group.group_id));
    }

    setFilteredGroups(filtered);
  }, [searchName, searchLocation, filterStatus, groups, joinedGroups]);

  // Handle join/leave group
  const handleJoinToggle = async (groupId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card navigation

    if (!currentUserId) {
      showToastMessage("Please log in to join groups", "warning");
      return;
    }

    try {
      setIsJoining(groupId);

      if (joinedGroups.includes(groupId)) {
        // Leave group
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/group-members/${groupId}/members/${currentUserId}`,  // ✅ Fixed: leave → members
          { headers: { Authorization: `Bearer ${authToken}` } }
        );

        setJoinedGroups(joinedGroups.filter((id) => id !== groupId));
        // Decrease member count
        setMemberCounts(prev => ({
          ...prev,
          [groupId]: Math.max(0, (prev[groupId] || 0) - 1)
        }));
        showToastMessage("Left the group successfully", "success");

      } else {
        // Join group
        await axios.post(
          `${import.meta.env.VITE_API_URL}/group-members/${groupId}/addMembers`,  // ✅ Fixed: join → addMembers
          {},  // ✅ No body needed - backend uses req.user.user_id from auth middleware
          { headers: { Authorization: `Bearer ${authToken}` } }
        );

        setJoinedGroups([...joinedGroups, groupId]);
        // Increase member count
        setMemberCounts(prev => ({
          ...prev,
          [groupId]: (prev[groupId] || 0) + 1
        }));
        showToastMessage("Joined the group successfully!", "success");
      }

    } catch (error: any) {
      console.error("Error toggling join:", error);
      showToastMessage(
        error.response?.data?.error || "Failed to join/leave group",
        "danger"
      );
    } finally {
      setIsJoining(null);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <section className="groups-page-header">
          <h1 className="page-title">Groups</h1>
          <IonButton className="create-group-btn" routerLink="/create-group">
            Create a Group
          </IonButton>
        </section>

        <section className="filter-search-bar">
          <IonGrid>
            <IonRow className="filter-row ion-align-items-center ion-justify-content-between">
              <IonCol size="12" sizeMd="6">
                <div style={{ display: "flex", gap: "8px" }}>
                  <IonSearchbar
                    placeholder="Search by Club Name"
                    className="club-searchbar"
                    value={searchName}
                    onIonInput={(e) => setSearchName(e.detail.value || "")}
                    debounce={300}
                  />
                </div>
              </IonCol>
              <IonCol size="12" sizeMd="1" className="Dropdown-col">
                <IonSelect
                  placeholder="Joined Clubs"
                  className="filter-select"
                  interface="popover"
                  value={filterStatus}
                  onIonChange={(e) => setFilterStatus(e.detail.value)}
                >
                  <IonSelectOption value="all" className="select-option-all">
                    All Clubs
                  </IonSelectOption>
                  <IonSelectOption value="joined" className="select-option-joined">
                    Only Joined
                  </IonSelectOption>
                  <IonSelectOption value="not-joined" className="select-option-not-joined">
                    Not Joined
                  </IonSelectOption>
                </IonSelect>
              </IonCol>
            </IonRow>
          </IonGrid>
        </section>

        {isLoading ? (
          <div className="ion-text-center ion-padding">
            <IonSpinner name="crescent" style={{ width: "50px", height: "50px" }} />
            <p>Loading groups...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="ion-text-center ion-padding">
            <p style={{ fontSize: "18px", color: "#666" }}>
              {searchName || searchLocation || filterStatus !== "all"
                ? "No groups found matching your criteria"
                : "No groups available"}
            </p>
          </div>
        ) : (
          <section className="groups-grid">
            <IonGrid>
              <IonRow>
                {filteredGroups.map((group) => {
                  const memberCount = memberCounts[group.group_id] || 0;
                  
                  return (
                    <IonCol key={group.group_id} size="12" sizeMd="6" sizeLg="3">
                      <IonCard
                        className="group-card clickable-card"
                        routerLink={`/group/${group.group_id}`}
                      >
                        <img src={group.group_picture} alt={group.name} />
                        <IonCardContent className="card-info">
                          <h3>{group.name}</h3>
                          <p className="member-count">
                            {memberCount} {memberCount === 1 ? "Member" : "Members"}
                          </p>
                          <IonButton
                            className={
                              joinedGroups.includes(group.group_id) ? "joined-btn" : "join-btn"
                            }
                            expand="block"
                            onClick={(e) => handleJoinToggle(group.group_id, e)}
                            disabled={isJoining === group.group_id}
                          >
                            {isJoining === group.group_id ? (
                              <IonSpinner name="crescent" />
                            ) : joinedGroups.includes(group.group_id) ? (
                              "Joined"
                            ) : (
                              "Join"
                            )}
                          </IonButton>
                        </IonCardContent>
                      </IonCard>
                    </IonCol>
                  );
                })}
              </IonRow>
            </IonGrid>
          </section>
        )}

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default Community;
