# 🧪 Testing Guide - Quản Lý Bán Hàng System

## 🚀 Quick Start

### Prerequisites
1. **MySQL Database** must be running
2. **Python 3.8+** with required packages installed
3. **Node.js 18+** with npm installed

### Starting the Servers

#### Backend (FastAPI)
```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
Backend will be available at: **http://localhost:8000**

#### Frontend (Next.js)
```bash
npm run dev
```
Frontend will be available at: **http://localhost:3000**

---

## 📋 Test Accounts

Based on the sample data (`db/insert-sample-data.sql`), use these credentials:

### Admin Account
- **Username:** `admin`
- **Password:** `password123`
- **Role:** Admin
- **Access:** Full access to all admin features

### Manager Account
- **Username:** `manager`
- **Password:** `password123`
- **Role:** Manager
- **Access:** Dashboard, Products, Orders, Customers, Feedback, Promotions, Logs

### Employee Account
- **Username:** `nhanvien1`
- **Password:** `password123`
- **Role:** Employee
- **Access:** Dashboard, Products, Orders, Customers, Feedback, Promotions

### Customer Account
- **Username:** `khachhang1`
- **Password:** `password123`
- **Role:** Customer
- **Access:** Public pages + Profile

---

## 🧪 Testing Checklist

### 1. Authentication & Authorization

#### ✅ Login Flow
1. Navigate to **http://localhost:3000/login**
2. Try logging in with different roles:
   - Admin → Should redirect to `/admin/dashboard`
   - Manager/Employee → Should redirect to `/admin/dashboard`
   - Customer → Should redirect to `/` (home page)

#### ✅ Register Flow
1. Navigate to **http://localhost:3000/register**
2. Fill in the registration form
3. Submit (Note: Backend API needs to be implemented)

#### ✅ Protected Routes
1. Try accessing `/admin/dashboard` without logging in → Should redirect to `/login`
2. Login as Customer → Try accessing `/admin/*` → Should be denied
3. Login as Employee → Try accessing `/admin/employees` → Should be denied (Admin only)

---

### 2. Admin Dashboard

#### ✅ Dashboard Page (`/admin/dashboard`)
1. Login as Admin or Manager
2. Navigate to Dashboard
3. Verify statistics cards display:
   - Total Orders
   - Total Revenue
   - Total Products
   - Total Categories
   - Pending Orders
   - Low Stock Products
4. Check quick action links work

---

### 3. Product Management

#### ✅ Products Page (`/admin/products`)
1. Navigate to **Products** from sidebar
2. **View Products:**
   - Verify product list displays
   - Check pagination (if implemented)
3. **Create Product:**
   - Click "Add Product" button
   - Fill in form with product details
   - Add JSON attributes (e.g., `{"Color": "Red", "Size": "Large"}`)
   - Submit and verify product appears in list
4. **Update Product:**
   - Click edit button on a product
   - Modify details
   - Save and verify changes
5. **Delete Product:**
   - Click delete button
   - Confirm deletion
   - Verify product removed from list

---

### 4. Order Management

#### ✅ Orders Page (`/admin/orders`)
1. Navigate to **Orders** from sidebar
2. **View Orders:**
   - Verify order list displays
   - Check order details (status, customer, total, etc.)
3. **Update Order Status:**
   - Click status buttons (Confirm, Cancel, etc.)
   - Verify status updates
   - Test insufficient stock error handling (should show clear error message)

---

### 5. Category Management

#### ✅ Categories Page (`/admin/categories`)
1. Navigate to **Categories** from sidebar
2. **View Categories:**
   - Verify category list displays
3. **Create Category:**
   - Click "Add Category"
   - Enter category name
   - Submit
4. **Update Category:**
   - Click edit button
   - Modify name
   - Save
5. **Delete Category:**
   - Click delete button
   - Confirm deletion

---

### 6. Customer Management

#### ✅ Customers Page (`/admin/customers`)
1. Navigate to **Customers** from sidebar
2. **View Customers:**
   - Verify customer list displays
   - Check customer information (name, email, phone, address)
3. **Search Functionality:**
   - Use search bar to filter by name, email, or phone
   - Verify results update

---

### 7. Feedback & Complaints

#### ✅ Feedback Page (`/admin/feedback`)
1. Navigate to **Feedback** from sidebar
2. **Switch Tabs:**
   - Click "Đánh giá sản phẩm" tab
   - Click "Khiếu nại" tab
   - Verify tab switching works
3. **View Reviews/Complaints:**
   - Verify data displays (when API is connected)

---

### 8. Promotions

#### ✅ Promotions Page (`/admin/promotions`)
1. Navigate to **Promotions** from sidebar
2. Verify page loads
3. Test create promotion (when implemented)

---

### 9. System Logs

#### ✅ Logs Page (`/admin/logs`)
1. Navigate to **System Logs** from sidebar
2. **Switch Tabs:**
   - System Logs tab
   - Activity Logs tab
3. **Filter Logs:**
   - Test date filters
   - Test user filters
   - Test level filters (INFO, WARNING, ERROR)
4. Verify log entries display correctly

---

### 10. Admin-Only Pages

#### ✅ Employees Page (`/admin/employees`)
1. Login as **Admin**
2. Navigate to **Employees** from sidebar
3. Verify page loads (Admin only)
4. Try accessing as Manager/Employee → Should be denied

#### ✅ Settings Page (`/admin/settings`)
1. Login as **Admin**
2. Navigate to **Settings** from sidebar
3. Verify page loads (Admin only)
4. Try accessing as Manager/Employee → Should be denied

---

### 11. Navigation & UI

#### ✅ Sidebar Navigation
1. **Collapse/Expand:**
   - Click toggle button
   - Verify sidebar collapses/expands
2. **Active State:**
   - Navigate between pages
   - Verify active menu item highlights
3. **Mobile Responsive:**
   - Resize browser window
   - Verify sidebar becomes overlay on mobile
   - Test mobile menu button

#### ✅ User Menu
1. Verify username and role display in sidebar footer
2. Click **Logout** button
3. Verify redirects to login page
4. Verify token cleared from localStorage

---

### 12. Public Pages

#### ✅ Home Page (`/`)
1. Navigate to home page
2. Verify products display
3. Test navigation links

#### ✅ Shop Page (`/shop`)
1. Navigate to shop
2. Verify product listing
3. Test product filters/search

#### ✅ Product Details (`/product/[id]`)
1. Click on a product
2. Verify product details display
3. Test add to cart

#### ✅ Cart (`/cart`)
1. Add products to cart
2. Navigate to cart
3. Verify items display
4. Test quantity updates
5. Test remove items

#### ✅ Checkout (`/checkout`)
1. Navigate to checkout
2. Fill in order details
3. Submit order
4. Verify order creation

#### ✅ Profile (`/profile`)
1. Login as any user
2. Navigate to profile
3. **View Profile:**
   - Verify user information displays
4. **Edit Profile:**
   - Click "Edit" button
   - Modify information
   - Save changes
   - Verify updates

---

## 🔍 API Testing

### Backend API Endpoints

#### Health Check
```bash
curl http://localhost:8000/
```

#### Status (Requires Auth)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/status
```

#### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password123"}'
```

#### Get Products
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/sanpham
```

#### Get Orders
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/donhang
```

---

## 🐛 Common Issues & Solutions

### Issue: Backend won't start
**Solution:**
- Check MySQL is running
- Verify database credentials in `backend/database.py`
- Ensure database `QuanLyBanHang` exists
- Check Python dependencies are installed

### Issue: Frontend won't start
**Solution:**
- Run `npm install` to install dependencies
- Check Node.js version (should be 18+)
- Clear `.next` folder and try again

### Issue: CORS errors
**Solution:**
- Verify backend CORS middleware allows `http://localhost:3000`
- Check backend is running on port 8000

### Issue: Authentication not working
**Solution:**
- Check token is saved in localStorage
- Verify token format in Authorization header
- Check backend JWT secret key matches

### Issue: Database connection errors
**Solution:**
- Verify MySQL service is running
- Check database credentials
- Ensure database exists: `CREATE DATABASE QuanLyBanHang;`
- Run sample data script: `db/insert-sample-data.sql`

---

## 📊 Expected Results

### After Successful Setup:
- ✅ Backend API accessible at http://localhost:8000
- ✅ Frontend accessible at http://localhost:3000
- ✅ Can login with test accounts
- ✅ Admin dashboard displays statistics
- ✅ Can navigate between admin pages
- ✅ Role-based access control works
- ✅ CRUD operations work for Products, Orders, Categories
- ✅ Logs display system and activity logs

---

## 🎯 Next Steps for Full Implementation

1. **Complete API Integration:**
   - Connect Categories CRUD API
   - Connect Customers API
   - Connect Feedback/Complaints API
   - Connect Promotions API
   - Connect Employees API
   - Connect Settings API

2. **Enhance Features:**
   - Add pagination to all tables
   - Add sorting and filtering
   - Add export functionality
   - Add advanced search

3. **Improve UI/UX:**
   - Add loading skeletons
   - Add toast notifications
   - Add confirmation dialogs
   - Improve error messages

4. **Testing:**
   - Add unit tests
   - Add integration tests
   - Add E2E tests

---

## 📝 Notes

- Sample data includes 8 rows per table (see `db/insert-sample-data.sql`)
- All passwords are: `password123`
- Backend auto-creates tables on startup
- Frontend uses JWT tokens stored in localStorage
- Role-based access is enforced on both frontend and backend

---

**Happy Testing! 🚀**

