# PRD: User Profile & Portfolio Feature

## Overview
Allow MakersLounge users to create personal profiles with portfolio projects, enabling attendees to showcase their work and connect more meaningfully.

## Goals
- Let users build a public profile others can view
- Enable users to showcase projects with media
- Keep backend portable for future mobile app (shared Supabase backend)

---

## User Stories

### As a user, I want to:
1. Create and edit my profile with basic info
2. Add projects to my portfolio with images/videos
3. View other users' profiles and projects
4. Access my profile from any page when logged in

### As a visitor, I want to:
1. View any user's public profile and projects
2. See portfolio previews on match cards (future enhancement)

---

## Feature Scope

### Profile Fields
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Name | text | Yes | Display name |
| Photo | image URL | No | Profile picture (upload to Supabase Storage) |
| LinkedIn | URL | No | LinkedIn profile link |
| Twitter | URL | No | Twitter/X handle or URL |
| Website | URL | No | Personal website |

### Projects (Portfolio Items)
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Title | text | Yes | Project name |
| Description | text | No | Brief description of the project |
| Media | array of URLs | No | Images/videos (upload to Supabase Storage `media` bucket) |

---

## Database Schema

### `profiles` table
```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  photo_url text,
  linkedin text,
  twitter text,
  website text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### `projects` table
```sql
create table projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text,
  media_urls text[],
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### Row Level Security (RLS)
- **Profiles**: Public read, users can only edit their own
- **Projects**: Public read, users can only CRUD their own

---

## Pages & Routes

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/profile` | Current user's profile (edit mode) | Yes |
| `/profile/[id]` | Public view of any user's profile | No |

---

## UI Components

### 1. Profile Menu Item
- Shows in nav when logged in
- Links to `/profile`

### 2. Profile Page (`/profile`)
- Edit mode for own profile
- Form fields: name, photo upload, linkedin, twitter, website
- "Add Project" button
- List of user's projects with edit/delete options

### 3. Public Profile Page (`/profile/[id]`)
- Read-only view
- Profile header with photo, name, social links
- Grid of projects with media previews

### 4. Project Card
- Thumbnail (first media item)
- Title
- Click to expand/view details

### 5. Project Modal/Editor
- Title input
- Description textarea
- Media upload (multiple files)
- Save/Cancel buttons

---

## File Upload Flow

1. User selects image/video
2. Upload to Supabase Storage `media` bucket
3. Get public URL
4. Store URL in `media_urls` array (projects) or `photo_url` (profile)

### Storage Structure
```
media/
  profiles/
    {user_id}/avatar.jpg
  projects/
    {project_id}/
      image1.jpg
      image2.png
      video.mp4
```

---

## Mobile App Considerations

- All data in Supabase (profiles, projects tables)
- All media in Supabase Storage
- Same RLS policies work for mobile
- Mobile app uses same `@supabase/supabase-js` client
- No web-specific logic in database layer

---

## Implementation Phases

### Phase 1: Profile Basics
- [ ] Run SQL to create tables (profiles, projects)
- [ ] Add "Profile" link in nav (logged-in users only)
- [ ] Create `/profile` page with edit form
- [ ] Implement profile photo upload

### Phase 2: Projects
- [ ] Create project CRUD UI
- [ ] Implement multi-file media upload
- [ ] Display projects on profile page

### Phase 3: Public Profiles
- [ ] Create `/profile/[id]` public view page
- [ ] Link profiles from match results (future)

---

## Success Metrics
- % of logged-in users who complete their profile
- Average number of projects per user
- Profile views per user

---

## Open Questions
1. Should we limit the number of projects per user?
2. Max file size / number of media items per project?
3. Should profiles be discoverable via search, or only through matches?

---

## Technical Notes
- Next.js 16 with App Router
- Supabase for auth, database, and storage
- Tailwind CSS for styling
- TypeScript throughout
