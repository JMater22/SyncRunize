import React, { useState, useEffect, useCallback } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonButton,
  IonSpinner,
  IonIcon,
} from "@ionic/react";
import { personAddOutline, personRemoveOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { UsersApi, SearchUserResult } from "../services/users";
import { FollowsApi } from "../services/follows";
import { getAvatarUrl } from "../lib/utils";
import "../theme/Search-Runners.css";

export default function SearchRunners() {
  const history = useHistory();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUserResult[]>([]);
  const [followingUsers, setFollowingUsers] = useState<Set<number>>(new Set());
  const [searchLoading, setSearchLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const checkFollowStatus = useCallback(async (userId: number): Promise<boolean> => {
    try {
      const { isFollowing } = await FollowsApi.getFollowStatus(userId);
      return isFollowing;
    } catch (error) {
      console.error(`Failed to check follow status for user ${userId}:`, error);
      return false;
    }
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    try {
      setSearchLoading(true);

      // Search users
      const users = await UsersApi.searchUsers(query);
      setSearchResults(users);

      // Check follow status for each user
      const userIds = users.map(u => u.user_id);
      const followStatuses = await Promise.all(
        userIds.map(userId => checkFollowStatus(userId))
      );

      const following = new Set<number>(
        userIds.filter((_, index) => followStatuses[index])
      );
      setFollowingUsers(following);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearchLoading(false);
    }
  }, [checkFollowStatus]);

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch(searchQuery.trim());
      } else {
        setSearchResults([]);
        setFollowingUsers(new Set());
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, handleSearch]);

  const handleToggleFollow = async (userId: number) => {
    try {
      setActionLoading(userId);
      const response = await FollowsApi.toggleFollow(userId);

      // Update follow status
      setFollowingUsers(prev => {
        const newSet = new Set(prev);
        if (response.isFollowing) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUserClick = (userId: number) => {
    history.push('/other-profile', { userId });
  };

  return (
    <IonPage>
      <IonHeader className="dark-header">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/community" text="" />
          </IonButtons>
          <IonTitle>Find Athletes</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="search-runners-content">
        {/* Search bar */}
        <div className="search-section">
          <IonSearchbar
            value={searchQuery}
            onIonInput={(e) => setSearchQuery(e.detail.value!)}
            placeholder="Search athletes..."
            debounce={0}
            className="search-bar"
          />
        </div>

        {/* Loading state */}
        {searchLoading && (
          <div className="loading-container">
            <IonSpinner name="crescent" color="primary" />
            <p>Searching...</p>
          </div>
        )}

        {/* Results */}
        {!searchLoading && searchResults.length > 0 && (
          <IonList className="results-list">
            {searchResults.map((user) => {
              const isFollowing = followingUsers.has(user.user_id);
              const isLoading = actionLoading === user.user_id;

              return (
                <IonItem
                  key={user.user_id}
                  className="user-item"
                  button
                >
                  <IonAvatar
                    slot="start"
                    onClick={() => handleUserClick(user.user_id)}
                    className="user-avatar"
                  >
                    <img src={getAvatarUrl(user.profile_picture)} alt={user.name} />
                  </IonAvatar>
                  <IonLabel onClick={() => handleUserClick(user.user_id)}>
                    <h3 className="user-name">{user.name}</h3>
                    <p className="user-username">@{user.username}</p>
                    {user.location && <p className="user-location">{user.location}</p>}
                  </IonLabel>
                  <IonButton
                    slot="end"
                    fill={isFollowing ? "outline" : "solid"}
                    size="small"
                    color={isFollowing ? "medium" : "primary"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFollow(user.user_id);
                    }}
                    disabled={isLoading}
                    className="follow-button"
                  >
                    {isLoading ? (
                      <IonSpinner name="crescent" />
                    ) : (
                      <>
                        <IonIcon
                          icon={isFollowing ? personRemoveOutline : personAddOutline}
                          slot="start"
                        />
                        {isFollowing ? "Unfollow" : "Follow"}
                      </>
                    )}
                  </IonButton>
                </IonItem>
              );
            })}
          </IonList>
        )}

        {/* Empty state */}
        {!searchLoading && searchQuery.length >= 2 && searchResults.length === 0 && (
          <div className="empty-state">
            <p>No athletes found matching "{searchQuery}"</p>
          </div>
        )}

        {/* Initial state */}
        {!searchLoading && searchQuery.length < 2 && (
          <div className="empty-state">
            <p>Enter at least 2 characters to search for athletes</p>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
