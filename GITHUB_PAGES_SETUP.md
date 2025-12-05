# GitHub Pages Deployment Guide

## Prerequisites
- Repository pushed to GitHub (https://github.com/atharray/PixelConnect)
- Node.js and npm installed locally
- Build process working: `npm run build` ✅

## Step 1: Update vite.config.ts

Add the base path configuration for GitHub Pages:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/PixelConnect/', // Add this line - matches your repo name
});
```

## Step 2: Build the Project

```bash
npm run build
```

This generates a `dist/` folder with all static files ready for deployment.

## Step 3: Deploy Using GitHub Pages

### Option A: Using gh-pages Package (Recommended)

1. **Install gh-pages package**:
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Update package.json scripts**:
   ```json
   {
     "scripts": {
       "build": "tsc && vite build",
       "preview": "vite preview",
       "deploy": "npm run build && gh-pages -d dist"
     }
   }
   ```

3. **Deploy**:
   ```bash
   npm run deploy
   ```

   This automatically pushes the `dist/` folder to the `gh-pages` branch.

### Option B: Manual Git Push

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Add dist folder to git**:
   ```bash
   git add dist -f
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

3. **Configure GitHub Pages** (see Step 4)

## Step 4: Configure GitHub Repository Settings

1. Go to your repository: https://github.com/atharray/PixelConnect
2. Click **Settings** → **Pages**
3. Under "Source", select:
   - **Branch**: `gh-pages` (if using gh-pages package) or `main` (if manual)
   - **Folder**: `/ (root)` 
4. Click **Save**

GitHub will now deploy from your selected branch.

## Step 5: Access Your Site

Your app will be live at:
```
https://atharray.github.io/PixelConnect/
```

(Replace `atharray` with your GitHub username)

## Important Notes

⚠️ **Base Path**: The `base: '/PixelConnect/'` in vite.config.ts is CRITICAL. Without it, assets won't load correctly on GitHub Pages.

⚠️ **gh-pages Branch**: The gh-pages package creates and manages a separate `gh-pages` branch automatically. Don't manually edit it.

⚠️ **Dist Folder**: The `dist/` folder should NOT be committed to your main branch if using gh-pages package. Add to `.gitignore`:
```
dist/
```

## Continuous Deployment (Optional)

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

Then every push to `main` automatically deploys.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "404 on deployed site" | Check `base:` path in vite.config.ts matches repo name |
| "Assets not loading" | Verify GitHub Pages branch/folder settings |
| "Blank page" | Check browser console for CORS or path errors |
| "Changes not updating" | Clear browser cache or hard refresh (Ctrl+Shift+R) |

## Quick Reference

```bash
# Local development
npm run dev

# Test production build locally
npm run build
npm run preview

# Deploy (using gh-pages)
npm run deploy

# View deployment
# https://atharray.github.io/PixelConnect/
```
