// Get user by ID
app.get("/users/:id", async (req, res) => {
  try {
    const rows = await query(
      "SELECT user_id, email, username, profile_picture FROM users WHERE user_id=$1",
      [req.params.id]
    );
    res.json(rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user by email
app.get("/users/email/:email", async (req, res) => {
  try {
    const rows = await query(
      "SELECT user_id, email, username, profile_picture FROM users WHERE email=$1",
      [req.params.email]
    );
    res.json(rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user profile
app.put("/users/:id", async (req, res) => {
  const { profile_picture, username, hashed_password } = req.body;
  try {
    const rows = await query(
      `UPDATE users 
       SET profile_picture = COALESCE($2, profile_picture),
           username = COALESCE($3, username),
           hashed_password = COALESCE($4, hashed_password)
       WHERE user_id=$1
       RETURNING user_id, email, username, profile_picture`,
      [req.params.id, profile_picture, username, hashed_password]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user (admin action)
app.delete("/users/:id", async (req, res) => {
  try {
    await query("DELETE FROM users WHERE user_id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
