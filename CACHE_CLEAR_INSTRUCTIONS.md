# Cache Clear Instructions - Fix 404 Errors

## Issue
The code has been updated to include trailing slashes (`/sanpham/` and `/danhmuc/`), but the browser is still showing requests without trailing slashes, causing 404 errors.

## Solution: Clear Cache and Restart

### Option 1: Hard Refresh Browser (Quickest)
1. **Chrome/Edge**: Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. **Firefox**: Press `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)
3. This will force reload all JavaScript files

### Option 2: Restart Next.js Dev Server
1. Stop the current dev server (Ctrl+C in terminal)
2. Clear Next.js cache:
   ```bash
   rm -rf .next
   # Or on Windows PowerShell:
   Remove-Item -Recurse -Force .next
   ```
3. Restart dev server:
   ```bash
   npm run dev
   ```

### Option 3: Clear Browser Cache Completely
1. Open browser DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Option 4: Verify Backend is Running
Make sure the backend server is running:
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

Then test the endpoint directly:
- Browser: `http://localhost:8000/api/sanpham/?page=1&limit=8&include_attributes=true`
- Should return JSON data, not 404

## Expected Behavior After Fix
- Network tab should show: `http://localhost:8000/api/sanpham/?page=1&limit=8&include_attributes=true` (with trailing slash)
- Network tab should show: `http://localhost:8000/api/danhmuc/` (with trailing slash)
- No more 404 errors
- Products should load successfully

