# 🚀 Guide: Deploying to Render.com (របៀបដំឡើងលើ Render.com)

កម្មវិធីនេះត្រូវបានរៀបចំសម្រាប់ Deploy ទៅកាន់ **Render.com** ដោយសេរី (Free Plan) និងមាន **Persistent Disk** សម្រាប់រក្សាទុក SQLite Database (`local.db`) យ៉ាងមានសុវត្ថិភាព។

---

## 📋 ជំហានដំឡើងលើ Render.com (Step-by-Step Deployment)

### ជំហានទី ១: Push Code ទៅកាន់ GitHub / GitLab
1. បង្កើត **Repository** ថ្មីមួយនៅលើ [GitHub.com](https://github.com)
2. Push កូដទាំងអស់ពីកុំព្យូទ័ររបស់អ្នកទៅកាន់ GitHub Repository នោះ៖
   ```bash
   git init
   git add .
   git commit -m "Deploy to Render"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

---

### ជំហានទី ២: បង្កើត Web Service លើ Render.com

1. ចូលទៅកាន់គេហទំព័រ [dashboard.render.com](https://dashboard.render.com) ហើយ Login
2. ចុចប៊ូតុង **"New +"** (ពណ៌ខៀវខាងលើ) ➔ ជ្រើសរើស **"Web Service"** (ឬ **"Blueprints"**)
3. Connect ជាមួយគណនី GitHub របស់អ្នក ហើយជ្រើសរើស Repository ដែលបាន Push មុននេះ
4. កំណត់ព័ត៌មានដូចខាងក្រោម៖
   - **Name**: `facebook-video-scheduler` (ឬឈ្មោះតាមចិត្ត)
   - **Environment**: `Node`
   - **Region**: ជ្រើសរើស `Singapore` (ជិតកម្ពុជាបំផុត)
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

---

### ជំហានទី ៣: បន្ថែម Persistent Disk (ដើម្បីរក្សាទុក Database)

ដើម្បីការពារមិនឲ្យបាត់បង់ទិន្នន័យ `local.db` ពេល Render Restart ម៉ាស៊ីន៖

1. នៅក្នុងទំព័រដំឡើង Web Service នោះ ក្រឡេកមើលផ្នែក **"Disks"** (ឬចូលទៅ Settings ➔ Disks បន្ទាប់ពីបង្កើតរួច)
2. ចុច **"Add Disk"**:
   - **Name**: `sqlite-data`
   - **Mount Path**: `/var/data`
   - **Size**: `1 GB` (សេរី)
3. នៅក្នុងផ្នែក **"Environment Variables"** បន្ថែម Key ដូចខាងក្រោម៖
   - **Key**: `APP_DATA_DIR` ➔ **Value**: `/var/data`
   - **Key**: `NODE_ENV` ➔ **Value**: `production`

---

### ជំហានទី ៤: Deploy & បើកប្រើប្រាស់!

1. ចុចប៊ូតុង **"Create Web Service"**
2. Render នឹងរៀបចំ Build កូដ និងបង្កើត Server ជូនអ្នក (ប្រើពេលប្រហែល 2-3 នាទី)
3. ពេល Build ចប់ Render នឹងផ្តល់ Web Link ឲ្យអ្នកភ្លាមៗ ឧទាហរណ៍៖
   `https://facebook-video-scheduler.onrender.com`

🎉 **រួចរាល់! ឥឡូវនេះកម្មវិធីរបស់អ្នកដំណើរការលើ Cloud 24/7 យ៉ាងរលូន!**
