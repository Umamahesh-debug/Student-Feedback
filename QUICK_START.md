# Quick Start Guide

## Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas account (already configured)

## Step 1: Backend Setup

```bash
cd backend
npm install
npm run dev
```

The backend will start on `http://localhost:5000`

## Step 2: Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
```

Create `.env` file in frontend directory:
```
REACT_APP_API_URL=http://localhost:5000/api
```

Then start the frontend:
```bash
npm start
```

The frontend will start on `http://localhost:3000`

## Step 3: First Time Setup

### Create a Teacher Account
1. Go to Register page
2. Select "Teacher" role
3. Fill in details (Department, Designation, Phone are optional)
4. Register

### Verify Teacher (For Testing)
After registering as teacher, you can verify yourself using the API:
```bash

####### SAME STEPS USED IN PRODUCTION ALSO ########


### Create a Student Account
1. Go to Register page
2. Select "Student" role
3. Fill in details (Roll Number, Branch, Section are optional)
4. Register

## Step 4: Using the System

### As a Teacher:
1. Login with teacher account
2. Go to "My Courses" → "Create New Course"
3. Fill course details and select number of days
          ## 🤖 AI Course Generation (Puter.com)

This app uses [Puter.com](https://puter.com) free AI API to generate course content.

### First Time Setup for Teachers:
1. Click **"One-Click Full Course"** or **"Auto-Generate"** button
2. A **Puter.com popup** will appear asking you to create a free account
3. Sign up with Google or create a free account
4. Once logged in, AI generation will work automatically
5. You only need to do this **once** — Puter remembers your login

### What Puter is Used For:
- ⚡ One-Click Full Course Plan generation
- ⚡ Auto-generating subtopics for each topic
- ⚡ Generating course descriptions

> **Note:** Puter.com is completely free. No credit card required.
4. Configure sections for each day
5. Publish the course (change status to "active")
6. Go to "Enrollments" to approve student enrollments
7. Go to "Attendance" to mark attendance
8. View analytics in "Program Analytics"

### As a Student:
1. Login with student account
2. Go to "Browse Courses" to see available courses
3. Click "Enroll Now" on any course
4. Wait for teacher approval
5. View your courses in "My Courses"
6. Check attendance in "Attendance" section
7. Update profile with picture and details
8. Verify the certificates

## Features Overview

### Teacher Features:
- ✅ Create/Edit/Delete Courses
- ✅ Dynamic sections based on days (1-30)
- ✅ Approve/Reject enrollments
- ✅ Mark attendance (multiple modes)
- ✅ View analytics and reports
- ✅ Timetable/Calendar view
- ✅ Generate reports (PDF/Excel)

### Student Features:
- ✅ Browse available courses
- ✅ Enroll in courses
- ✅ View enrolled courses
- ✅ Track progress and attendance
- ✅ View timetable
- ✅ Update profile
- ✅ Verify certificates

## Troubleshooting

### Backend Issues:
- Make sure MongoDB connection string is correct in `.env`
- Check if port 5000 is available
- Verify Cloudinary credentials

### Frontend Issues:
- Make sure backend is running
- Check `.env` file has correct API URL
- Clear browser cache if needed

### Common Errors:
- **401 Unauthorized**: Token expired, login again
- **403 Forbidden**: Wrong role, check user role
- **404 Not Found**: Check API endpoint URL
- **500 Server Error**: Check backend logs

## Database Models

- **User**: Stores user information (students and teachers)
- **Course**: Stores course details and sections
- **Enrollment**: Tracks student enrollments
- **Attendance**: Records daily attendance
- **Feedback**: Stores student feedback

## API Authentication

All API requests (except login/register) require:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

Token is automatically included from localStorage after login.

## Next Steps

1. Create your first course as a teacher
2. Enroll as a student
3. Mark attendance
4. View analytics
5. Generate reports

Now 
# 🎓 Student Feedback System

## 🌐 Live Production Links
student and teacher : https://student-feedback-zlcp.vercel.app/login
login using the above link and follow the STEPS PREVIOUSLY DISCUSSED

Admin :  https://student-feedback-zlcp.vercel.app/admin

Enjoy using the Student Feedback System! 🎓
