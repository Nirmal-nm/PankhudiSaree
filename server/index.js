console.log("SERVER STARTED 🔥");
// ─── API Routes ───────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/sarees',   require('./routes/sarees'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/messages', require('./routes/messages'));

// ✅ your added routes (KEEP THEM HERE)
const changePasswordRoute = require("./routes/changePassword");
app.use("/api", changePasswordRoute);

const userAuthRoutes = require("./routes/userAuth");
app.use("/api/user", userAuthRoutes);

console.log("User auth routes loaded...");

// ─── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'RangMahal Store',
    version: '1.0.0',
    time: new Date().toISOString()
  });
});

// ─── Serve frontend pages ─────────────────────────────────────
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/index.html'));
});
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ─── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Something went wrong on the server.' });
});

// ─── 404 handler ─────────────────────────────────────────────
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found.' });
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ─── Start LAST ───────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\nServer running...');
});