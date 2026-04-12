# Firebase Setup Guide for KrishSathi

This guide will help you set up Firebase for the KrishSathi application, including Firestore database, Authentication, Storage, and Cloud Messaging.

## Prerequisites

- Google account
- Firebase project created
- Node.js 18+ and Java 17+ installed

## Step 1: Create Firebase Project

1. **Go to Firebase Console**
   - Visit [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Sign in with your Google account

2. **Create New Project**
   - Click "Create a project"
   - Enter project name: `krishsathi` (or your preferred name)
   - Enable Google Analytics (recommended)
   - Choose Analytics account or create new one
   - Click "Create project"

3. **Wait for project creation** (usually takes 1-2 minutes)

## Step 2: Enable Firebase Services

### 2.1 Enable Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select a location close to your users (e.g., `asia-south1` for India)
5. Click **Done**

### 2.2 Enable Authentication

1. Go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** provider
3. Optionally enable **Phone** and **Google** providers
4. Save changes

### 2.3 Enable Storage

1. Go to **Storage**
2. Click **Get started**
3. Choose **Start in test mode**
4. Select same location as Firestore
5. Click **Done**

### 2.4 Enable Cloud Messaging

1. Go to **Cloud Messaging**
2. No additional setup needed for basic functionality

## Step 3: Get Firebase Configuration

### 3.1 Web App Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click **Web** icon (`</>`)
4. Enter app nickname: `krishsathi-web`
5. Check **"Also set up Firebase Hosting"** (optional)
6. Click **Register app**
7. Copy the configuration object

### 3.2 Generate Service Account Key

1. Go to **Project Settings** > **Service accounts**
2. Click **Generate new private key**
3. Download the JSON file
4. Rename it to `firebase-admin-key.json`
5. Place it in the project root directory

## Step 4: Configure Environment Variables

### 4.1 Create .env file

Copy the `env.example` file to `.env` and fill in your Firebase configuration:

```bash
cp env.example .env
```

### 4.2 Update .env with your Firebase config

```env
# Firebase Configuration
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id_here
FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
FIREBASE_APP_ID=your_app_id_here
FIREBASE_MEASUREMENT_ID=your_measurement_id_here
FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com/

# Firebase Admin SDK
FIREBASE_ADMIN_SDK_PATH=./firebase-admin-key.json
```

### 4.3 Update Frontend Environment

Create `frontend/.env` file:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id_here
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
REACT_APP_FIREBASE_APP_ID=your_app_id_here
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id_here
REACT_APP_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com/
```

## Step 5: Set Up Firestore Security Rules

### 5.1 Go to Firestore Database > Rules

Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Queries are readable by the user who created them
    match /queries/{queryId} {
      allow read, write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         request.auth.token.admin == true);
    }
    
    // Images are readable by the user who uploaded them
    match /images/{imageId} {
      allow read, write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         request.auth.token.admin == true);
    }
    
    // Weather data is publicly readable
    match /weather/{weatherId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Feedback is readable by admins and the user who created it
    match /feedback/{feedbackId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         request.auth.token.admin == true);
      allow write: if request.auth != null;
    }
    
    // Escalations are readable by admins and the user who created them
    match /escalations/{escalationId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         request.auth.token.admin == true);
      allow write: if request.auth != null;
    }
    
    // Advisories are publicly readable
    match /advisories/{advisoryId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Notifications are readable by the user they belong to
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

### 5.2 Click "Publish"

## Step 6: Set Up Storage Security Rules

### 6.1 Go to Storage > Rules

Replace the default rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can upload/read their own files
    match /user-images/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /plant-images/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /profile-photos/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /documents/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public read access for shared content
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

### 6.2 Click "Publish"

## Step 7: Test Firebase Connection

### 7.1 Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd backend
./mvnw clean install
```

### 7.2 Test Frontend Connection

```bash
cd frontend
npm start
```

Open browser console and check for Firebase connection errors.

### 7.3 Test Backend Connection

```bash
cd backend
./mvnw spring-boot:run
```

Check logs for Firebase initialization messages.

## Step 8: Initialize Sample Data (Optional)

### 8.1 Create Sample Collections

You can use the Firebase Console to add sample data:

**Users Collection:**
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "language": "en",
  "location": "Kerala, India",
  "crops": ["Rice", "Coconut"],
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Advisories Collection:**
```json
{
  "title": "Rice Cultivation Guide",
  "content": "Best practices for rice cultivation...",
  "crops": ["Rice"],
  "locations": ["Kerala"],
  "priority": "high",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

## Step 9: Production Configuration

### 9.1 Update Security Rules for Production

- Change Firestore rules to use proper authentication
- Add rate limiting
- Implement proper admin authentication

### 9.2 Set Up Monitoring

- Enable Firebase Performance Monitoring
- Set up Firebase Crashlytics
- Configure alerts and notifications

### 9.3 Backup and Security

- Set up automated backups
- Configure data retention policies
- Implement proper access controls

## Troubleshooting

### Common Issues

1. **Firebase not initializing**
   - Check environment variables
   - Verify service account key path
   - Check network connectivity

2. **Permission denied errors**
   - Check Firestore security rules
   - Verify user authentication
   - Check Storage rules

3. **CORS errors**
   - Add your domain to Firebase authorized domains
   - Check browser console for specific errors

4. **Authentication issues**
   - Verify Firebase Auth configuration
   - Check sign-in method settings
   - Verify API keys

### Getting Help

- Check Firebase Console for error logs
- Review Firebase documentation
- Check browser console for frontend errors
- Check application logs for backend errors

## Next Steps

1. **Implement Authentication** - Add user sign-up/sign-in
2. **Add Real-time Features** - Use Firestore real-time listeners
3. **Set Up Push Notifications** - Configure FCM
4. **Add Analytics** - Track user behavior and app performance
5. **Implement Offline Support** - Use Firestore offline persistence

---

**Firebase is now ready for KrishSathi! 🚀**

For more information, visit the [Firebase Documentation](https://firebase.google.com/docs).
