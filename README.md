# Xeno-fde Shopify Store Integration

This project demonstrates a **Shopify store setup** with a custom **frontend** and **backend**.  
- **Frontend:** React/Next.js  
- **Backend:** Node.js/Express + Prisma + PostgreSQL  
- **Features:** Shopify APIs, webhooks, tenant-based DB schema, and custom authentication with JWT.  

---

## 🛠️ Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/Xeno-fde.git
cd Xeno-fde
```
## 2. Environment Setup

Create a `.env` file at the project root with the following values:

```env
DATABASE_URL="postgresql://<username>:<password>@<host>/<db_name>?schema=public"
JWT_SECRET="jwt_secret_for_signing_tokens_09876"
CRON_TENANT_IDS="cmfirg94j0000sq1kv9tez5fo"
SHOPIFY_API_KEY=<your_shopify_api_key>
SHOPIFY_API_SECRET=<your_shopify_secret>
SHOPIFY_SCOPES=read_products,write_products,read_orders,write_orders
SHOPIFY_REDIRECT_URL=https://<your-backend-domain>/api/auth/callback
```
## 3. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install
npx prisma migrate dev --name init
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```
## 4. Run the Project

Start backend:
```bash
cd backend
npm run dev
```
Start frontend:
```bash
cd frontend
npm run dev
```
##5. Expose Backend Locally (for Shopify)
```bash
ngrok http 5000
```
Use the ngrok URL in your Shopify Partner App → App URL and Redirect URL.

## 🏗️ Architecture Diagram
<img width="1445" height="883" alt="diagram-export-15-09-2025-22_21_52" src="https://github.com/user-attachments/assets/b038ff24-b1ca-4b74-972e-40a57f82f7ab" />


## 🗂️ Database Schema (Prisma)

```prisma
model Tenant {
  id        String   @id @default(cuid())
  name      String
  shop      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  products  Product[]
}

model Product {
  id        String   @id @default(cuid())
  title     String
  price     Float
  tenantId  String
  Tenant    Tenant   @relation(fields: [tenantId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Order {
  id        String   @id @default(cuid())
  shopifyId String   @unique
  total     Float
  tenantId  String
  Tenant    Tenant   @relation(fields: [tenantId], references: [id])
  createdAt DateTime @default(now())
}
```
### Authentication
- **POST** `/api/auth/install` → Install the Shopify app  
- **GET** `/api/auth/callback` → Shopify OAuth callback  

### Products
- **GET** `/api/products` → Fetch products from DB/Shopify  
- **POST** `/api/products` → Create product  
- **PUT** `/api/products/:id` → Update product  
- **DELETE** `/api/products/:id` → Delete product  

### Webhooks
- **POST** `/api/webhooks/orders/create` → Order creation webhook  
- **POST** `/api/webhooks/products/update` → Product update webhook

## ⚠️ Known Limitations / Assumptions

- **Single-tenant focused**: CRON jobs are tied to `CRON_TENANT_IDS` from `.env`.  
- **Webhook retries**: Duplicate events possible without idempotency checks.  
- **Local testing**: Requires `ngrok` or deployed backend for Shopify callbacks.  
- **Error handling**: Minimal, no centralized middleware implemented.  
- **Authentication**: JWT only — no refresh tokens or role-based access.  

## 🩷 ScreenShots Of UI
Dashboard
![WhatsApp Image 2025-09-15 at 22 29 30_6a406d87](https://github.com/user-attachments/assets/9b397f21-ac1a-491d-a87d-9c0e530748ea)

Insights of orders, customers and revenue 
![WhatsApp Image 2025-09-15 at 22 30 45_cef35306](https://github.com/user-attachments/assets/9fb8754e-19ae-4371-91ce-ef87e7db8dd7)

Multi Stores
![WhatsApp Image 2025-09-15 at 22 30 20_e96dfe47](https://github.com/user-attachments/assets/d6161256-d136-4d22-a0f7-2346937df534)

Sales Charts 
![WhatsApp Image 2025-09-15 at 22 31 13_5ccc7d41](https://github.com/user-attachments/assets/041d24e3-2055-4a1b-9edb-f49d21d9faa4)

Top 5 Customers
![WhatsApp Image 2025-09-15 at 22 31 44_cc6328c6](https://github.com/user-attachments/assets/d9695e5b-e6d5-4d77-ac45-a931f740050d)




