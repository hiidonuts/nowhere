# Supabase Setup Guide for GeoGuessr Project

This guide will walk you through setting up Supabase for authentication and database management in your GeoGuessr project.

## 1. Create a Supabase Project

1. Go to [https://app.supabase.com/](https://app.supabase.com/)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Fill in project details:
   - **Name**: `geoguessr-game` (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users
6. Click "Create new project"
7. Wait for the project to be created (this takes a few minutes)

## 2. Get Your Project Credentials

Once your project is ready:

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public** key (the public API key)

## 3. Configure Environment Variables

1. Create a `.env` file in your project root (copy from `.env.example`)
2. Add your Supabase credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 4. Create the Database Schema

### Option A: Using Supabase SQL Editor (Recommended)

1. Go to **SQL Editor** in your Supabase dashboard
2. Click "New Query"
3. Copy and paste the following SQL:

```sql
-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  achievements TEXT[] DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_level ON users(level);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own data (for registration)
-- This policy allows inserting when the user ID matches the authenticated user
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Alternative: If the above doesn't work, you can temporarily disable RLS for INSERT
-- and re-enable it after testing, or use this more permissive policy:
-- CREATE POLICY "Allow user registration" ON users
--   FOR INSERT WITH CHECK (true);

-- Option 4: Create a database function for user registration (Most Robust)
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_username TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO users (id, email, username, level, xp, achievements)
  VALUES (user_id, user_email, user_username, 1, 0, '{}');
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_user_profile TO authenticated;
```

4. Click "Run" to execute the SQL

### Option B: Using Supabase Table Editor

1. Go to **Table Editor** in your Supabase dashboard
2. Click "Create a new table"
3. Set table name: `users`
4. Add the following columns:

| Column Name    | Type      | Default Value        | Primary | Nullable | Unique |
|----------------|-----------|---------------------|---------|----------|--------|
| id             | uuid      | gen_random_uuid()   | ✓       | ✗        | ✓      |
| username       | varchar   | -                   | ✗       | ✗        | ✓      |
| email          | varchar   | -                   | ✗       | ✗        | ✓      |
| password_hash  | varchar   | -                   | ✗       | ✓        | ✗      |
| created_at     | timestamptz| now()              | ✗       | ✗        | ✗      |
| level          | int4      | 1                   | ✗       | ✗        | ✗      |
| xp             | int4      | 0                   | ✗       | ✗        | ✗      |
| achievements   | text[]    | '{}'                | ✗       | ✓        | ✗      |

5. Enable Row Level Security (RLS) in the table settings

## 5. Configure Authentication

1. Go to **Authentication** → **Settings** in your Supabase dashboard
2. Configure the following settings:

### Site URL
- Set to your development URL: `http://localhost:5173`
- For production, add your production domain

### Auth Providers
- **Email**: Enable email authentication
- **Additional Providers**: You can enable Google, GitHub, etc. later if needed

### Email Templates (Optional)
- Customize the email templates for signup confirmation, password reset, etc.

## 6. Test the Setup

1. Start your development server: `npm run dev`
2. The app should now be able to connect to Supabase
3. Check the browser console for any connection errors

## 7. Next Steps

After completing this setup:

1. The authentication service will be created to handle signup/login
2. The LoginModal component will be updated to use real Supabase authentication
3. User state management will be integrated with Supabase sessions

## Troubleshooting

### Common Issues:

1. **"Invalid API key"**: Double-check your environment variables
2. **CORS errors**: Make sure your Site URL is configured correctly
3. **RLS errors**: Ensure Row Level Security policies are set up correctly
4. **Connection timeout**: Check your internet connection and Supabase status

### Useful Supabase Dashboard Sections:

- **Table Editor**: View and edit your data
- **SQL Editor**: Run custom SQL queries
- **Authentication**: Manage users and auth settings
- **API Docs**: Auto-generated API documentation
- **Logs**: View real-time logs for debugging

## Security Notes

- Never commit your `.env` file to version control
- The anon key is safe to use in client-side code
- Row Level Security (RLS) is enabled to protect user data
- Password hashing is handled automatically by Supabase Auth
