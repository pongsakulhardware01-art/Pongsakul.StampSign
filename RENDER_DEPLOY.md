# วิธีการนำโปรเจกต์ไปรันบน Render (Render.com)

โปรเจกต์นี้ได้รับการตั้งค่าพร้อมสำหรับการ Deploy บน **Render** ทั้ง 2 รูปแบบ:

---

## วิธีที่ 1: Deploy แบบ Static Site (แนะนำที่สุด - ฟรี เร็ว ประหยัดทรัพยากร)

1. นำโค้ดขึ้น **GitHub** หรือ **GitLab** ของคุณ
2. ไปที่ [dashboard.render.com](https://dashboard.render.com/) แล้วกด **New +** -> เลือก **Static Site**
3. เลือกเชื่อมต่อกับ Repository ของโปรเจกต์นี้
4. ตั้งค่าดังนี้:
   - **Name**: `stampsign-studio` (หรือชื่อที่คุณต้องการ)
   - **Branch**: `main`
   - **Build Command**: `npm install --legacy-peer-deps && npm run build`
   - **Publish Directory**: `dist`
5. ไปที่แท็บ **Redirects/Rewrites** ในหน้าการตั้งค่าของ Render แล้วกด **Add Rule**:
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
   *(เพื่อให้หน้าเว็บ Single Page Application ทำงานถูกต้องเวลารีเฟรช)*
6. กด **Create Static Site** เพื่อเริ่ม Deploy ทันที!

---

## วิธีที่ 2: Deploy แบบ Web Service (Node.js Server)

โปรเจกต์ได้เตรียมไฟล์ `server.ts` และคำสั่ง `npm start` ไว้ให้แล้ว:

1. บน Render Dashboard กด **New +** -> เลือก **Web Service**
2. เลือก Repository ของคุณ
3. ตั้งค่าดังนี้:
   - **Name**: `stampsign-studio`
   - **Environment / Runtime**: `Node`
   - **Build Command**: `npm install --legacy-peer-deps && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. กด **Create Web Service**

---

## สิ่งสำคัญหลังจาก Deploy เสร็จ (สำหรับระบบ Google Login & Cloud):
เมื่อคุณได้ URL ของเว็บจาก Render (เช่น `https://stampsign-studio.onrender.com`):
1. ไปที่ [Firebase Console](https://console.firebase.google.com/)
2. เลือกโปรเจกต์ของคุณ -> เมนู **Authentication** -> แท็บ **Settings**
3. ไปที่หัวข้อ **Authorized domains** (โดเมนที่ได้รับอนุญาต)
4. กด **Add domain** แล้วใส่โดเมนจาก Render (เช่น `stampsign-studio.onrender.com`)
   *(เพื่อให้ผู้ใช้สามารถกดล็อกอิน Google Account บนเว็บ Render ได้อย่างราบรื่น)*
