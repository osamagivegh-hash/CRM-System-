# إعداد ملفات البيئة (Environment Files Setup)

## 🔧 خطوات إعداد MongoDB Atlas

### 1. إنشاء حساب MongoDB Atlas

1. اذهب إلى https://www.mongodb.com/atlas
2. قم بإنشاء حساب مجاني
3. اختر "Build a Database"
4. اختر الخطة المجانية (M0 Sandbox)

### 2. إنشاء Cluster

1. اختر موقع الخادم الأقرب لك
2. انتظر حتى يتم إنشاء الـ cluster (5-10 دقائق)

### 3. إنشاء مستخدم قاعدة البيانات

1. اذهب إلى "Database Access" في القائمة الجانبية
2. اضغط "Add New Database User"
3. اختر "Password" authentication
4. أدخل username و password (احفظهما!)
5. اختر "Built-in Role": "Atlas admin"
6. اضغط "Add User"

### 4. السماح بالوصول للشبكة

1. اذهب إلى "Network Access"
2. اضغط "Add IP Address"
3. اختر "Allow Access from Anywhere" (0.0.0.0/0) للتطوير
4. اضغط "Confirm"

### 5. الحصول على Connection String

1. اذهب إلى "Database" في القائمة الرئيسية
2. اضغط "Connect" بجانب cluster الخاص بك
3. اختر "Connect your application"
4. اختر "Node.js" و version "4.1 or later"
5. انسخ الـ connection string

## 📁 إنشاء ملفات البيئة

### ملف Backend (.env)

قم بإنشاء ملف `.env` في مجلد `backend` مع المحتوى التالي:

```env
# Environment Configuration
NODE_ENV=development
PORT=5000

# MongoDB Atlas Configuration
# استبدل المتغيرات بالقيم الفعلية من MongoDB Atlas
MONGODB_URI=mongodb+srv://your_username:your_password@cluster0.mongodb.net/crm_system?retryWrites=true&w=majority

# JWT Configuration
# مفتاح سري قوي (32 حرف على الأقل)
JWT_SECRET=crm_system_2024_super_secret_jwt_key_make_it_very_long_and_secure_random_string
JWT_EXPIRE=7d

# Password Hashing
BCRYPT_ROUNDS=12

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### ملف Frontend (.env)

قم بإنشاء ملف `.env` في مجلد `frontend` مع المحتوى التالي:

```env
# Frontend Environment Configuration
REACT_APP_API_URL=http://localhost:5000/api
```

## 🔑 مثال عملي لـ Connection String

إذا كان لديك:
- Username: `crmadmin`
- Password: `mySecurePassword123`
- Cluster Name: `cluster0`
- Database Name: `crm_system`

فإن الـ connection string سيكون:

```
mongodb+srv://crmadmin:mySecurePassword123@cluster0.mongodb.net/crm_system?retryWrites=true&w=majority
```

## ⚠️ ملاحظات مهمة

1. **لا تشارك ملفات .env**: هذه الملفات تحتوي على معلومات حساسة
2. **استخدم كلمات مرور قوية**: للأمان
3. **JWT Secret**: يجب أن يكون طويل وعشوائي
4. **للإنتاج**: غير عنوان Frontend URL إلى العنوان الفعلي

## 🚀 خطوات التشغيل بعد الإعداد

1. **تأكد من إنشاء الملفات**:
   - `backend/.env`
   - `frontend/.env`

2. **تثبيت المتطلبات**:
   ```bash
   npm run install-all
   ```

3. **إنشاء البيانات التجريبية**:
   ```bash
   cd backend
   npm run seed
   ```

4. **تشغيل التطبيق**:
   ```bash
   npm run dev
   ```

## 🔍 استكشاف الأخطاء

### خطأ الاتصال بقاعدة البيانات
- تأكد من صحة username و password
- تأكد من السماح بالوصول من جميع عناوين IP
- تأكد من تشغيل الـ cluster

### خطأ JWT
- تأكد من وجود JWT_SECRET في ملف .env
- تأكد من أن المفتاح طويل بما فيه الكفاية

### خطأ CORS
- تأكد من تطابق FRONTEND_URL مع عنوان Frontend
- في التطوير: `http://localhost:3000`

## 📝 ملف .env للإنتاج

للإنتاج، استخدم هذه القيم:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_very_secure_production_jwt_secret
FRONTEND_URL=https://your-frontend-domain.com
```

## 🎯 الحسابات التجريبية

بعد تشغيل `npm run seed`، يمكنك الدخول بهذه الحسابات:

**Super Admin:**
- البريد: `admin@crm.com`
- كلمة المرور: `SuperAdmin123!`

**TechStart Solutions:**
- المدير: `john.admin@techstartsolutions.com` / `Admin123!`

**Global Marketing:**
- المدير: `john.admin@globalmarketinginc.com` / `Admin123!`













