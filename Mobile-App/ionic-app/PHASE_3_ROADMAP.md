# Phase 3: Posts & Community Feed - ROADMAP 📋

## Overview
Phase 3 focuses on implementing the social features of the app: posts, likes, comments, and the community feed. This will transform static/mock data into real backend-integrated social functionality.

---

## Current State Analysis

### Community.tsx Structure
The Community page currently has 3 tabs:
1. **Challenges Tab** - Uses mock data from `challenge-data.tsx`
2. **Feed Tab** - Uses mock data from `post-data.tsx`
3. **Groups Tab** - Uses mock data from `group-data.tsx`

**Mock Data Sources**:
- `components/challenge-data.tsx` - Hardcoded challenges
- `components/post-data.tsx` - Hardcoded posts
- `components/group-data.tsx` - Hardcoded groups

**Current Features** (All with mock data):
- Like/unlike posts (local state only)
- Comment on posts (local state only)
- Join challenges (local state only)
- Create groups (UI only, no backend)

---

## Phase 3 Tasks

### Task 3.1: Implement Post Feed ✅ NEXT
**Goal**: Replace mock post data with real backend posts

**Files to Modify**:
- `pages/Community.tsx` - Feed tab
- Use `PostsContext` (already created in Phase 1)

**What to Implement**:
1. Fetch posts from backend using `PostsContext.fetchFeed()`
2. Display posts in Feed tab
3. Show post author info (name, username, avatar)
4. Display post content/caption
5. Show route stats if post has route data
6. Display post timestamp (relative time)
7. Show like and comment counts
8. Add pull-to-refresh functionality
9. Loading states and error handling
10. Empty state UI

**API Endpoints**:
- `GET /api/posts/feed` - Get posts from followed users
- Uses `PostsApi.getFeed()` from services

**Dependencies**:
- PostsContext (✅ Already created)
- PostsApi (✅ Already created)
- UserContext for current user

---

### Task 3.2: Add Post Creation
**Goal**: Enable users to create posts with text and images

**Files to Modify**:
- `pages/Create-Post.tsx` or `components/Home/CreatePostPage.tsx`
- `pages/Community.tsx` (add create post button)

**What to Implement**:
1. Create post modal/page with form
2. Text input for post content/caption
3. Image upload functionality (Camera/Gallery)
4. Option to attach a route (from completed runs)
5. Visibility toggle (public/private)
6. Form validation
7. Submit to backend
8. Show success toast
9. Refresh feed after creation
10. Image preview with remove option

**Features**:
- **Text-only Post**: Just caption/content
- **Route-based Post**: Includes route stats, map snapshot
- **Image Post**: Upload photos from gallery or camera

**API Endpoints**:
- `POST /api/posts` - Create new post
- Uses `PostsApi.createPost()` and `PostsContext.createPost()`

**Image Upload**:
- Supabase Storage or backend file upload endpoint
- Compress images before upload
- Show upload progress

---

### Task 3.3: Implement Likes & Comments
**Goal**: Enable users to like and comment on posts

**Files to Modify**:
- `pages/Community.tsx` - Add like/comment actions
- `pages/View-Posts.tsx` - Individual post view with comments

**What to Implement**:

**Likes**:
1. Like button with heart icon
2. Display like count
3. Toggle like/unlike
4. Optimistic UI updates
5. Liked state indicator (filled vs outline heart)
6. Error handling with reversion

**Comments**:
7. Comment button with count
8. Comments modal/section
9. Display existing comments
10. Add new comment functionality
11. Comment input with submit
12. Real-time comment count updates
13. Show commenter info (avatar, name)
14. Comment timestamps

**API Endpoints**:
- `POST /api/likes/{postId}/toggle` - Like/unlike post
- `GET /api/comments/{postId}` - Get post comments
- `POST /api/comments/{postId}` - Add comment
- Uses `LikesApi.toggleLike()` and `CommentsApi`

**Features**:
- Optimistic updates for instant feedback
- Error reversion if API fails
- Auto-refresh comment list after adding
- Scroll to load more comments (if pagination implemented)

---

## Implementation Order

### Step 1: Post Feed (Task 3.1)
This is the foundation - users need to see posts before they can interact with them.

```
Community.tsx (Feed Tab)
  └─ PostsContext.fetchFeed()
     └─ Display list of posts
        ├─ Post author info
        ├─ Post content
        ├─ Route stats (if applicable)
        ├─ Post timestamp
        └─ Like/comment counts (display only)
```

### Step 2: Likes (Task 3.3a)
Enable basic interaction with existing posts.

```
Community.tsx (Feed Tab)
  └─ Each Post Card
     └─ Like Button
        ├─ PostsContext.toggleLike()
        ├─ Optimistic UI update
        └─ Error handling
```

### Step 3: Comments (Task 3.3b)
Add deeper engagement with posts.

```
View-Posts.tsx or Comments Modal
  ├─ CommentsApi.getComments()
  ├─ Display comment list
  └─ Add comment form
     └─ CommentsApi.addComment()
```

### Step 4: Post Creation (Task 3.2)
Allow users to create their own content.

```
Create-Post.tsx
  ├─ Text input
  ├─ Image upload (optional)
  ├─ Route selection (optional)
  └─ PostsContext.createPost()
     └─ Refresh feed
```

---

## Data Flow

### Fetching Posts
```
User opens Community tab (Feed)
  └─ useEffect triggers PostsContext.fetchFeed()
     └─ PostsApi.getFeed()
        └─ GET /api/posts/feed
           └─ Backend returns posts from followed users
              └─ Update PostsContext.posts state
                 └─ Component re-renders with real posts
```

### Liking a Post
```
User taps Like button
  └─ PostsContext.toggleLike(postId)
     ├─ Optimistic: Update local state immediately
     └─ LikesApi.toggleLike(postId)
        └─ POST /api/likes/{postId}/toggle
           ├─ Success: Update with server response
           └─ Error: Revert optimistic update
```

### Creating a Post
```
User fills create post form
  └─ Tap Submit
     └─ PostsContext.createPost(content, routeId, visibility)
        └─ PostsApi.createPost()
           └─ POST /api/posts
              ├─ Success: Add to local posts array
              ├─ Show success toast
              └─ Close modal
```

---

## UI/UX Considerations

### Post Card Design
Each post should display:
- Author avatar (clickable to profile)
- Author name and username
- Post timestamp (relative: "2h ago")
- Post content/caption
- Route stats (if route-based post):
  - Distance, duration, pace, calories
  - Map snapshot image
- Like button with count
- Comment button with count
- Options menu (edit/delete for own posts)

### Feed Layout
- Vertical scrolling list
- Pull-to-refresh at top
- Loading spinner while fetching
- Empty state: "No posts yet. Follow athletes to see their activities!"
- Error state: "Failed to load posts" with retry button

### Comments UI
- Modal or expandable section
- Scrollable comment list
- Fixed comment input at bottom
- Show commenter avatar and name
- Relative timestamps
- Auto-focus input when opening

---

## Backend Integration Summary

### Services Already Created (Phase 1)
✅ `PostsApi` - All post CRUD operations
✅ `LikesApi` - Like/unlike functionality
✅ `CommentsApi` - Comment management
✅ `PostsContext` - Global posts state with methods

### What's Ready to Use
```typescript
// PostsContext
const { posts, fetchFeed, createPost, toggleLike, addComment } = usePosts();

// Fetch feed
await fetchFeed();

// Like a post
await toggleLike(postId);

// Add comment
await addComment(postId, "Great run!");

// Create post
await createPost("Just completed my first 5K!", routeId, 'public');
```

---

## Testing Checklist

### Post Feed
- [ ] Posts load from backend
- [ ] Author info displays correctly
- [ ] Post timestamps show relative time
- [ ] Route stats display for route-based posts
- [ ] Like counts display
- [ ] Comment counts display
- [ ] Pull-to-refresh works
- [ ] Empty state shows when no posts
- [ ] Loading spinner appears while fetching
- [ ] Error handling works

### Likes
- [ ] Like button toggles state
- [ ] Like count increases/decreases
- [ ] Heart icon fills when liked
- [ ] Optimistic update is instant
- [ ] Reverts on API error
- [ ] Backend receives update

### Comments
- [ ] Comments load for each post
- [ ] Can add new comments
- [ ] Comment count updates
- [ ] Comments show author info
- [ ] Timestamps display
- [ ] Input clears after submit
- [ ] Loading states work

### Post Creation
- [ ] Can create text-only post
- [ ] Can upload images
- [ ] Can attach route data
- [ ] Visibility toggle works
- [ ] Validation prevents empty posts
- [ ] Success toast appears
- [ ] Feed refreshes with new post
- [ ] Form resets after submit

---

## Next Steps

After completing Phase 3, you'll have:
- ✅ Fully functional social feed
- ✅ Like and comment interactions
- ✅ Post creation with media
- ✅ Real-time user engagement

**Then proceed to Phase 4: Routes & Run Tracking**

---

## Questions Before Starting?

Before we begin implementation, consider:
1. Should we use modal or dedicated page for post creation?
2. Do you want infinite scroll or pagination for feed?
3. Should comments be in a modal or expandable in the feed?
4. Any specific design preferences for post cards?

---

**Ready to start Task 3.1?** Just say **"Begin Task 3.1"** or **"Start implementing post feed"**!
