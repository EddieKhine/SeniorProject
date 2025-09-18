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
FIREBASE_ADMIN_PROJECT_ID=foodloft-450813
FIREBASE_ADMIN_PRIVATE_KEY_ID=307f5a5c261074b545908689aac4bb8787bc0866
FIREBASE_ADMIN_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCk8hAqk6LfKJWU\nOcwZkb9zRdhEaJC705TUh4KEO8+x4IpGCPLALTFY1fhgQ6F+Gw57VdX0dvCIUbEw\nqStKu9GEaOEBxUSPBFdkAteZ1JUwjjc+/IAK59KGo7eADsIqMTPSasw4HPC2QKIy\nSQ/fTpdicmhpJNYDr/DpjQ46jsYsx6RbRjJdIC2qbNKrnKGzDsdZT1L9IFtVVrkv\n2uM1nvul2PIeJHcNc7ZP0WjBPPB2El1RNh4AsQV/0MUiWw86t0TY+9wd5j3fC8t2\nplsnj95sflghtyQIc/jChAIOQBU3eqnvOO3/F4GJvvnGhBeMDu9GN8P07QwB/knP\nTk/m2gPpAgMBAAECggEAJSt5Uibn5pL+NiNaJ47tDjx4kl3f87unx8brtgHGeYao\nkkS083KbsrGxIXxMGZ9eQZPjvY3KAWYrYFRW8aXmfoil3+DE5NetG9f6HuvFXOZH\nc9WxwwNfsUCWevCYd6qTy4COmbyH0AI7qspFHeTXf3NZrQwEgFs3FmJXiQGgjflo\namUVM9tdtILgkUbjFS6C8qOgba1ECU8kiwRK3vDWp4XzCqZsRsSv9a6l+QpEW5ES\nTGkXKBOrrer6eRhtiCMQH2OPbB2XbyRNmF0mLf4fpwa9MR7nBjx6KynYbWvGoDXU\nNP2M8oneiaYtfXtcFO6E3Ub3AkV8UlUmLeYYgm804wKBgQDcqElBdXtts5OfOKjS\npcQHLPDk3vHh4j+HZBj+u97nVs74d9KjJ0Mhs0jKnEnjlOIZBmuPmeoOynAtFIHl\nQoB699Z4xgyEwdmWCOoggKLCFaKXn5whHJuA/W5g+Ugb0oeWGtPJXn/MTi4sTz64\nLc3759z4/Yv46hYVyGnJicKmswKBgQC/XWaH03ciRMFqxu/0UbnKkANfWkIryE1o\n5ge73/dmVichU2/TaRbsBXkVaLIpWptrn62+5BbM8LNrKno47YjV4l1skhEu2AUZ\n3UkEQ3mGF7QCcy3cHcSc+ariOlQ3n9NtOagvI5KryQR/S2sHq2FlJ1sx+rUb792V\n+RKTITcY8wKBgFuvNRkU1p9jcWBEK6mzJPuSSdnfZQPlfV4lUllt+JWJNWB6cTRH\nmRZEp2dAf1cnwraBO2okmuNgbDHfBoYbFsWBe0UdjZAP9/fmZlnw+S/Jy5BSyo3b\nlCWJqDZ0/ehJlvrg1MUkFdfvWDIjDz16Es+rrN5sg59+rISKjKIoMpAPAoGAaIdG\nOC8kRg20cPTVoWj6yVC85trQhkXVMtVjqBYAd1/b4/JFhP9ETAv5Rd54YuphNvpz\n12+TnMJl3sXHGU12jw4k5ecrh6DruGMNPUz2Fm7gHu53QGLqQKyH0Sb3VaLxxBnY\naldOCJO25yl0/y139971i2lcgDQXn5H7uW5NQE0CgYBlkZbR6X1psJILKipqplls\ney3KoRGr6KkXTGA2LDg2Pu8TgbJe48+DaAll4DWIxBxw4whGXsZVKCcq2WSVFmlg\nnA37g2cfD5stF5SKcUczT0GKO53pXzOle1iuXlUBzv3kULntJ1iKMpeRy+zlAdh8\nHhTy8dK80OwM/DsRXx0FdA==\n-----END PRIVATE KEY-----\n
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-fbsvc@foodloft-450813.iam.gserviceaccount.com
FIREBASE_ADMIN_CLIENT_ID=113573426872298054615
FIREBASE_ADMIN_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40foodloft-450813.iam.gserviceaccount.com
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
