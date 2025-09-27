
// Count likes
app.get("/likes/post/:id", async (req, res) => {
  try {
    const rows = await query(
      "SELECT COUNT(*) AS like_count FROM likes WHERE post_id=$1",
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unlike post
app.delete("/likes", async (req, res) => {
  const { user_id, post_id } = req.body;
  try {
    await query("DELETE FROM likes WHERE user_id=$1 AND post_id=$2", [
      user_id,
      post_id,
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
