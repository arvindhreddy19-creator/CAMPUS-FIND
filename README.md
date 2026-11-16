# CampusFind — College Lost & Found Web Application

A responsive React + Vite website for reporting lost/found belongings, browsing campus reports and sending claim requests.

## Free tools used
- React + Vite: frontend
- Supabase: authentication and PostgreSQL database
- GitHub: source-code hosting
- Vercel: deployment

## 1. Supabase setup
1. Create a free project at https://supabase.com.
2. Open **SQL Editor** in the Supabase dashboard.
3. Open `supabase-schema.sql` from this project, copy all its contents and run it.
4. Go to **Project Settings → API** (or **Data API**) and copy the Project URL and anon/public key.
5. In the project root, make a copy of `.env.example` named `.env`.
6. Replace the two placeholder values in `.env` with your Supabase Project URL and anon/public key.

Never put a Supabase `service_role` key in frontend code or GitHub.

## 2. Run locally (optional)
Install Node.js, then run:
```bash
npm install
npm run dev
```
The terminal will show a local development URL.

## 3. Upload to GitHub without VS Code
1. Sign in at https://github.com and create a new **public** repository named `campusfind`.
2. On the repository page choose **Add file → Upload files**.
3. Upload the project files and folders. Do not upload `.env`.
4. Commit the files.

## 4. Deploy using Vercel
1. Sign in at https://vercel.com using GitHub.
2. Choose **Add New → Project**, then import `campusfind`.
3. Framework preset: Vite. Build command: `npm run build`. Output directory: `dist`.
4. Before deploying, add these Environment Variables:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon/public key
5. Click Deploy. Vercel will provide a public URL. Future GitHub commits trigger redeployment.

## Demo mode
Without Supabase environment variables the app displays sample reports and the interface. Sign-in, publishing and claims require Supabase configuration.

## Important project notes
- This is an academic starter implementation, not a production-verified campus identity system.
- Configure Supabase email confirmation and restrict registration to your college email domain if required by your institution.
- The current image field accepts a public image URL. A future enhancement can add Supabase Storage upload.
- Admin review, claim approval UI, and status management can be added as the next development milestone.
