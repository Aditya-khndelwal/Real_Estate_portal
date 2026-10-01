# Quick Start Guide - Stage 4 (Admin Panel)

## 🚀 Getting Started in 5 Minutes

### 1. Create Admin User

Since ADMIN cannot self-register, create directly in MongoDB:

**Option A: Using MongoDB Shell**
```javascript
use your_database_name

db.users.insertOne({
  name: "Admin User",
  email: "admin@test.com",
  phone: "9999999999",
  // Password: Admin@123 (hash it first with bcrypt)
  passwordHash: "$2a$11$YOUR_BCRYPT_HASH_HERE",
  role: "ADMIN",
  isActive: true,
  brokerApproved: false,
  kyc: {
    status: "NOT_SUBMITTED",
    docs: [],
    reason: ""
  },
  createdAt: new Date(),
  updatedAt: new Date()
})
```

**Option B: Generate Hash First**
```bash
# Run this in Node.js REPL or a script
node
> const bcrypt = require('bcryptjs');
> bcrypt.hash('Admin@123', 11).then(hash => console.log(hash));
# Copy the hash and use in MongoDB
```

### 2. Login as Admin

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin@123"
  }'
```

**Save the `accessToken` from the response!**

### 3. Set Environment Variable (Optional)
```bash
# For easier testing
export ADMIN_TOKEN="your_jwt_token_here"
```

---

## 📝 Essential Admin API Calls

### View All Properties
```bash
curl http://localhost:5000/api/v1/admin/properties \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### View Pending Approvals Only
```bash
curl "http://localhost:5000/api/v1/admin/properties?status=PENDING_APPROVAL" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### View Multiple Statuses
```bash
curl "http://localhost:5000/api/v1/admin/properties?status=PENDING_APPROVAL,LIVE" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Filter by Broker
```bash
curl "http://localhost:5000/api/v1/admin/properties?brokerId=BROKER_USER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Search Properties
```bash
curl "http://localhost:5000/api/v1/admin/properties?search=luxury&city=Mumbai" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Get Dashboard Statistics
```bash
curl http://localhost:5000/api/v1/admin/properties/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## ✅ Property Approval Workflow

### Step 1: Approve a Property
```bash
curl -X PATCH http://localhost:5000/api/v1/admin/properties/PROPERTY_ID/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Result**: Status changes from PENDING_APPROVAL → LIVE

### Step 2: Reject a Property
```bash
curl -X PATCH http://localhost:5000/api/v1/admin/properties/PROPERTY_ID/reject \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rejectionReason": "Property documents are incomplete. Please upload the title deed and NOC certificate."
  }'
```

**Result**: Status changes to REJECTED, broker sees the reason

---

## 🔄 Lifecycle Management

### Mark Property as FUNDED (when all units sold)
```bash
curl -X PATCH http://localhost:5000/api/v1/admin/properties/PROPERTY_ID/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "FUNDED",
    "notes": "All 100 units have been sold"
  }'
```

### Move to HOLDING Period
```bash
curl -X PATCH http://localhost:5000/api/v1/admin/properties/PROPERTY_ID/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "HOLDING",
    "notes": "Property fully funded, entering 36-month holding period"
  }'
```

### Mark as SOLD (after holding period)
```bash
curl -X PATCH http://localhost:5000/api/v1/admin/properties/PROPERTY_ID/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "SOLD",
    "notes": "Property sold, ready for payout distribution"
  }'
```

### Cancel a Property
```bash
curl -X PATCH http://localhost:5000/api/v1/admin/properties/PROPERTY_ID/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "CANCELLED",
    "notes": "Property cancelled due to legal issues"
  }'
```

---

## 🎯 Complete Test Scenario

### Scenario 1: Approval Flow

**As Broker** (Stage 3):
```bash
# 1. Create property
curl -X POST http://localhost:5000/api/v1/properties \
  -H "Authorization: Bearer $BROKER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...property data...}'

# 2. Submit for approval
curl -X POST http://localhost:5000/api/v1/properties/PROPERTY_ID/submit \
  -H "Authorization: Bearer $BROKER_TOKEN"
```

**As Admin** (Stage 4):
```bash
# 3. View pending approvals
curl "http://localhost:5000/api/v1/admin/properties?status=PENDING_APPROVAL" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 4. Approve the property
curl -X PATCH http://localhost:5000/api/v1/admin/properties/PROPERTY_ID/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**As Public** (Stage 3):
```bash
# 5. Verify property is now visible
curl http://localhost:5000/api/v1/properties
```

### Scenario 2: Rejection and Resubmission

**As Admin**:
```bash
# 1. Reject property
curl -X PATCH http://localhost:5000/api/v1/admin/properties/PROPERTY_ID/reject \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rejectionReason": "Valuation report is outdated. Please provide report dated within last 3 months."
  }'
```

**As Broker**:
```bash
# 2. View property (see rejection reason)
curl http://localhost:5000/api/v1/properties/PROPERTY_ID \
  -H "Authorization: Bearer $BROKER_TOKEN"

# 3. Update property with correct info
curl -X PUT http://localhost:5000/api/v1/properties/PROPERTY_ID \
  -H "Authorization: Bearer $BROKER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...updated data...}'

# 4. Resubmit
curl -X POST http://localhost:5000/api/v1/properties/PROPERTY_ID/submit \
  -H "Authorization: Bearer $BROKER_TOKEN"
```

**As Admin**:
```bash
# 5. Approve after fixes
curl -X PATCH http://localhost:5000/api/v1/admin/properties/PROPERTY_ID/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 🎮 Testing with Postman

### Environment Variables
Create a Postman environment with:
- `base_url`: http://localhost:5000
- `admin_token`: (paste admin JWT)
- `broker_token`: (paste broker JWT)
- `property_id`: (paste after creating property)

### Collection Structure
```
Real Estate Admin Panel
├── Auth
│   ├── Login as Admin
│   └── Login as Broker
├── Admin - Properties
│   ├── List All Properties
│   ├── List Pending Approvals
│   ├── Filter by Broker
│   ├── Search Properties
│   └── Get Statistics
├── Admin - Approval
│   ├── Approve Property
│   └── Reject Property
└── Admin - Lifecycle
    ├── Mark as Funded
    ├── Mark as Holding
    ├── Mark as Sold
    └── Cancel Property
```

---

## 🔍 Valid Status Transitions

```
DRAFT
  ↓ can go to: PENDING_APPROVAL, CANCELLED

PENDING_APPROVAL
  ↓ can go to: LIVE, REJECTED, CANCELLED

LIVE
  ↓ can go to: FUNDED, CANCELLED

FUNDED
  ↓ can go to: HOLDING, CANCELLED

HOLDING
  ↓ can go to: SOLD, CANCELLED

REJECTED
  ↓ can go to: PENDING_APPROVAL (resubmit), CANCELLED

SOLD
  ↓ (Terminal - no transitions)

CANCELLED
  ↓ (Terminal - no transitions)
```

---

## 💡 Common Use Cases

### Dashboard Overview
```bash
# Get quick stats
curl http://localhost:5000/api/v1/admin/properties/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Shows:
- Total properties
- Pending approvals count
- Total valuation
- Breakdown by status
- Recent properties

### Review Queue
```bash
# See all pending properties
curl "http://localhost:5000/api/v1/admin/properties?status=PENDING_APPROVAL&sort=-createdAt" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Broker Portfolio
```bash
# See specific broker's properties
curl "http://localhost:5000/api/v1/admin/properties?brokerId=BROKER_ID&sort=-createdAt" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Active Listings
```bash
# See all live properties
curl "http://localhost:5000/api/v1/admin/properties?status=LIVE,FUNDED&sort=-valuation" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## ⚠️ Common Errors & Solutions

### "Forbidden"
**Error**: 403 Forbidden
**Cause**: Not logged in as ADMIN
**Solution**: 
- Verify you're using admin token
- Check user role in database is "ADMIN"
- Ensure token hasn't expired

### "Cannot approve property with status DRAFT"
**Error**: 400 Bad Request
**Cause**: Property not in PENDING_APPROVAL status
**Solution**: 
- Broker must submit property first
- Check current status: `GET /api/v1/properties/:id`

### "Rejection reason is required"
**Error**: 400 Bad Request
**Cause**: Missing or empty rejectionReason
**Solution**: 
- Add rejectionReason in request body
- Must be at least 10 characters long

### "Cannot mark as FUNDED. Only X of Y units sold"
**Error**: 400 Bad Request
**Cause**: Not all units are sold
**Solution**: 
- Wait for units to be sold (Stage 5)
- For testing: manually update unitsSold in database

### "Invalid status transition from X to Y"
**Error**: 400 Bad Request
**Cause**: Invalid state transition
**Solution**: 
- Check allowed transitions in error message
- Follow correct lifecycle order

---

## 📊 Quick Statistics Check

```bash
# One-liner to see all property counts by status
curl -s http://localhost:5000/api/v1/admin/properties/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN" | \
  jq '.statusBreakdown'
```

---

## ✅ Verification Checklist

After running quick start:
- [ ] Admin user created in database
- [ ] Can login as admin and get token
- [ ] Can view all properties (admin endpoint)
- [ ] Can view pending approvals
- [ ] Can approve a property
- [ ] Can reject a property with reason
- [ ] Can change property status
- [ ] Can view dashboard statistics
- [ ] Non-admin users get 403 error
- [ ] Invalid transitions are blocked

---

## 🆘 Need Help?

### Check Server Logs
```bash
# In terminal where server is running
# Look for error messages
```

### Verify in Database
```javascript
// MongoDB shell
db.properties.findOne({ _id: ObjectId("PROPERTY_ID") })
```

### Test Authorization
```bash
# Try with broker token (should fail)
curl http://localhost:5000/api/v1/admin/properties \
  -H "Authorization: Bearer $BROKER_TOKEN"
# Expect: 403 Forbidden
```

---

## 📚 Full Documentation

For complete API reference:
- `STAGE_4_DOCUMENTATION.md` - Complete API docs
- `STAGE_4_TEST_CHECKLIST.md` - Comprehensive testing
- `STAGE_4_SUMMARY.md` - Implementation overview

---

## 🎉 You're Ready!

Stage 4 admin panel is fully functional. You can now:
- ✅ Manage property approvals
- ✅ Control property lifecycle
- ✅ View dashboard analytics
- ✅ Filter and search efficiently
- ✅ Track audit trail

**Ready to move to Stage 5 (Investment System)!** 🚀
