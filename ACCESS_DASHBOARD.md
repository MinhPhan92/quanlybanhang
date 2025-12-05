# 🎯 How to Access Admin Dashboard

## Quick Access Steps

### 1. Login First
You need to be logged in as **Admin** or **Manager** to access the dashboard.

**Test Accounts:**
- **Admin**: `admin` / `password123`
- **Manager**: `manager` / `password123`

### 2. Access Dashboard

**Option A: Direct URL**
```
http://localhost:3000/admin/dashboard
```

**Option B: Through Login Flow**
1. Go to: http://localhost:3000/login
2. Login with Admin or Manager credentials
3. You'll be redirected to `/admin/dashboard` automatically

**Option C: Through Admin Layout**
1. Login first
2. Go to: http://localhost:3000/admin
3. Click "Dashboard" in the sidebar

## What You'll See

### Statistics Cards
- 📦 **Đơn hàng hôm nay** - Orders placed today
- 📦 **Tổng sản phẩm** - Total products in system
- 👥 **Tổng khách hàng** - Total customers
- 💰 **Doanh thu tháng này** - Current month revenue

### Recent Orders Table
- Last 5 orders with:
  - Order code
  - Customer name
  - Total amount
  - Status (color-coded badges)
  - Created date

### Monthly Sales Chart
- Visual bar chart showing sales for last 3 months
- Formatted currency values

### New Products Grid
- Last 5 products added
- Product images, names, and prices

### Quick Actions
- Links to:
  - Product Management
  - Order Management
  - Customer Management
  - Category Management

## Troubleshooting

### If you see "Redirecting to login..."
- You're not logged in
- Your session expired
- Solution: Go to `/login` and login again

### If you see "Permission denied"
- You're logged in as Employee or Customer
- Solution: Login as Admin or Manager

### If you see "Error loading dashboard data"
- Backend might not be running
- Check: http://localhost:8000/docs
- Solution: Start backend server

### If dashboard is blank/loading
- Check browser console for errors
- Verify backend is running on port 8000
- Check network tab for API calls

## Server Status

**Frontend**: http://localhost:3000 ✅
**Backend**: http://localhost:8000 (check if running)

## Next Steps

Once you see the dashboard:
1. ✅ Verify statistics match your database
2. ✅ Check recent orders are displayed
3. ✅ Verify monthly sales chart
4. ✅ Test quick action links
5. ✅ Navigate to other admin pages via sidebar

---

**Dashboard URL**: http://localhost:3000/admin/dashboard

