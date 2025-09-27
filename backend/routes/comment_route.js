// Get comments by post
app.get("/comments/post/:id", async (req, res) => {
  try {
    const rows = await query(
      `SELECT c.comment_id, c.content, c.created_at, u.username
       FROM comments c JOIN users u ON c.user_id=u.user_id
       WHERE c.post_id=$1 ORDER BY c.created_at ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update comment
app.put("/comments/:id", async (req, res) => {
  try {
    const rows = await query(
      "UPDATE comments SET content=$2 WHERE comment_id=$1 RETURNING *",
      [req.params.id, req.body.content]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete comment
app.delete("/comments/:id", async (req, res) => {
  try {
    await query("DELETE FROM comments WHERE comment_id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
