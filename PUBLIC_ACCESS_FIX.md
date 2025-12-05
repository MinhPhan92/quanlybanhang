# 🔓 Public Access Fix - 401 Unauthorized Error Resolution

## Problem Identified

The 401 Unauthorized errors were caused by **required authentication** on public routes:

- Product listing API (`GET /api/sanpham`) required JWT token
- Product detail API (`GET /api/sanpham/{id}`) required JWT token
- Category listing API (`GET /api/danhmuc`) required JWT token
- Shop page should be accessible to **all visitors** (including non-logged-in users)

## Solution Applied

### 1. Created Optional Authentication Dependency

**File**: `backend/routes/deps.py`

Added `get_current_user_optional()` function that:
- ✅ Returns user dict if valid token is provided
- ✅ Returns `None` if no token or invalid token
- ✅ **Does NOT raise 401 error** - allows public access
- ✅ Still identifies logged-in users for personalization

```python
async def get_current_user_optional(request: Request) -> Optional[Dict]:
    """
    Optional authentication dependency.
    Returns user dict if token is valid, None if no token or invalid token.
    Allows public access to routes while still identifying logged-in users.
    """
```

### 2. Updated Product Routes to Use Optional Auth

**File**: `backend/routes/sanpham.py`

#### Product List Route
- **Before**: `current_user: dict = Depends(get_current_user)` ❌ (Required auth)
- **After**: `current_user: Optional[dict] = Depends(get_current_user_optional)` ✅ (Optional auth)

#### Product Detail Route
- **Before**: `current_user: dict = Depends(get_current_user)` ❌ (Required auth)
- **After**: `current_user: Optional[dict] = Depends(get_current_user_optional)` ✅ (Optional auth)

### 3. Updated Category Route to Use Optional Auth

**File**: `backend/routes/danhmuc.py`

- **Before**: `current_user: dict = Depends(get_current_user)` ❌ (Required auth)
- **After**: `current_user: Optional[dict] = Depends(get_current_user_optional)` ✅ (Optional auth)

## Current API Behavior

### Public Routes (No Auth Required)

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/sanpham` | GET | Optional | List all products (public) |
| `/api/sanpham/{id}` | GET | Optional | Product details (public) |
| `/api/danhmuc` | GET | Optional | List all categories (public) |

### Protected Routes (Auth Required)

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/sanpham` | POST | Required | Create product (Admin/Manager) |
| `/api/sanpham/{id}` | PUT | Required | Update product (Admin/Manager) |
| `/api/sanpham/{id}` | DELETE | Required | Delete product (Admin) |
| `/api/donhang` | GET | Required | List orders (Admin/Manager/Employee) |
| `/api/donhang/{id}/status` | PUT | Required | Update order status (Admin/Manager/Employee) |

## Frontend Token Configuration

### Token Storage
- **Key**: `"token"` (stored in `localStorage`)
- **Location**: `app/lib/utils/axios.ts`
- **Format**: `Bearer {token}` in Authorization header

### Current Implementation ✅
```typescript
// app/lib/utils/axios.ts
const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

if (token) {
  headers.Authorization = `Bearer ${token}`;
}
```

This is **correct** - token is sent if available, but API calls work without it for public routes.

## Benefits

1. ✅ **Public Access**: Shop page works for all visitors
2. ✅ **User Identification**: Logged-in users can still be identified
3. ✅ **Personalization**: Can show different prices/inventory for logged-in users
4. ✅ **Security**: Protected routes (POST, PUT, DELETE) still require authentication
5. ✅ **Flexibility**: Can enhance features based on user login status

## Testing

### 1. Test Public Access (No Login)
```bash
# Should work without token
curl http://localhost:8000/api/sanpham
curl http://localhost:8000/api/danhmuc
```

### 2. Test with Token (Logged In)
```bash
# Get token from login
TOKEN="your_jwt_token_here"

# Should work with token (may show personalized data)
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/sanpham
```

### 3. Test Protected Routes
```bash
# Should return 401 without token
curl -X POST http://localhost:8000/api/sanpham \
  -H "Content-Type: application/json" \
  -d '{"TenSP": "Test"}'

# Should work with valid admin token
curl -X POST http://localhost:8000/api/sanpham \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"TenSP": "Test", "GiaSP": 1000000, "SoLuongTonKho": 10}'
```

## Summary

✅ **Optional authentication implemented**
✅ **Public routes accessible without login**
✅ **Protected routes still require authentication**
✅ **Frontend token handling is correct**
✅ **401 errors on public pages resolved**

The shop page and product pages should now work for all visitors! 🎉

