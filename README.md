# 🥻 RangMahal — Full-Stack Saree Store

**Node.js + Express + MySQL** | Full e-commerce with Admin Panel

---

## 📁 Project Structure

```
rangmahal/
├── server/
│   ├── index.js          ← Express app entry point
│   ├── db.js             ← MySQL connection pool
│   ├── setup-db.js       ← Database setup + seed script
│   ├── middleware/
│   │   └── auth.js       ← JWT authentication middleware
│   └── routes/
│       ├── auth.js       ← Login / logout / JWT
│       ├── sarees.js     ← Product CRUD + image upload
│       ├── orders.js     ← Orders + status tracking
│       └── messages.js   ← Contact messages
├── public/
│   ├── index.html        ← Customer-facing store
│   └── uploads/          ← Uploaded saree images (auto-created)
├── admin/
│   └── index.html        ← Admin dashboard
├── .env.example          ← Config template
└── package.json
```

---

## ⚙️ SETUP INSTRUCTIONS

### Step 1 — Install Node.js
Download from https://nodejs.org (LTS version)

### Step 2 — Install MySQL
- **Windows**: Download MySQL Installer from https://dev.mysql.com/downloads/installer/
- **Mac**: `brew install mysql`
- **Linux**: `sudo apt install mysql-server`

Start MySQL service and note your root password.

### Step 3 — Configure Environment
```bash
cd rangmahal
cp .env.example .env
```

Open `.env` and fill in your values:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=rangmahal_db
JWT_SECRET=any_long_random_string_here
ADMIN_EMAIL=admin@rangmahal.com
ADMIN_PASSWORD=your_admin_password
```

### Step 4 — Install Dependencies
```bash
npm install
```

### Step 5 — Set Up Database
```bash
npm run setup-db
```

This will:
- Create the `rangmahal_db` database
- Create all tables (sarees, orders, messages, etc.)
- Add your admin account
- Seed 12 sample sarees + demo orders

### Step 6 — Start the Server
```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

### Step 7 — Open in Browser
| Page | URL |
|------|-----|
| 🛍️ Customer Store | http://localhost:3000 |
| 🔧 Admin Panel | http://localhost:3000/admin |
| 🔌 API Health | http://localhost:3000/api/health |

---

## 🔌 API Reference

### Public Endpoints (no auth needed)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sarees` | List all sarees (supports ?type=Banarasi&sort=price_asc&search=) |
| GET | `/api/sarees/:id` | Single saree details |
| GET | `/api/sarees/meta/categories` | Category counts |
| POST | `/api/orders` | Place a new order |
| GET | `/api/orders/track/:orderNumber` | Track order by ID |
| POST | `/api/messages` | Send contact message |

### Admin Endpoints (JWT required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Admin login → returns JWT |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current admin info |
| GET | `/api/sarees/admin/all` | All sarees including hidden |
| POST | `/api/sarees` | Add saree (multipart/form-data for image) |
| PUT | `/api/sarees/:id` | Update saree |
| DELETE | `/api/sarees/:id` | Hide saree (soft delete) |
| GET | `/api/orders` | All orders (supports ?status=&search=) |
| GET | `/api/orders/stats/summary` | Dashboard stats |
| GET | `/api/orders/:id` | Order detail with cart & status log |
| PATCH | `/api/orders/:id/status` | Update order status + tracking |
| GET | `/api/messages` | All messages |
| PATCH | `/api/messages/:id/status` | Mark read/replied |

---

## 🛒 Admin Panel Features

| Feature | Details |
|---------|---------|
| **Dashboard** | Live stats: products, orders, revenue, unread messages |
| **Add Sarees** | Name, type, price, stock, image upload or URL, badge, description |
| **Edit/Delete** | Inline edit, soft-delete (saree stays in DB but hides from store) |
| **Orders** | Search, filter by status, update status in-place |
| **Order Detail** | Full info, WhatsApp link, add tracking number |
| **Status History** | Every status change is logged with timestamp |
| **Messages** | View full message, reply via WhatsApp/email, mark status |

---

## 🚀 Deploy to Production

### Option A — VPS (DigitalOcean / Hostinger Cloud)
```bash
# Install PM2 (process manager)
npm install -g pm2

# Start app with PM2
pm2 start server/index.js --name rangmahal
pm2 save
pm2 startup

# Set NODE_ENV in .env
NODE_ENV=production
```

### Option B — Railway.app (Easy, Free tier)
1. Push code to GitHub
2. Go to https://railway.app → New Project → Deploy from GitHub
3. Add a MySQL plugin in Railway
4. Set environment variables from your `.env`
5. Done! Auto-deploys on every push.

### Option C — Render.com
1. Push to GitHub
2. Create Web Service on Render → connect GitHub repo
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add a MySQL database service

---

## 📸 Adding Real Saree Photos

### Method 1 — Upload directly from Admin Panel
- Go to Admin → Products → Add New Saree
- Click "Upload Image" → choose file from your computer
- Images are stored in `public/uploads/` folder

### Method 2 — Use Cloudinary (Recommended for production)
1. Sign up at https://cloudinary.com (free)
2. Upload saree photos
3. Copy the image URL
4. Paste in Admin Panel → "Image URL" field

---

## 📱 WhatsApp Integration

In `.env`, set your WhatsApp number:
```env
WHATSAPP_NUMBER=919876543210
```

In `public/index.html`, update the WhatsApp link:
```html
<a href="https://wa.me/919876543210" ...>
```

Replace `919876543210` with: `91` (India code) + your 10-digit number

---

## 🔒 Security Notes

- JWT tokens expire in 24 hours
- Passwords are hashed with bcrypt (12 rounds)
- File uploads are validated (images only, max 5MB)
- SQL injection protected via parameterized queries
- CORS configured for production

---

## 🆘 Troubleshooting

**"MySQL connection failed"**
→ Check MySQL is running: `mysql -u root -p`
→ Verify DB_PASSWORD in `.env`

**"Cannot find module 'express'"**
→ Run `npm install`

**Admin login fails**
→ Run `npm run setup-db` again to recreate admin

**Images not showing**
→ Check `public/uploads/` folder exists and has write permissions
