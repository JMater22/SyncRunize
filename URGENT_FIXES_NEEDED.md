# Urgent Fixes for Mobile App Group Features

## Issues Reported by User

1. **Posts not loading properly** ✗
2. **Create Post doesn't match web version** ✗
3. **UI text not readable** ✗
4. **Community tabs not UI/UX friendly** ✗
5. **Profile pictures not loading** ✗

---

## FIXES NEEDED

### 1. Fix Group Feed Posts Rendering

**File:** `Mobile-App/ionic-app/src/pages/Group-feed.tsx`

**Issues:**
- Avatar images using wrong property: `post.author_avatar` instead of proper field
- Text colors too dark (#666) - not readable on dark theme
- Missing error handling for broken images
- Missing `formatRelativeTime` import
- Missing `DEFAULT_AVATAR` import

**Changes Needed at Line 663-722:**

```typescript
// Add imports at top:
import { formatRelativeTime, DEFAULT_AVATAR, getAvatarUrl } from "../lib/utils";

// Replace entire posts rendering section (lines 663-722) with:
{/* Feed Posts from Backend */}
<div className="feed-posts">
  {groupPosts.length === 0 ? (
    <div style={{ textAlign: 'center', padding: '48px 16px' }}>
      <IonIcon icon={documentTextOutline} style={{ fontSize: '64px', color: '#666666', marginBottom: '16px' }} />
      <h3 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '18px' }}>No Posts Yet</h3>
      <p style={{ color: '#999999', margin: 0, fontSize: '14px' }}>
        {isUserJoined ? 'Be the first to share something with the group!' : 'Join the group to see posts.'}
      </p>
    </div>
  ) : (
    groupPosts.map((post) => (
      <IonCard key={post.post_id} className="post-card">
        <IonCardContent style={{ padding: '16px' }}>
          <div className="post-header" style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px'}}>
            <IonAvatar style={{ width: '44px', height: '44px' }}>
              <img
                src={getAvatarUrl(post.author_avatar || post.users?.profile_picture)}
                alt={post.author_name}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = DEFAULT_AVATAR;
                }}
              />
            </IonAvatar>
            <div className="user-info" style={{ flex: 1 }}>
              <div className="username" style={{fontWeight: '700', color: '#ffffff', fontSize: '15px', marginBottom: '2px'}}>
                {post.author_name || post.users?.name || 'Unknown User'}
              </div>
              <div className="timestamp" style={{fontSize: '13px', color: '#999999'}}>
                {formatRelativeTime(post.created_at)}
              </div>
            </div>
          </div>

          {post.title && (
            <h3 style={{ margin: '0 0 8px 0', color: '#ffffff', fontSize: '17px', fontWeight: '700' }}>
              {post.title}
            </h3>
          )}
          <p className="post-text" style={{ color: '#ffffff', fontSize: '15px', lineHeight: '1.5', margin: '0 0 12px 0' }}>
            {post.content}
          </p>

          {post.images && post.images.length > 0 && post.images[0] && (
            <img
              src={post.images[0]}
              alt="Post content"
              className="post-image"
              style={{
                borderRadius: '12px',
                marginBottom: '12px',
                width: '100%',
                maxHeight: '400px',
                objectFit: 'cover'
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          )}

          <div className="post-actions" style={{
            display: 'flex',
            gap: '24px',
            paddingTop: '12px',
            borderTop: '1px solid #2a2a2a'
          }}>
            <IonButton
              fill="clear"
              size="small"
              onClick={() => handleLike(post.post_id)}
              style={{ '--padding-start': '0', '--padding-end': '0', margin: 0 }}
            >
              <IonIcon
                icon={likes[post.post_id]?.isLiked ? heart : heartOutline}
                color={likes[post.post_id]?.isLiked ? "danger" : "medium"}
                style={{ fontSize: '22px', marginRight: '6px' }}
              />
              <span style={{ color: '#ffffff', fontSize: '14px' }}>
                {likes[post.post_id]?.count || 0}
              </span>
            </IonButton>
            <IonButton
              fill="clear"
              size="small"
              onClick={() => openComments(post.post_id)}
              style={{ '--padding-start': '0', '--padding-end': '0', margin: 0 }}
            >
              <IonIcon
                icon={chatbubbleOutline}
                color="medium"
                style={{ fontSize: '22px', marginRight: '6px' }}
              />
              <span style={{ color: '#ffffff', fontSize: '14px' }}>
                {post.comments_count || 0}
              </span>
            </IonButton>
          </div>
        </IonCardContent>
      </IonCard>
    ))
  )}
</div>
```

---

### 2. Fix Leaderboard Avatar Images

**File:** `Mobile-App/ionic-app/src/pages/Group-feed.tsx`

**Issues:**
- Avatars use `<img>` instead of `<IonAvatar><img>`
- No error handling for broken images
- Using `leader.avatar` which may not exist

**Changes at Lines 746-747, 775-776, 823-824:**

```typescript
// Replace all avatar images in leaderboard with:
<IonAvatar style={{ width: '60px', height: '60px', margin: '0 auto 8px' }}>
  <img
    src={getAvatarUrl(leader.avatar || leader.profile_picture)}
    alt={leader.name}
    onError={(e) => {
      const target = e.target as HTMLImageElement;
      target.src = DEFAULT_AVATAR;
    }}
  />
</IonAvatar>

// For table rows (line 823):
<IonAvatar style={{ width: '36px', height: '36px', flexShrink: 0 }}>
  <img
    src={getAvatarUrl(entry.avatar || entry.profile_picture)}
    alt={entry.name}
    onError={(e) => {
      const target = e.target as HTMLImageElement;
      target.src = DEFAULT_AVATAR;
    }}
  />
</IonAvatar>
```

---

### 3. Fix Members Tab Avatar Images

**File:** `Mobile-App/ionic-app/src/pages/Group-feed.tsx`

**Changes at Lines 948-950:**

```typescript
<IonAvatar style={{ width: '48px', height: '48px' }}>
  <img
    src={getAvatarUrl(member.users?.profile_picture)}
    alt={member.users?.name}
    onError={(e) => {
      const target = e.target as HTMLImageElement;
      target.src = DEFAULT_AVATAR;
    }}
  />
</IonAvatar>
```

---

### 4. Fix Community Tabs UI/UX

**File:** `Mobile-App/ionic-app/src/theme/Community.css`

**Issues:**
- Segment buttons too small
- Not enough padding
- Colors not distinct enough

**Changes Needed:**

```css
/* Better segment styling - around line 27 */
.segment-toolbar {
  --background: #000000;
  --border-color: #2a2a2a;
  border-bottom: 1px solid #2a2a2a;
}

.community-segment {
  --background: #0a0a0a;
  padding: 4px;
  border-radius: 12px;
  margin: 8px 16px;
}

.segment-btn {
  --color: #999999;
  --color-checked: #000000;
  --indicator-color: #84cc16;
  --background-checked: #84cc16;
  --border-radius: 8px;
  min-height: 44px;
  margin: 2px;
  transition: all 0.2s ease;
}

.segment-btn ion-icon {
  font-size: 22px;
  margin-bottom: 2px;
}

.segment-btn ion-label {
  font-size: 13px;
  font-weight: 600;
  text-transform: none;
}

.segment-btn.segment-button-checked {
  font-weight: 700;
}
```

---

### 5. Implement Create Post Modal for Groups

**File:** `Mobile-App/ionic-app/src/pages/Group-feed.tsx`

**Current Issue:**
- Routes to generic `/create-post` page
- Doesn't pass group context
- Not matching web implementation

**Solution:** Create inline post creation modal

**Add state variables (after line 115):**

```typescript
// Create Post Modal state
const [showCreatePostModal, setShowCreatePostModal] = useState(false);
const [postTitle, setPostTitle] = useState("");
const [postContent, setPostContent] = useState("");
const [postImages, setPostImages] = useState<string[]>([]);
const [isCreatingPost, setIsCreatingPost] = useState(false);
```

**Replace post input card (line 647-660):**

```typescript
{isUserJoined && (
  <IonCard
    className="post-input-card"
    onClick={() => setShowCreatePostModal(true)}
    style={{ cursor: 'pointer' }}
  >
    <IonItem lines="none">
      <IonAvatar slot="start">
        <img src={getAvatarUrl(currentUser?.profile_picture)} alt="You" />
      </IonAvatar>
      <div style={{
        flex: 1,
        padding: '12px',
        color: '#999999',
        fontSize: '15px'
      }}>
        What's on your mind?
      </div>
    </IonItem>
  </IonCard>
)}
```

**Add Create Post Modal (before closing tags at end):**

```typescript
{/* Create Post Modal */}
<IonModal isOpen={showCreatePostModal} onDidDismiss={() => {
  setShowCreatePostModal(false);
  setPostTitle("");
  setPostContent("");
  setPostImages([]);
}}>
  <IonHeader>
    <IonToolbar>
      <IonButtons slot="start">
        <IonButton onClick={() => {
          setShowCreatePostModal(false);
          setPostTitle("");
          setPostContent("");
          setPostImages([]);
        }}>
          Cancel
        </IonButton>
      </IonButtons>
      <IonTitle>Create Post</IonTitle>
      <IonButtons slot="end">
        <IonButton
          onClick={handleCreatePost}
          disabled={!postContent.trim() || isCreatingPost}
          color="success"
          strong
        >
          {isCreatingPost ? 'Posting...' : 'Post'}
        </IonButton>
      </IonButtons>
    </IonToolbar>
  </IonHeader>
  <IonContent>
    <div style={{ padding: '16px' }}>
      <IonItem>
        <IonLabel position="stacked">Title (Optional)</IonLabel>
        <IonInput
          value={postTitle}
          onIonInput={e => setPostTitle(e.detail.value!)}
          placeholder="Add a title..."
          maxlength={100}
        />
      </IonItem>

      <IonItem style={{ marginTop: '16px' }}>
        <IonLabel position="stacked">What's on your mind?</IonLabel>
        <IonTextarea
          value={postContent}
          onIonInput={e => setPostContent(e.detail.value!)}
          placeholder="Share something with the group..."
          rows={6}
          autoGrow
        />
      </IonItem>

      {/* TODO: Add image upload section */}
      <p style={{ color: '#999999', fontSize: '12px', padding: '8px 16px' }}>
        Image upload coming soon
      </p>
    </div>
  </IonContent>
</IonModal>
```

**Add handler function (after handleInviteUser):**

```typescript
const handleCreatePost = async () => {
  if (!groupId || !currentUser || !postContent.trim()) return;

  try {
    setIsCreatingPost(true);

    await GroupsApi.createGroupPost(parseInt(groupId), {
      title: postTitle.trim() || undefined,
      content: postContent.trim(),
      images: postImages.length > 0 ? postImages : undefined
    });

    setToastMessage('Post created successfully!');
    setToastColor('success');
    setShowToast(true);

    // Close modal and reset
    setShowCreatePostModal(false);
    setPostTitle("");
    setPostContent("");
    setPostImages([]);

    // Refresh posts
    fetchGroupData();
  } catch (err: any) {
    console.error('Failed to create post:', err);
    setToastMessage(err.message || 'Failed to create post');
    setToastColor('danger');
    setShowToast(true);
  } finally {
    setIsCreatingPost(false);
  }
};
```

---

## SUMMARY OF ALL FILES TO MODIFY

1. **Group-feed.tsx** - Major updates to posts, leaderboard, members rendering + create post modal
2. **Community.css** - Better segment styling for tabs
3. **Group-feed.css** - Already has good styles, may need minor tweaks

## PRIORITY ORDER

1. Fix avatar images (HIGH - breaks user trust)
2. Fix text readability (HIGH - unusable)
3. Fix posts rendering (HIGH - core feature)
4. Improve Community tabs UI (MEDIUM)
5. Add Create Post modal (MEDIUM)

All these fixes are critical for a functional, usable mobile app that matches the web version's quality.
