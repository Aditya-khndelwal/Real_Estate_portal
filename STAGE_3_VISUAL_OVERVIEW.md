# Stage 3: Visual Overview & Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                               │
│  (Postman / Future Frontend / Mobile App)                   │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP Requests
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXPRESS SERVER                            │
│                    (server.js)                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Middleware Stack                                      │ │
│  │  • CORS                                                │ │
│  │  • Helmet (Security Headers)                           │ │
│  │  • express.json() (Body Parser)                        │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  Auth Routes    │     │ Property Routes │
│  /api/v1/auth   │     │ /api/v1/        │
│                 │     │ properties      │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │              ┌────────┴────────┐
         │              │  Route Handlers │
         │              │  • GET /        │
         │              │  • GET /:id     │
         │              │  • POST /       │
         │              │  • PUT /:id     │
         │              │  • POST /:id/   │
         │              │    submit       │
         │              └────────┬────────┘
         │                       │
         │              ┌────────▼────────────┐
         │              │  Middleware Chain   │
         │              │  1. validateQuery/  │
         │              │     validateBody    │
         │              │  2. authenticate    │
         │              │  3. authorize       │
         │              └────────┬────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────────┐
│ Auth Controller │     │ Property Controller │
│                 │     │                     │
│ • signup        │     │ • createProperty    │
│ • login         │     │ • listProperties    │
│ • me            │     │ • getPropertyById   │
└────────┬────────┘     │ • updateProperty    │
         │              │ • submitProperty    │
         │              └──────────┬──────────┘
         │                         │
         └─────────┬───────────────┘
                   │
                   ▼
         ┌──────────────────┐
         │  Mongoose Models │
         │                  │
         │  • User          │
         │  • Property      │
         │  • Investment    │
         │  • Transaction   │
         │  • Payout        │
         │  • Withdrawal    │
         └────────┬─────────┘
                  │
                  ▼
         ┌─────────────────┐
         │   MongoDB        │
         │   Database       │
         └──────────────────┘
```

---

## 🔄 Property Lifecycle Flow

```
┌──────────┐
│  BROKER  │
└────┬─────┘
     │
     │ 1. Create Property
     ▼
┌─────────────┐
│   DRAFT     │ ◄──┐
└──────┬──────┘    │
       │           │
       │ 2. Submit │ 6. Fix Issues
       ▼           │
┌──────────────────┐│
│ PENDING_APPROVAL ││
└──────┬───────────┘│
       │            │
   ┌───┴────┐       │
   │ ADMIN  │       │
   └───┬────┘       │
       │            │
   ┌───┴────┐       │
   │Approve?│       │
   └───┬────┘       │
       │            │
  ┌────┴─────┐      │
  │          │      │
  ▼          ▼      │
┌──────┐  ┌──────────┐
│ LIVE │  │ REJECTED │─┘
└──┬───┘  └──────────┘
   │
   │ 3. Investors Buy Units
   │    (unitsSold increases)
   │
   ▼
┌────────────┐
│   FUNDED   │ (unitsSold = totalUnits)
└──────┬─────┘
       │
       │ 4. Holding Period
       ▼
┌─────────────┐
│   HOLDING   │
└──────┬──────┘
       │
       │ 5. Property Sold
       ▼
┌──────────────┐
│     SOLD     │
└──────────────┘
   │
   │ Payouts Distributed
   ▼
┌───────────────┐
│  Investment   │
│    Closed     │
└───────────────┘

     Other States:
   ┌──────────────┐
   │  CANCELLED   │ (Property withdrawn)
   └──────────────┘
```

---

## 🔐 Authorization Matrix

```
┌─────────────────────┬─────────┬──────────┬─────────┬────────┐
│     ENDPOINT        │  PUBLIC │ INVESTOR │ BROKER  │ ADMIN  │
├─────────────────────┼─────────┼──────────┼─────────┼────────┤
│ GET /properties     │    ✅   │    ✅    │   ✅    │   ✅   │
│ (List/Search)       │         │          │         │        │
├─────────────────────┼─────────┼──────────┼─────────┼────────┤
│ GET /properties/:id │    ✅   │    ✅    │   ✅    │   ✅   │
│ (Details)           │         │          │         │        │
├─────────────────────┼─────────┼──────────┼─────────┼────────┤
│ POST /properties    │    ❌   │    ❌    │   ✅    │   ✅   │
│ (Create)            │         │          │         │        │
├─────────────────────┼─────────┼──────────┼─────────┼────────┤
│ PUT /properties/:id │    ❌   │    ❌    │   ✅*   │   ✅   │
│ (Update)            │         │          │ (owner) │        │
├─────────────────────┼─────────┼──────────┼─────────┼────────┤
│ POST /properties/   │    ❌   │    ❌    │   ✅*   │   ❌   │
│ :id/submit          │         │          │ (owner) │        │
└─────────────────────┴─────────┴──────────┴─────────┴────────┘

* Owner = The broker who created the property
```

---

## 📊 Data Flow Examples

### Example 1: Creating a Property

```
BROKER REQUEST
    │
    ▼
POST /api/v1/properties
Headers: Authorization: Bearer <JWT>
Body: {
  title: "Luxury Apartment",
  valuation: 1000000000,
  totalUnits: 100,
  ...
}
    │
    ▼
┌───────────────────┐
│ Route Handler     │
│ authenticate()    │ ─── Verify JWT ───┐
└─────────┬─────────┘                    │
          │                              ▼
          │                        ┌──────────┐
          ▼                        │ JWT      │
┌───────────────────┐              │ Valid?   │
│ authorize()       │◄─────────────┤ User     │
│ (BROKER, ADMIN)   │              │ Active?  │
└─────────┬─────────┘              └──────────┘
          │
          ▼
┌───────────────────┐
│ validateBody()    │
│ (Zod Schema)      │
└─────────┬─────────┘
          │
          ▼
┌───────────────────────┐
│ propertyController    │
│ .createProperty()     │
│                       │
│ 1. Add brokerId       │
│ 2. Calculate unitPrice│
│ 3. Set status: DRAFT  │
│ 4. Save to DB         │
└─────────┬─────────────┘
          │
          ▼
    201 Created
    {
      property: {...},
      message: "Success"
    }
```

### Example 2: Listing Properties with Filters

```
PUBLIC REQUEST
    │
    ▼
GET /api/v1/properties?city=Mumbai&type=APARTMENT&page=1&limit=10
    │
    ▼
┌─────────────────────┐
│ validateQuery()     │
│ (Parse & validate)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────┐
│ propertyController      │
│ .listProperties()       │
│                         │
│ 1. Build filter query   │
│    { city: /Mumbai/i,   │
│      type: "APARTMENT", │
│      status: {$in:      │
│        [LIVE, FUNDED]}} │
│ 2. Apply pagination     │
│ 3. Sort results         │
│ 4. Populate broker info │
│ 5. Count total          │
└──────────┬──────────────┘
           │
           ▼
     200 OK
     {
       properties: [...],
       pagination: {
         total: 50,
         page: 1,
         totalPages: 5,
         ...
       }
     }
```

### Example 3: Submitting for Approval

```
BROKER (Owner)
    │
    ▼
POST /api/v1/properties/ABC123/submit
Headers: Authorization: Bearer <JWT>
    │
    ▼
┌──────────────────────┐
│ authenticate()       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ authorize(BROKER)    │
└──────────┬───────────┘
           │
           ▼
┌────────────────────────────┐
│ submitPropertyForApproval()│
│                            │
│ 1. Find property           │
│ 2. Check ownership         │
│    (brokerId == user._id)  │
│ 3. Check status            │
│    (must be DRAFT/REJECTED)│
│ 4. Validate fields         │
│    - All required present? │
│    - At least 3 images?    │
│ 5. Update status:          │
│    PENDING_APPROVAL        │
└──────────┬─────────────────┘
           │
      ┌────┴─────┐
      │          │
      ▼          ▼
   Success    Failure
     │          │
     ▼          ▼
  200 OK    400/403
  {          {
    status:    message:
    PENDING    "Missing
  }            fields"
             }
```

---

## 💾 Database Schema Relationships

```
┌─────────────┐
│    USER     │
│ _id         │◄────┐
│ name        │     │
│ email       │     │
│ role        │     │
└─────────────┘     │
                    │ brokerId
                    │
                    │
┌─────────────────┐ │
│   PROPERTY      │ │
│ _id             │ │
│ title           │ │
│ valuation       │─┘
│ totalUnits      │
│ unitPrice       │◄────┐
│ unitsSold       │     │
│ status          │     │
│ brokerId (ref)  │     │
│ approvedBy      │     │
└─────────────────┘     │ propertyId
                        │
                        │
┌─────────────────┐     │
│  INVESTMENT     │     │
│ _id             │     │
│ investorId      │─────┘
│ propertyId (ref)│
│ units           │
│ amount          │
│ status          │
└─────────────────┘
         │
         │ refType: "Investment"
         │ refId
         ▼
┌─────────────────┐
│  TRANSACTION    │
│ _id             │
│ userId          │
│ type            │
│ direction       │
│ amount          │
│ balanceAfter    │
│ refType         │
│ refId           │
└─────────────────┘
```

---

## 🎯 Key Calculations

### Unit Price Calculation
```javascript
unitPrice = valuation / totalUnits

Example:
valuation = 1,000,000,000 paise (₹1 Crore)
totalUnits = 100
unitPrice = 10,000,000 paise (₹1 Lakh per unit)

Validation: valuation % totalUnits === 0
```

### Funding Percentage
```javascript
fundingPct = (unitsSold / totalUnits) * 100

Example:
unitsSold = 45
totalUnits = 100
fundingPct = 45.00%
```

### Units Available
```javascript
unitsAvailable = totalUnits - unitsSold

Example:
totalUnits = 100
unitsSold = 45
unitsAvailable = 55
```

---

## 🔍 Query Optimization

### Indexes Created
```javascript
Property Model:
- { city: 1, status: 1 }
- { brokerId: 1, status: 1 }
- { status: 1 }

User Model:
- { email: 1 } (unique)
- { role: 1 }
- { isActive: 1 }

Investment Model:
- { investorId: 1, propertyId: 1 }
- { propertyId: 1, status: 1 }
```

### Query Performance
```javascript
// List Properties - Optimized
Property.find(filter)
  .sort(sort)
  .skip(skip)
  .limit(limit)
  .populate('brokerId', 'name email')  // Only needed fields
  .lean()  // Plain JS objects (faster)

// Parallel Queries
Promise.all([
  Property.find(...),     // Get properties
  Property.countDocuments(...)  // Get count
])
```

---

## 🛡️ Security Layers

```
┌────────────────────────────────────────┐
│  1. Input Validation (Zod)            │
│     ✓ Type checking                    │
│     ✓ Format validation                │
│     ✓ Business rules                   │
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│  2. Authentication (JWT)               │
│     ✓ Token verification               │
│     ✓ User existence check             │
│     ✓ Account active check             │
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│  3. Authorization (RBAC)               │
│     ✓ Role validation                  │
│     ✓ Ownership verification           │
│     ✓ State-based permissions          │
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│  4. Business Logic Validation          │
│     ✓ Status transitions               │
│     ✓ Field immutability               │
│     ✓ Minimum requirements             │
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│  5. Database Constraints               │
│     ✓ Schema validation                │
│     ✓ Unique indexes                   │
│     ✓ Required fields                  │
└────────────────────────────────────────┘
```

---

## 📈 Performance Metrics

### Response Time Targets
- List Properties: < 200ms
- Get Property: < 100ms
- Create Property: < 150ms
- Update Property: < 150ms
- Submit Property: < 100ms

### Pagination Best Practices
- Default limit: 20 items
- Max limit: 100 items
- Skip calculation: (page - 1) * limit
- Always return metadata

---

## 🎉 Stage 3 Complete!

All components working together:
✅ Validation → Authentication → Authorization → Business Logic → Database
