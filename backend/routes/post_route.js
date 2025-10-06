// Get all posts
app.get("/posts", async (req, res) => {
  try {
    const rows = await query(
      `SELECT p.post_id, p.content, p.image_url, p.created_at, u.username
       FROM posts p JOIN users u ON p.user_id=u.user_id
       ORDER BY p.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get posts by user
app.get("/posts/user/:id", async (req, res) => {
  try {
    const rows = await query(
      "SELECT * FROM posts WHERE user_id=$1 ORDER BY created_at DESC",
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update post
app.put("/posts/:id", async (req, res) => {
  const { content, image_url } = req.body;
  try {
    const rows = await query(
      `UPDATE posts 
       SET content = COALESCE($2, content),
           image_url = COALESCE($3, image_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE post_id=$1
       RETURNING *`,
      [req.params.id, content, image_url]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete post
app.delete("/posts/:id", async (req, res) => {
  try {
    await query("DELETE FROM posts WHERE post_id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
