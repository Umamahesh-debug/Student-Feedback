# Environment Files Setup Guide

## Backend .env File

Create a file named `.env` in the `backend` directory with the following content:

```env
PORT=5000
MONGODB_URI=mongodb+srv://shareenpan2:Fgouter55@cluster0.s3dpu.mongodb.net/feebackgnani?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_jwt_secret_key_change_in_production
CLOUDINARY_CLOUD_NAME=dhyusdxpj
CLOUDINARY_API_KEY=698634345187571
CLOUDINARY_API_SECRET=0A1DXS5d92wdyhz3MInCEpgcthM
```

### Steps:
1. Navigate to `backend` folder
2. Create a new file named `.env` (no extension)
3. Copy the content from `backend/.env.txt` or copy from above
4. Save the file

**Note:** Change `JWT_SECRET` to a strong random string in production!

---

## Frontend .env File

Create a file named `.env` in the `frontend` directory with the following content:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Steps:
1. Navigate to `frontend` folder
2. Create a new file named `.env` (no extension)
3. Copy the content from `frontend/.env.txt` or copy from above
4. Save the file

**Note:** If your backend runs on a different port, update the URL accordingly.

---

## Quick Setup Commands

### Windows (PowerShell):
```powershell
# Backend
cd backend
Copy-Item .env.txt .env

# Frontend
cd ..\frontend
Copy-Item .env.txt .env
```

### Windows (CMD):
```cmd
# Backend
cd backend
copy .env.txt .env

# Frontend
cd ..\frontend
copy .env.txt .env
```

### Linux/Mac:
```bash
# Backend
cd backend
cp .env.txt .env

# Frontend
cd ../frontend
cp .env.txt .env
```

---

## Important Notes

1. **Never commit .env files to Git** - They contain sensitive information
2. **Backend .env** - Contains database credentials and API keys
3. **Frontend .env** - Contains API endpoint URL
4. Both `.env.txt` files are provided as templates - rename them to `.env` to use them

---

## Verification

After creating the `.env` files:

1. **Backend**: Start the server - it should connect to MongoDB
2. **Frontend**: Start the app - it should connect to the backend API

If you see connection errors, double-check:
- MongoDB URI is correct
- Cloudinary credentials are correct
- API URL in frontend matches backend port

