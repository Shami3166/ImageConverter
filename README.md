Got it 👍 You want a **single clean README.md file** response with proper sections (no extra explanation around).
Here’s the complete content you can copy-paste into your `README.md`:

```markdown
# 🖼️ Image Converter Backend

A backend service for converting and managing files (images, videos, PDFs) with authentication, user management, and conversion tracking.  
Built using **Node.js**, **Express**, and **TypeScript** with MongoDB as the database.

---

## 🚀 Features

- 🔐 Authentication & Authorization (JWT-based)  
- 📂 File Conversions (Images, Videos, PDFs)  
- ⚡ Rate Limiting for free users  
- 🗂️ User Management (profile, history, usage limits)  
- 💳 Payment Integration (Stripe-ready)  
- 📧 Contact Form & Webhooks  
- 🧹 File Cleanup for temporary uploads  
- 📊 Logging & Error Handling  

---

## 📁 Project Structure

```

backend/
│── src/
│   ├── config/         # DB, environment, seed admin
│   ├── middleware/     # Auth, rate limiter, error handler
│   ├── models/         # MongoDB models (User, Conversion, Plan, etc.)
│   ├── controllers/    # API logic (auth, conversion, payment, etc.)
│   ├── routes/         # API routes
│   ├── services/       # Conversion services (image, video, PDF)
│   ├── utils/          # JWT, file handling, logger, cleanup
│   ├── validators/     # Input validation
│   ├── app.ts          # Express app setup
│   └── server.ts       # Entry point
│
├── uploads/            # Temporary file storage
├── .env                # Environment variables
├── tsconfig.json
├── package.json
└── README.md

````

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express, TypeScript  
- **Database:** MongoDB (Mongoose)  
- **File Processing:** Sharp (images), FFmpeg (videos), PDF-lib  
- **Auth:** JWT & Middleware  
- **Payments:** Stripe  
- **Validation:** Express-Validator  
- **Logging:** Winston / Pino  

---

## ⚙️ Installation

1. Clone the repository  
   ```bash
   git clone https://github.com/Shami3166/ImageConverter.git
   cd ImageConverter
````

2. Install dependencies

   ```bash
   npm install
   ```

3. Create a `.env` file (see `.env.example`)

   ```env
   MONGO_URI=mongodb://localhost:27017/imageconverter
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

4. Run the server

   ```bash
   npm run dev       # development
   npm run build && npm start   # production
   ```

---

## 📡 API Endpoints

| Method | Endpoint             | Description          |
| ------ | -------------------- | -------------------- |
| POST   | `/api/auth/register` | Register a new user  |
| POST   | `/api/auth/login`    | Login user & get JWT |
| GET    | `/api/user/profile`  | Get user profile     |
| POST   | `/api/convert/image` | Convert image file   |
| POST   | `/api/convert/video` | Convert video file   |
| POST   | `/api/convert/pdf`   | Convert PDF file     |
| GET    | `/api/usage`         | Get usage stats      |

---
## 🧪 Scripts

- `npm run dev` → Start development server with **nodemon** + **ts-node** (watches `src/`)  
- `npm run build` → Compile TypeScript into JavaScript (`dist/` folder)  
- `npm start` → Run compiled server from `dist/server.js` (production)  

---

