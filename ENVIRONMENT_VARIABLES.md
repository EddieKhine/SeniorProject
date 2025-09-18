# Environment Variables Required for Deployment

This document lists all the environment variables that need to be configured for the FoodLoft application to work properly.

## Required Environment Variables

### MongoDB Configuration
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/foodloft?retryWrites=true&w=majority
```

### JWT Secret for Authentication
```
JWT_SECRET=your_jwt_secret_key_here
```

### NextAuth Configuration
```
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://your-domain.vercel.app
```

### Base URL Configuration
```
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
NEXT_PUBLIC_FRONTEND_URL=https://your-domain.vercel.app
```

### Firebase Admin SDK (for server-side operations)
```
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_client_email
FIREBASE_ADMIN_PRIVATE_KEY=your_private_key
```

### Optional Environment Variables

### Google Maps API (if using location features)
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### LINE Bot Configuration (if using LINE integration)
```
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret
```

### AWS S3 Configuration (if using for file uploads)
```
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_S3_BUCKET=your_s3_bucket_name
```

## How to Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable with its corresponding value
5. Make sure to set the environment (Production, Preview, Development) for each variable

## Security Notes

- Never commit actual environment variables to version control
- Use strong, unique secrets for JWT_SECRET and NEXTAUTH_SECRET
- Keep Firebase Admin private keys secure
- Rotate secrets regularly in production
