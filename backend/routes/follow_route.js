// Followers of a user
app.get("/follows/:id/followers", async (req, res) => {
  try {
    const rows = await query(
      `SELECT f.follower_id, u.username 
       FROM follows f JOIN users u ON f.follower_id=u.user_id 
       WHERE f.followed_id=$1`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Following list
app.get("/follows/:id/following", async (req, res) => {
  try {
    const rows = await query(
      `SELECT f.followed_id, u.username 
       FROM follows f JOIN users u ON f.followed_id=u.user_id 
       WHERE f.follower_id=$1`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unfollow
app.delete("/follows", async (req, res) => {
  const { follower_id, followed_id } = req.body;
  try {
    await query(
      "DELETE FROM follows WHERE follower_id=$1 AND followed_id=$2",
      [follower_id, followed_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
