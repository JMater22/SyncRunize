# Quick Guide: Implementing Challenge & Badge Notifications

## Step 1: Run Database Migrations

Execute the SQL file to add new columns and indexes:

```bash
# Connect to your Supabase database and run:
psql -h your-db-host -U postgres -d postgres -f backend/sql/notification_alterations.sql
```

Or run directly in Supabase SQL Editor:
- Open Supabase Dashboard
- Go to SQL Editor
- Copy contents of `backend/sql/notification_alterations.sql`
- Execute

## Step 2: Add Notification Triggers to Your Controllers

### For Challenge Completion

In your challenge controller (wherever you mark challenges as complete):

```javascript
import * as NotificationService from "../services/notification_service.js";
import { supabase } from "../utils/supabase.js";

// Example: Update user_challenges when challenge is completed
export const updateChallengeProgress = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { challengeId } = req.params;
    const { progress, isCompleted } = req.body;

    // Update the user's challenge progress
    const { data: userChallenge, error } = await supabase
      .from("user_challenges")
      .update({
        progress: progress,
        completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null
      })
      .eq("user_id", userId)
      .eq("challenge_id", challengeId)
      .select()
      .single();

    if (error) throw error;

    // 🔔 Send notification if challenge was just completed
    if (isCompleted) {
      // Get challenge details
      const { data: challenge } = await supabase
        .from("challenges")
        .select("name, badge_image")
        .eq("challenge_id", challengeId)
        .single();

      if (challenge) {
        // Get badge image URL from Supabase storage
        const badgeImageUrl = challenge.badge_image
          ? supabase.storage
              .from('assets')
              .getPublicUrl(`challenges/${challenge.badge_image}`).data.publicUrl
          : null;

        // Send notification
        await NotificationService.notifyChallengeComplete(
          userId,
          challengeId,
          challenge.name,
          badgeImageUrl
        );
      }
    }

    res.json({ success: true, data: userChallenge });
  } catch (err) {
    console.error("Error updating challenge:", err);
    res.status(500).json({ error: err.message });
  }
};
```

### For Badge Earned (Distance Milestones)

Add this logic to your route tracking or stats controller:

```javascript
import * as NotificationService from "../services/notification_service.js";
import { supabase } from "../utils/supabase.js";

// Example: After saving a new route
export const saveRoute = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { distance_km } = req.body;

    // Save the route...
    // ... your existing route save logic ...

    // Calculate total distance
    const { data: routes } = await supabase
      .from("user_routes")
      .select("distance_km")
      .eq("user_id", userId);

    const totalDistance = routes.reduce((sum, r) => sum + (r.distance_km || 0), 0);

    // 🔔 Check if user reached new milestones and hasn't been awarded yet
    await checkAndAwardBadges(userId, totalDistance);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Helper function to check and award badges
const checkAndAwardBadges = async (userId, totalDistance) => {
  try {
    // Check what badges user already has
    const { data: existingBadges } = await supabase
      .from("user_badges")
      .select("badge_name")
      .eq("user_id", userId);

    const hasBronze = existingBadges?.some(b => b.badge_name === 'Bronze');
    const hasSilver = existingBadges?.some(b => b.badge_name === 'Silver');
    const hasGold = existingBadges?.some(b => b.badge_name === 'Gold');

    // Award Bronze (100km)
    if (totalDistance >= 100 && !hasBronze) {
      // Save badge to database
      await supabase.from("user_badges").insert({
        user_id: userId,
        badge_name: 'Bronze',
        earned_at: new Date().toISOString()
      });

      // Get badge image URL
      const badgeUrl = supabase.storage
        .from('assets')
        .getPublicUrl('badges/Bronze.png').data.publicUrl;

      // Send notification
      await NotificationService.notifyBadgeEarned(userId, 'Bronze', badgeUrl);
    }

    // Award Silver (500km)
    if (totalDistance >= 500 && !hasSilver) {
      await supabase.from("user_badges").insert({
        user_id: userId,
        badge_name: 'Silver',
        earned_at: new Date().toISOString()
      });

      const badgeUrl = supabase.storage
        .from('assets')
        .getPublicUrl('badges/Silver.png').data.publicUrl;

      await NotificationService.notifyBadgeEarned(userId, 'Silver', badgeUrl);
    }

    // Award Gold (1000km)
    if (totalDistance >= 1000 && !hasGold) {
      await supabase.from("user_badges").insert({
        user_id: userId,
        badge_name: 'Gold',
        earned_at: new Date().toISOString()
      });

      const badgeUrl = supabase.storage
        .from('assets')
        .getPublicUrl('badges/Gold.png').data.publicUrl;

      await NotificationService.notifyBadgeEarned(userId, 'Gold', badgeUrl);
    }
  } catch (err) {
    console.error("Error checking badges:", err);
  }
};
```

## Step 3: Ensure Badge Images Exist in Supabase Storage

Upload badge images to your Supabase storage:

### Storage Structure
```
assets/
├── badges/
│   ├── Bronze.png
│   ├── Silver.png
│   └── Gold.png
└── challenges/
    ├── Couch to 5K.jpg
    ├── The 7-Day Starter.jpg
    ├── Three Times a Week.jpg
    └── [other challenge images]
```

### Upload via Supabase Dashboard:
1. Go to Storage in Supabase Dashboard
2. Select or create `assets` bucket
3. Create folders: `badges/` and `challenges/`
4. Upload badge images
5. Set bucket to **public** (or use signed URLs)

### Upload via Code (optional):
```javascript
const fs = require('fs');

// Upload badge
const { data, error } = await supabase.storage
  .from('assets')
  .upload('badges/Bronze.png', fs.readFileSync('./badges/Bronze.png'), {
    contentType: 'image/png',
    upsert: true
  });
```

## Step 4: Test the Implementation

### Test Challenge Completion:
```bash
# Complete a challenge via API
curl -X PUT http://localhost:3000/api/challenges/progress/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "progress": 100,
    "isCompleted": true
  }'

# Check notification appears in frontend
# Should show challenge badge image
```

### Test Badge Earned:
```bash
# Create a route that pushes user over milestone
curl -X POST http://localhost:3000/api/routes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "distance_km": 50,
    ...
  }'

# If total distance >= 100km, Bronze badge notification appears
```

## Step 5: Verify Notifications Appear

1. Open app in browser
2. Perform action that triggers notification (complete challenge, reach milestone)
3. Check notification FAB button shows unread count
4. Click to open notifications
5. Verify:
   - Badge image appears in notification
   - Message is correct
   - Clicking navigates to correct page (challenges or profile)
   - Notification marks as read

## Common Issues

### Badge images not showing?
- Check images exist in Supabase storage
- Verify bucket is public or use signed URLs
- Check `badge_image_url` column has correct URL
- Check browser console for 404 errors

### Notifications not triggering?
- Verify SQL alterations were applied
- Check backend logs for errors
- Ensure `NotificationService` functions are called after action completes
- Verify user is authenticated

### Real-time not working?
- Check Supabase Realtime is enabled for `notifications` table
- Verify WebSocket connection in browser network tab
- Check `NotificationProvider` is wrapping app

## Performance Tips

1. **Batch badge checks**: Don't check badges after every route - do it daily or weekly
2. **Cache total distance**: Store in user profile instead of calculating each time
3. **Use database triggers**: Consider PostgreSQL triggers for automatic badge awards
4. **Limit notification queries**: Use indexes (already added in SQL file)

## Example: Adding Notification to Existing Challenge Logic

If you already have challenge completion logic, just add this at the end:

```javascript
// Your existing challenge completion code
// ...

// 🔔 ADD THIS:
const { data: challenge } = await supabase
  .from("challenges")
  .select("name, badge_image")
  .eq("challenge_id", challengeId)
  .single();

if (challenge) {
  const badgeImageUrl = challenge.badge_image
    ? supabase.storage.from('assets').getPublicUrl(`challenges/${challenge.badge_image}`).data.publicUrl
    : null;

  await NotificationService.notifyChallengeComplete(
    userId,
    challengeId,
    challenge.name,
    badgeImageUrl
  );
}
```

That's it! The notification will appear in real-time to the user.
