# Quick Start Guide - Stage 3

## 🚀 Getting Started in 5 Minutes

### 1. Start the Server
```bash
cd server
npm run dev
```

### 2. Create Test Users (if not already done)

**Create a Broker**:
```bash
curl -X POST http://localhost:5000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Broker",
    "email": "broker@example.com",
    "phone": "9876543210",
    "password": "Broker@123",
    "role": "BROKER"
  }'
```

**Create an Admin** (manually in database or future endpoint):
```javascript
// In MongoDB shell or Compass
db.users.insertOne({
  name: "Admin User",
  email: "admin@example.com",
  phone: "9876543211",
  passwordHash: "$2a$11$YOUR_HASHED_PASSWORD",
  role: "ADMIN",
  isActive: true,
  brokerApproved: false,
  kyc: {
    status: "NOT_SUBMITTED"
  },
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### 3. Login and Get Token
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "broker@example.com",
    "password": "Broker@123"
  }'
```

**Save the accessToken from response!**

---

## 📝 Essential API Calls

### Create Your First Property
```bash
curl -X POST http://localhost:5000/api/v1/properties \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Luxury Apartment in Bandra",
    "description": "Beautiful 3BHK apartment with modern amenities, gym, pool, and 24/7 security in prime Bandra location",
    "type": "APARTMENT",
    "address": "123 Hill Road, Bandra West",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400050",
    "areaSqft": 1200,
    "valuation": 1000000000,
    "totalUnits": 100,
    "minUnits": 1,
    "expectedAppreciationPct": 15.5,
    "rentalYieldPct": 4.2,
    "holdingPeriodMonths": 36,
    "images": [
      {"url": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00", "name": "Living Room"},
      {"url": "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2", "name": "Kitchen"},
      {"url": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267", "name": "Bedroom"}
    ]
  }'
```

### List All Properties
```bash
curl http://localhost:5000/api/v1/properties
```

### Get Property Details
```bash
curl http://localhost:5000/api/v1/properties/PROPERTY_ID
```

### Update Property
```bash
curl -X PUT http://localhost:5000/api/v1/properties/PROPERTY_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description with even more details!"
  }'
```

### Submit for Approval
```bash
curl -X POST http://localhost:5000/api/v1/properties/PROPERTY_ID/submit \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔍 Testing Filters

### Filter by City
```bash
curl "http://localhost:5000/api/v1/properties?city=Mumbai"
```

### Filter by Type
```bash
curl "http://localhost:5000/api/v1/properties?type=APARTMENT"
```

### Filter by Price Range
```bash
curl "http://localhost:5000/api/v1/properties?minPrice=5000000&maxPrice=20000000"
```

### Search
```bash
curl "http://localhost:5000/api/v1/properties?search=luxury"
```

### Combine Filters
```bash
curl "http://localhost:5000/api/v1/properties?city=Mumbai&type=APARTMENT&minPrice=5000000&page=1&limit=10&sort=-valuation"
```

---

## 🎯 Quick Test Scenarios

### Scenario 1: Complete Broker Flow
1. Login as broker → Get token
2. Create property → Get property ID
3. List properties → See your property
4. Update property description
5. Submit for approval
6. Verify status changed to PENDING_APPROVAL

### Scenario 2: Public Marketplace
1. List all properties (no auth needed)
2. Filter by city
3. Get property details
4. See calculated fields (fundingPct, investorCount)

### Scenario 3: Test Authorization
1. Try to create property without token → Get 401
2. Login as investor
3. Try to create property → Get 403
4. Create property as broker A
5. Try to update as broker B → Get 403

---

## 💡 Common Issues

**"Authentication required"**
- Add `Authorization: Bearer YOUR_TOKEN` header
- Make sure token hasn't expired (default: 1 day)

**"Validation failed: valuation must divide evenly"**
- Ensure valuation % totalUnits === 0
- Example: valuation=1000000000, totalUnits=100 ✅
- Example: valuation=1000000000, totalUnits=99 ❌

**"At least 3 property images are required"**
- Add 3 or more images to the images array before submitting

**"Cannot modify valuation once property is LIVE"**
- This is expected! Once approved, pricing is locked
- Only test with DRAFT properties for pricing changes

---

## 📊 Sample Test Data

### Property Templates

**Apartment in Mumbai**
```json
{
  "title": "Sea View Apartment Worli",
  "description": "Stunning sea-facing 3BHK apartment with premium finishes and world-class amenities",
  "type": "APARTMENT",
  "address": "456 Worli Sea Face",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400018",
  "areaSqft": 1500,
  "valuation": 2000000000,
  "totalUnits": 200,
  "minUnits": 2
}
```

**Villa in Goa**
```json
{
  "title": "Luxury Beach Villa Anjuna",
  "description": "Private beach access, infinity pool, 4BHK villa perfect for vacation rentals",
  "type": "VILLA",
  "address": "Beach Road, Anjuna",
  "city": "Goa",
  "state": "Goa",
  "pincode": "403509",
  "areaSqft": 3000,
  "valuation": 5000000000,
  "totalUnits": 250,
  "minUnits": 5
}
```

**Commercial Space**
```json
{
  "title": "Prime Commercial Space MG Road",
  "description": "High-visibility retail space in premium location with excellent footfall",
  "type": "COMMERCIAL",
  "address": "MG Road, Sector 28",
  "city": "Gurgaon",
  "state": "Haryana",
  "pincode": "122002",
  "areaSqft": 2000,
  "valuation": 3000000000,
  "totalUnits": 150,
  "minUnits": 10
}
```

---

## 🎮 Postman Collection (Optional)

Import this JSON into Postman for easy testing:

1. Create new collection "Real Estate Portal"
2. Add environment variables:
   - `base_url`: http://localhost:5000
   - `token`: (paste your JWT)
   - `property_id`: (paste after creating property)

3. Create requests:
   - Auth → Login
   - Properties → Create
   - Properties → List
   - Properties → Get Details
   - Properties → Update
   - Properties → Submit

---

## ✅ Verification Checklist

After running the quick start:
- [ ] Server starts without errors
- [ ] Can create broker account
- [ ] Can login and get JWT token
- [ ] Can create property draft
- [ ] unitPrice is calculated automatically
- [ ] Can list properties
- [ ] Can view property details
- [ ] Can update property
- [ ] Can submit for approval
- [ ] Authorization is working (401/403 where expected)

---

## 📚 Full Documentation

For complete API reference, see:
- `STAGE_3_DOCUMENTATION.md` - Complete API docs
- `STAGE_3_TEST_CHECKLIST.md` - Comprehensive test scenarios
- `STAGE_3_SUMMARY.md` - Implementation overview

---

## 🆘 Need Help?

Check the error response JSON:
```json
{
  "message": "Human-readable error",
  "errors": { /* field-specific errors */ }
}
```

Common HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Validation error (check errors object)
- 401: Not authenticated (add/refresh token)
- 403: Not authorized (wrong role or not owner)
- 404: Property not found
- 500: Server error (check console logs)

---

## 🎉 You're All Set!

Stage 3 is fully functional. Start testing and preparing for Stage 4 (Admin Approvals & Investments)!
