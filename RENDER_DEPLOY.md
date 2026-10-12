# วิธีการนำโปรเจกต์ไปรันบน Render (Render.com)

โปรเจกต์นี้ได้รับการตั้งค่าพร้อมสำหรับการ Deploy บน **Render** ทั้ง 2 รูปแบบ และรองรับระบบคลาวด์องค์กรโดยไม่ต้องล็อกอิน (Zero-Login Cloud Sync)

---

## ⚡ วิธีแก้ปัญหา Build Failed บน Render (npm error ERESOLVE):

หากเจอกล่องข้อความสีแดง `npm error code ERESOLVE / Conflicting peer dependency`:
1. ไปที่เมนู **Settings** ของโปรเจกต์คุณบน Render Dashboard
2. เลื่อนลงมาที่หัวข้อ **Build & Deploy** -> **Build Command**
3. แก้ไขคำสั่ง **Build Command** ให้เป็น:
   ```bash
   npm install --legacy-peer-deps && npm run build
   ```
4. กด **Save Changes** แล้วกด **Manual Deploy** -> **Deploy latest commit**

*(หรือหากคุณ `git pull` โค้ดล่าสุดไป จะมีไฟล์ `.npmrc` และ `"overrides"` ใน `package.json` ป้องกันปัญหานี้ให้อัตโนมัติแล้วครับ)*

---

## วิธีที่ 1: Deploy แบบ Static Site (แนะนำที่สุด - ฟรี เร็ว ประหยัดทรัพยากร)

1. นำโค้ดขึ้น **GitHub** ของคุณ (`pongsakulhardware01-art/Pongsakul.StampSign`)
2. ไปที่ [dashboard.render.com](https://dashboard.render.com/) แล้วกด **New +** -> เลือก **Static Site**
3. เลือกเชื่อมต่อกับ Repository ของคุณ
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

## ☁️ ระบบคลาวด์องค์กร (Organization Shared Cloud):
- ระบบเชื่อมต่อกับ Firestore อัตโนมัติแบบ **ไม่ต้องมีหน้าต่างเข้าสู่ระบบ (No Login Required)**
- เจ้าหน้าที่ทุกคนในองค์กรเมื่อเปิดหน้าเว็บขึ้นมาจะมองเห็นคลังตราปั๊มและลายเซ็นชุดเดียวกัน ซิงค์ทันทีแบบ Real-time และจำตำแหน่ง/ขนาดเดิมที่เคยใช้ให้อัตโนมัติ
- พร้อมปุ่ม **เคลียร์หน้างาน** สำหรับล้างภาพเอกสารเดิมเพื่อเริ่มทำงานกับไฟล์ใหม่ได้ทันที
