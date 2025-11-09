# Mobile App Group Features - Implementation Checklist

## Overview
This document compares the web implementation with the mobile app to identify missing features that need to be implemented.

---

## ✅ COMPLETED FEATURES

### 1. Groups Tab in Community Page
- [x] List all groups
- [x] Join/Joined button logic
- [x] Filter by: All, Joined, Not Joined
- [x] Search groups by name
- [x] Group cards with images and names
- [x] API integration complete
- [x] UI with green color theme

### 2. Group Feed Basic Structure
- [x] Group info card (name, description, meta)
- [x] Tab navigation (Posts, Leaderboard, Members)
- [x] Posts tab with like/comment functionality
- [x] Members tab with list display
- [x] Action sheet with group options
- [x] Leave group functionality
- [x] API service layer complete
- [x] UI with green color theme

---

## ❌ MISSING FEATURES (Needs Implementation)

### 1. CREATE GROUP ⭐ HIGH PRIORITY

**Web Implementation:** `syncrunize-react/src/components/Community/CreateGroup.tsx`

**Features to Implement:**
- [ ] Group name input with character counter (100 chars max)
- [ ] Description textarea with character counter (500 chars max)
- [ ] Cover photo upload
  - [ ] Capacitor Camera integration for photo selection
  - [ ] Image preview with drag-drop area
  - [ ] Validation: 5MB max, image files only
  - [ ] Upload to Supabase storage
- [ ] Privacy toggle (Public/Private)
  - [ ] Public: "Anyone can find and join"
  - [ ] Private: "Invite only - requires approval"
- [ ] Form validation
- [ ] Loading states
- [ ] Success/error toast notifications
- [ ] Auto-redirect to group page after creation

**API Endpoint:** Already available in `groups.ts`
```typescript
createGroup: async (userId: number, data: {
  name: string;
  description: string;
  group_picture: string;
  privacy: boolean;
}): Promise<Group>
```

**UI Design Notes:**
- Use green (#84cc16) for submit button
- Dark theme (#000000 background, #1a1a1a cards)
- Match Community.css styling patterns

---

### 2. LEADERBOARD TAB ⭐ HIGH PRIORITY

**Web Implementation:** `syncrunize-react/src/components/Community/GroupFeed.tsx` (lines 600-900)

**Features to Implement:**

#### Last Week's Leaders Section
- [ ] Distance category top 3 with medals (🥇🥈🥉)
  - [ ] Show: medal icon, avatar, name, distance value
- [ ] Total Running Time category top 3 with medals
  - [ ] Show: medal icon, avatar, name, time value
- [ ] Styled cards with gradient backgrounds

#### This Week's Leaderboard Table
- [ ] Week toggle (Last Week / This Week)
- [ ] Full table with columns:
  - [ ] Rank
  - [ ] Athlete (avatar + name)
  - [ ] Distance
  - [ ] Runs
  - [ ] Longest Run
- [ ] Sortable by distance
- [ ] Empty state message if no data
- [ ] Loading spinner while fetching

**API Endpoints:** Already available
```typescript
getWeeklyLeaderboard: async (groupId: number, week: 'current' | 'last')
getLastWeekLeaders: async (groupId: number)
```

**Current Status in Mobile:**
```typescript
{activeTab === 'leaderboard' && (
  <IonCard>
    <IonCardHeader><IonCardTitle>Leaderboard</IonCardTitle></IonCardHeader>
    <IonCardContent>
      <p>Leaderboard coming soon...</p>  // ⚠️ PLACEHOLDER
    </IonCardContent>
  </IonCard>
)}
```

---

### 3. INVITE MEMBERS MODAL ⭐ HIGH PRIORITY

**Web Implementation:** `syncrunize-react/src/components/Community/GroupFeed.tsx` (lines 1100-1300)

**Features to Implement:**
- [ ] Modal with search functionality
- [ ] Search input with debounce (500ms)
- [ ] Real-time user search results
  - [ ] Shows: avatar, name, username, location
  - [ ] Filters out current user and existing members
- [ ] Invite button per user
- [ ] Loading state per user during invite
- [ ] Success/error feedback
- [ ] Auto-refresh members list after invite

**API Endpoints:** Already available
```typescript
searchUsers: async (query: string) // in users API
inviteToGroup: async (groupId: number, userId: number)
```

**Current Status in Mobile:**
```typescript
// In action sheet
{
  text: 'Invite Members',
  icon: personAddOutline,
  handler: () => {
    setShowInviteModal(true);
  }
}

// Modal content
{showInviteModal && (
  <IonModal isOpen={showInviteModal}>
    <p>Invite members feature coming soon...</p>  // ⚠️ PLACEHOLDER
  </IonModal>
)}
```

---

### 4. CREATE POST IN GROUP ⭐ MEDIUM PRIORITY

**Web Implementation:** `syncrunize-react/src/components/Community/GroupFeed.tsx` (lines 400-600)

**Features to Implement:**
- [ ] Post creation form (title + content)
- [ ] Multi-image upload
  - [ ] Camera/Gallery selection via Capacitor
  - [ ] Multiple image support
  - [ ] Image preview with remove buttons
  - [ ] Validation per image: 5MB max, image type only
- [ ] Upload images to Supabase
- [ ] Publish button with progress indicator
- [ ] Auto-refresh feed after post creation

**API Endpoint:** Already available
```typescript
createGroupPost: async (groupId: number, data: {
  title?: string;
  content: string;
  images?: string[];
})
```

**Current Status in Mobile:**
```typescript
<IonCard className="post-input-card" routerLink="/create-post">
  <input
    type="text"
    placeholder="What's on your mind?"
    readOnly  // ⚠️ Routes to generic Create-Post page, not group-specific
  />
</IonCard>
```

**Notes:**
- Need to pass groupId context to Create-Post page OR
- Create in-modal post creation form

---

### 5. COMMENTS SYSTEM ⭐ MEDIUM PRIORITY

**Web Implementation:** `syncrunize-react/src/components/Community/GroupFeed.tsx`

**Features to Implement:**
- [ ] Expandable comments section per post
- [ ] Fetch comments when expanded
- [ ] Display comments with:
  - [ ] Author avatar, name, timestamp
  - [ ] Comment content
- [ ] Add comment input (only for members)
- [ ] Submit comment button
- [ ] Real-time comment count update
- [ ] Loading states

**API Endpoints:** Already available
```typescript
getPostComments: async (postId: number): Promise<GroupComment[]>
commentOnGroupPost: async (postId: number, content: string)
```

**Current Status in Mobile:**
```typescript
// Basic structure exists in Group-feed.tsx
const [isCommentsOpen, setIsCommentsOpen] = useState(false);
const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
const [newComment, setNewComment] = useState("");

// ⚠️ Comments modal exists but needs full implementation
```

---

### 6. IMAGE HANDLING & DISPLAY 📷 MEDIUM PRIORITY

**Web Implementation:** Comprehensive image handling in GroupFeed.tsx

**Features to Implement:**

#### Image Upload
- [ ] Supabase storage integration
- [ ] Upload to `group-posts/` bucket
- [ ] Progress indicators
- [ ] Error handling

#### Image Display in Posts
- [ ] Single image: full width
- [ ] Two images: 2-column grid
- [ ] Three images: 2+1 layout
- [ ] Four+ images: 2x2 grid with "+N more" overlay
- [ ] Click to enlarge in modal
- [ ] Loading placeholders

**Required:**
- Supabase client setup in mobile app
- Image optimization (resize before upload?)
- Cached image loading

---

### 7. ADMIN FEATURES 🔐 LOW PRIORITY

**Features to Implement:**
- [ ] Edit group details
  - [ ] Update name, description
  - [ ] Change cover photo
  - [ ] Toggle privacy setting
- [ ] Remove members (admin only)
- [ ] Promote member to admin
- [ ] Delete group (creator only)
- [ ] Delete group posts (admin only)

**API Endpoints:** Already available
```typescript
updateGroup: async (groupId: number, data: Partial<Group>)
removeMember: async (groupId: number, userId: number)
updateMemberRole: async (groupId: number, userId: number, role: 'admin' | 'member')
deleteGroup: async (groupId: number)
deleteGroupPost: async (postId: number)
```

---

### 8. GROUP HERO BANNER 🎨 LOW PRIORITY

**Web Implementation:** Large banner image at top of GroupFeed

**Features to Implement:**
- [ ] Hero banner background image
- [ ] Group logo overlay on banner
- [ ] Parallax scroll effect (optional)
- [ ] Fallback to default banner if none set

**Current Status in Mobile:**
- No banner display, only basic card with group info

---

## 📊 IMPLEMENTATION PRIORITY

### Phase 1 - Core Features (Week 1)
1. **Create Group** - Essential for group creation
2. **Leaderboard Display** - Major feature in web, currently placeholder
3. **Invite Members** - Core engagement feature

### Phase 2 - Content Features (Week 2)
4. **Create Post** - Enable group content
5. **Comments System** - Enable discussions
6. **Image Handling** - Rich media support

### Phase 3 - Polish (Week 3)
7. **Admin Features** - Group management
8. **Hero Banner** - Visual enhancement

---

## 🔧 TECHNICAL REQUIREMENTS

### Dependencies Needed
- [x] `@capacitor/camera` - Already installed
- [ ] Supabase client for mobile - Verify setup
- [ ] Image compression library (optional: `react-native-image-crop-picker`)

### API Service
- [x] All endpoints defined in `services/groups.ts`
- [x] User search endpoint available
- [ ] Verify Supabase integration

### UI Components to Create
1. `CreateGroupModal.tsx` or `CreateGroup.tsx` page
2. `LeaderboardTab.tsx` component
3. `InviteMembersModal.tsx` component
4. `CreateGroupPostModal.tsx` component
5. `CommentsSection.tsx` component
6. `ImageGallery.tsx` component

---

## 📝 NOTES FROM WEB IMPLEMENTATION

### Create Group Web Code Pattern
```typescript
// Privacy toggle
<IonRadioGroup value={privacy} onIonChange={(e) => setPrivacy(e.detail.value!)}>
  <IonItem><IonRadio value="public" /><IonLabel>Public</IonLabel></IonItem>
  <IonItem><IonRadio value="private" /><IonLabel>Private</IonLabel></IonItem>
</IonRadioGroup>

// Image upload to Supabase
const filePath = `group-covers/${Date.now()}_${file.name}`;
const { error: uploadError } = await supabase.storage
  .from('group-images')
  .upload(filePath, file);

const { data: urlData } = supabase.storage
  .from('group-images')
  .getPublicUrl(filePath);
```

### Leaderboard Web Code Pattern
```typescript
// Toggle between weeks
<div className="leaderboard-toggle">
  <button
    className={weekFilter === 'last' ? 'active' : ''}
    onClick={() => setWeekFilter('last')}
  >
    Last Week
  </button>
  <button
    className={weekFilter === 'current' ? 'active' : ''}
    onClick={() => setWeekFilter('current')}
  >
    This Week
  </button>
</div>

// Medal display
const medals = ['🥇', '🥈', '🥉'];
{lastWeekLeaders.distance.map((leader, idx) => (
  <div className="leader-card">
    <span className="medal">{medals[idx]}</span>
    <img src={leader.avatar} alt={leader.name} />
    <p className="name">{leader.name}</p>
    <p className="value">{leader.value}</p>
  </div>
))}
```

### Invite Members Web Code Pattern
```typescript
// Debounced search
useEffect(() => {
  const debounce = setTimeout(async () => {
    if (searchQuery.trim().length > 0) {
      setIsSearching(true);
      const results = await searchUsers(searchQuery);
      // Filter out current user and existing members
      const filtered = results.filter(
        u => u.user_id !== currentUserId &&
             !members.some(m => m.user_id === u.user_id)
      );
      setSearchResults(filtered);
      setIsSearching(false);
    }
  }, 500);
  return () => clearTimeout(debounce);
}, [searchQuery]);
```

---

## 🎯 SUCCESS CRITERIA

Mobile app should match web app feature parity for:
- ✅ Group listing and filtering
- ✅ Joining/leaving groups
- ✅ Viewing group details
- ✅ Viewing posts and basic interactions
- ❌ Creating groups
- ❌ Viewing leaderboards
- ❌ Inviting members
- ❌ Creating posts
- ❌ Full comments functionality
- ❌ Image galleries
- ❌ Admin features

**Target:** 90% feature parity with web implementation
**Current:** ~50% feature parity
