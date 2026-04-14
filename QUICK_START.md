````md
# 🎓 Student Feedback System

## 🌐 Live Production Links
- **Student & Teacher:** https://student-feedback-zlcp.vercel.app/login  
- **Admin Panel:** https://student-feedback-zlcp.vercel.app/admin  

Login using the above links and follow the steps below.

---

# 🚀 Quick Start Guide

## Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas account (already configured)

---

## 🔧 Step 1: Backend Setup
```bash
cd backend
npm install
npm run dev
````

Backend runs on: `http://localhost:5000`

---

## 💻 Step 2: Frontend Setup

```bash
cd frontend
npm install
```

Create `.env` file:

```
REACT_APP_API_URL=http://localhost:5000/api
```

Start frontend:

```bash
npm start
```

Frontend runs on: `http://localhost:3000`

---

## 👤 Step 3: First Time Setup

### Create a Teacher Account

1. Go to Register page
2. Select **Teacher**
3. Fill details
4. Register

### Create a Student Account

1. Go to Register page
2. Select **Student**
3. Fill details
4. Register

---

# 🧑‍🏫 System Usage

## 👨‍🏫 Teacher Features

* ✅ Create/Edit/Delete Courses
* ✅ Dynamic course sections (1–30 days)
* ✅ Approve/Reject student enrollments
* ✅ Mark attendance
* ✅ View analytics & reports
* ✅ Timetable
* ✅ Generate PDF/Excel 
* ✅ Verify certificates 

### 🤖 AI Course Generation (Puter.com)

* One-click course generation
* Auto-generate topics & subtopics
* Course descriptions

---

## 👨‍🎓 Student Features

* ✅ Browse courses
* ✅ Enroll in courses
* ✅ Track attendance
* ✅ View timetable
* ✅ Update profile
* ✅ Verify certificates

---

# 🛡️ Admin Features

## 👑 Admin Dashboard

* ✅ Overview of total users (Students, Teachers)
* ✅ Total courses and enrollments
* ✅ System analytics & reports

## 👥 User Management

* ✅ View all users
* ✅ Activate/Deactivate accounts
* ✅ Delete users
* ✅ Manage roles (Student/Teacher)

## 📚 Course Management

* ✅ View all courses
* ✅ Approve or remove courses
* ✅ Monitor course activity

## 📊 Analytics & Monitoring

* ✅ Platform-wide analytics
* ✅ Student engagement tracking
* ✅ Course performance insights

## 🛠️ System Control

* ✅ Manage feedback data
* ✅ Handle reported issues
* ✅ Ensure platform integrity

---

# ⚙️ API Authentication

All protected APIs require:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

# 🗄️ Database Models

* **User**
* **Course**
* **Enrollment**
* **Attendance**
* **Feedback**

---

# 🧪 Troubleshooting

## Backend Issues

* Check MongoDB connection
* Ensure port 5000 is free
* Verify environment variables

## Frontend Issues

* Backend must be running
* Check `.env` file
* Clear browser cache

## Common Errors

* **401 Unauthorized** → Login again
* **403 Forbidden** → Role issue
* **404 Not Found** → Wrong API URL
* **500 Server Error** → Check backend logs

---

# ✅ Next Steps

1. Create a course (Teacher)
2. Enroll in course (Student)
3. Mark attendance
4. View analytics
5. Generate reports

---

🎉 **Enjoy using the Student Feedback System!**

```
```
