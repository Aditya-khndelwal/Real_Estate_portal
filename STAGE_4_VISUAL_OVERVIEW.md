# Stage 4: Visual Overview & State Machine

## 🏗️ Admin Panel Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      ADMIN USER                              │
│              (Authenticated with ADMIN role)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              /api/v1/admin/* Routes                          │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Middleware Chain (Applied to ALL routes)             │ │
│  │  1. authenticate   → Verify JWT token                 │ │
│  │  2. authorize      → Verify ADMIN role                │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│  GET /properties │    │ GET /properties/ │
│                  │    │      stats       │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
         ▼                       ▼
┌──────────────────────┐  ┌─────────────────┐
│ listAllProperties()  │  │ getPropertyStats│
│                      │  │                 │
│ • Filter by status   │  │ • Aggregate     │
│ • Filter by broker   │  │ • Count by      │
│ • Filter by city     │  │   status        │
│ • Search             │  │ • Total         │
│ • Paginate           │  │   valuation     │
│ • Populate refs      │  │ • Recent        │
└──────────────────────┘  │   properties    │
                          └─────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│    Property Lifecycle Management         │
│                                          │
│  PATCH /:id/approve                      │
│  → approveProperty()                     │
│    • PENDING_APPROVAL → LIVE             │
│    • Set approvedBy, timestamps          │
│                                          │
│  PATCH /:id/reject                       │
│  → rejectProperty()                      │
│    • PENDING_APPROVAL → REJECTED         │
│    • Require reason                      │
│                                          │
│  PATCH /:id/status                       │
│  → changePropertyStatus()                │
│    • Validate transitions                │
│    • Enforce business rules              │
│    • Update timestamps                   │
└──────────────────────────────────────────┘
         │
         ▼
┌──────────────────┐
│  Property Model  │
│  (MongoDB)       │
└──────────────────┘
```

---

## 🔄 Complete Property Lifecycle State Machine

```
                    ┌─────────────────────────────────────┐
                    │         BROKER CREATES              │
                    │         PROPERTY                    │
                    └──────────────┬──────────────────────┘
                                   │
                                   ▼
                        ┌─────────────────┐
                        │     DRAFT       │
                        │                 │
                        │  Broker edits   │
                        │  Adds images    │
                        │  Adds docs      │
                        └────────┬────────┘
                                 │
                                 │ Broker submits
                                 │ (Stage 3)
                                 ▼
                     ┌──────────────────────┐
                     │  PENDING_APPROVAL    │◄─────────────┐
                     │                      │              │
                     │  Waiting for admin   │              │
                     └──────────┬───────────┘              │
                                │                          │
                   ┌────────────┴────────────┐            │
                   │    ADMIN REVIEWS        │            │
                   │    (Stage 4)            │            │
                   └────────────┬────────────┘            │
                                │                          │
                   ┌────────────┴────────────┐            │
                   │                         │            │
           APPROVE │                         │ REJECT     │
                   ▼                         ▼            │
        ┌──────────────────┐      ┌──────────────────┐   │
        │      LIVE        │      │    REJECTED      │   │
        │                  │      │                  │   │
        │ Public can see   │      │ Broker sees      │   │
        │ Investors buy    │      │ rejection reason │   │
        └────────┬─────────┘      └────────┬─────────┘   │
                 │                         │             │
                 │                         │ Broker      │
                 │                         │ fixes &     │
                 │                         │ resubmits   │
                 │                         └─────────────┘
                 │
                 │ Units being sold
                 │ (unitsSold increases)
                 │
                 ▼
        ┌──────────────────┐
        │     FUNDED       │
        │                  │
        │ unitsSold ==     │
        │ totalUnits       │
        └────────┬─────────┘
                 │
                 │ Admin marks
                 │ (Stage 4)
                 ▼
        ┌──────────────────┐
        │    HOLDING       │
        │                  │
        │ Holding period   │
        │ (e.g., 36 months)│
        └────────┬─────────┘
                 │
                 │ Holding ends
                 │ Property sold
                 ▼
        ┌──────────────────┐
        │      SOLD        │
        │                  │
        │ Payouts          │
        │ distributed      │
        │ (Terminal State) │
        └──────────────────┘


        At any stage (except SOLD):
                 │
                 │ Admin cancels
                 │ (Stage 4)
                 ▼
        ┌──────────────────┐
        │   CANCELLED      │
        │                  │
        │ Refunds issued   │
        │ (Terminal State) │
        └──────────────────┘
```

---

## 📊 State Transition Matrix

```
┌──────────────────┬────────────────────────────────────────────┐
│  CURRENT STATUS  │         ALLOWED NEXT STATES                │
├──────────────────┼────────────────────────────────────────────┤
│ DRAFT            │ → PENDING_APPROVAL, CANCELLED              │
├──────────────────┼────────────────────────────────────────────┤
│ PENDING_APPROVAL │ → LIVE, REJECTED, CANCELLED                │
├──────────────────┼────────────────────────────────────────────┤
│ LIVE             │ → FUNDED, CANCELLED                        │
├──────────────────┼────────────────────────────────────────────┤
│ FUNDED           │ → HOLDING, CANCELLED                       │
├──────────────────┼────────────────────────────────────────────┤
│ HOLDING          │ → SOLD, CANCELLED                          │
├──────────────────┼────────────────────────────────────────────┤
│ REJECTED         │ → PENDING_APPROVAL, CANCELLED              │
├──────────────────┼────────────────────────────────────────────┤
│ SOLD             │ → (Terminal - No transitions)              │
├──────────────────┼────────────────────────────────────────────┤
│ CANCELLED        │ → (Terminal - No transitions)              │
└──────────────────┴────────────────────────────────────────────┘
```

---

## 🎯 Approval Workflow Details

```
┌─────────────────────────────────────────────────────────────┐
│                  PROPERTY APPROVAL FLOW                      │
└─────────────────────────────────────────────────────────────┘

Step 1: BROKER SUBMITS
┌────────────────────────┐
│  Property in DRAFT     │
│  • All fields filled   │
│  • 3+ images           │
│  • Documents uploaded  │
└──────────┬─────────────┘
           │
           │ POST /:id/submit
           ▼
┌────────────────────────┐
│  PENDING_APPROVAL      │
└──────────┬─────────────┘
           │
           ▼

Step 2: ADMIN REVIEWS
┌────────────────────────────────────────┐
│  GET /admin/properties?status=         │
│      PENDING_APPROVAL                  │
│                                        │
│  Shows:                                │
│  • Property details                    │
│  • Broker information                  │
│  • Images & documents                  │
│  • Valuation & units                   │
└──────────┬─────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│        ADMIN DECISION                    │
│                                          │
│  ┌─────────────┐      ┌──────────────┐  │
│  │   APPROVE   │  OR  │    REJECT    │  │
│  └──────┬──────┘      └──────┬───────┘  │
└─────────┼─────────────────────┼──────────┘
          │                     │
          ▼                     ▼

PATCH /:id/approve        PATCH /:id/reject
          │                     │
          │                     │ + rejectionReason
          ▼                     ▼
┌────────────────────┐   ┌─────────────────────┐
│      LIVE          │   │     REJECTED        │
│                    │   │                     │
│ • approvedBy set   │   │ • reason visible    │
│ • approvedAt set   │   │   to broker         │
│ • listedAt set     │   │ • Can resubmit      │
│ • Public visibility│   │   after fixes       │
└────────────────────┘   └─────────────────────┘
```

---

## 🔐 Security & Authorization Flow

```
┌─────────────────────────────────────────────────────────────┐
│              REQUEST TO ADMIN ENDPOINT                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  Has JWT Token? │
              └────────┬────────┘
                       │
              ┌────────┴────────┐
              │                 │
            NO│                 │YES
              ▼                 ▼
        ┌──────────┐    ┌──────────────┐
        │ 401      │    │ Verify Token │
        │ Unauth   │    │ with JWT     │
        └──────────┘    └──────┬───────┘
                               │
                      ┌────────┴────────┐
                      │                 │
                  INVALID           VALID
                      │                 │
                      ▼                 ▼
                ┌──────────┐    ┌──────────────┐
                │ 401      │    │ Find User    │
                │ Invalid  │    │ in Database  │
                │ Token    │    └──────┬───────┘
                └──────────┘           │
                                       │
                              ┌────────┴────────┐
                              │                 │
                        NOT FOUND           FOUND
                              │                 │
                              ▼                 ▼
                        ┌──────────┐    ┌──────────────┐
                        │ 401      │    │ Is User      │
                        │ User Not │    │ Active?      │
                        │ Found    │    └──────┬───────┘
                        └──────────┘           │
                                               │
                                      ┌────────┴────────┐
                                      │                 │
                                     NO               YES
                                      │                 │
                                      ▼                 ▼
                                ┌──────────┐    ┌──────────────┐
                                │ 401      │    │ Is Role      │
                                │ Inactive │    │ ADMIN?       │
                                └──────────┘    └──────┬───────┘
                                                       │
                                              ┌────────┴────────┐
                                              │                 │
                                             NO               YES
                                              │                 │
                                              ▼                 ▼
                                        ┌──────────┐    ┌──────────────┐
                                        │ 403      │    │ AUTHORIZED   │
                                        │ Forbidden│    │              │
                                        └──────────┘    │ Execute      │
                                                        │ Controller   │
                                                        └──────────────┘
```

---

## 📈 Dashboard Statistics Visualization

```
┌─────────────────────────────────────────────────────────────┐
│                   ADMIN DASHBOARD                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Total Properties: 150              Pending Approvals: 8    │
│  Total Valuation: ₹5,000 Cr                                 │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  STATUS BREAKDOWN                                           │
│                                                              │
│  ┌──────────────┬─────────┬───────────────────┐           │
│  │   Status     │  Count  │  Total Valuation  │           │
│  ├──────────────┼─────────┼───────────────────┤           │
│  │ DRAFT        │   20    │  ₹500 Cr          │           │
│  │ PENDING      │    8    │  ₹200 Cr          │ ◄─ ACTION│
│  │ LIVE         │   45    │  ₹1,500 Cr        │           │
│  │ FUNDED       │   30    │  ₹1,000 Cr        │           │
│  │ HOLDING      │   25    │  ₹900 Cr          │           │
│  │ SOLD         │   15    │  ₹600 Cr          │           │
│  │ REJECTED     │    5    │  ₹200 Cr          │           │
│  │ CANCELLED    │    2    │  ₹100 Cr          │           │
│  └──────────────┴─────────┴───────────────────┘           │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  RECENT PROPERTIES                                          │
│                                                              │
│  1. New Apartment - PENDING_APPROVAL - Jan 15, 2024        │
│  2. Villa in Goa - LIVE - Jan 14, 2024                     │
│  3. Commercial Space - FUNDED - Jan 13, 2024               │
│  4. Plot in Delhi - REJECTED - Jan 12, 2024                │
│  5. Warehouse - HOLDING - Jan 11, 2024                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎬 Example: Complete Property Journey

```
DAY 1: CREATION
┌─────────────────────────────┐
│ BROKER: John                │
│ Creates property            │
│ Status: DRAFT               │
└─────────────────────────────┘

DAY 2: SUBMISSION
┌─────────────────────────────┐
│ BROKER: John                │
│ Submits for approval        │
│ Status: PENDING_APPROVAL    │
└─────────────────────────────┘

DAY 3: ADMIN REVIEW
┌─────────────────────────────┐
│ ADMIN: Sarah                │
│ Reviews property            │
│ Decision: APPROVE           │
│ Status: LIVE                │
│ • approvedBy: Sarah's ID    │
│ • approvedAt: Day 3         │
│ • listedAt: Day 3           │
└─────────────────────────────┘

DAYS 4-30: FUNDRAISING
┌─────────────────────────────┐
│ INVESTORS buying units      │
│ unitsSold: 0 → 100          │
│ Status: LIVE                │
└─────────────────────────────┘

DAY 31: FULLY FUNDED
┌─────────────────────────────┐
│ ADMIN: Sarah                │
│ Marks as FUNDED             │
│ Status: FUNDED              │
│ • fundedAt: Day 31          │
│ • All units sold            │
└─────────────────────────────┘

DAY 32: HOLDING PERIOD
┌─────────────────────────────┐
│ ADMIN: Sarah                │
│ Moves to HOLDING            │
│ Status: HOLDING             │
│ • 36 months holding         │
└─────────────────────────────┘

DAY 1125: PROPERTY SOLD
┌─────────────────────────────┐
│ ADMIN: Sarah                │
│ Property liquidated         │
│ Status: SOLD                │
│ • soldAt: Day 1125          │
│ • Payouts distributed       │
└─────────────────────────────┘
```

---

## 🔄 Status Change Validation Logic

```
PATCH /admin/properties/:id/status
Request: { "status": "FUNDED" }

┌─────────────────────────────────────────┐
│  1. Validate Status Value               │
│     ✓ Is it valid enum?                 │
│     ✓ FUNDED is valid                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  2. Check Current Status                │
│     Current: LIVE                       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  3. Validate Transition                 │
│     LIVE → FUNDED allowed?              │
│     ✓ YES (valid transition)            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  4. Special Business Rules              │
│     For FUNDED:                         │
│     • Check unitsSold === totalUnits    │
│     • unitsSold: 100, totalUnits: 100   │
│     ✓ PASS                              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  5. Update Property                     │
│     • status = "FUNDED"                 │
│     • fundedAt = new Date()             │
│     • Save to database                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  6. Return Success                      │
│     {                                   │
│       message: "Status changed...",     │
│       previousStatus: "LIVE",           │
│       newStatus: "FUNDED"               │
│     }                                   │
└─────────────────────────────────────────┘
```

---

## 📊 Data Flow: Approval Action

```
ADMIN REQUEST
     │
     │ PATCH /admin/properties/ABC123/approve
     │ Authorization: Bearer <ADMIN_JWT>
     │
     ▼
┌────────────────────────────┐
│ 1. authenticate()          │
│    Verify JWT              │
└──────────┬─────────────────┘
           │ ✓ Valid
           ▼
┌────────────────────────────┐
│ 2. authorize('ADMIN')      │
│    Check role === ADMIN    │
└──────────┬─────────────────┘
           │ ✓ Authorized
           ▼
┌────────────────────────────┐
│ 3. approveProperty()       │
│    a. Find property        │
│    b. Check status         │
│    c. Validate             │
└──────────┬─────────────────┘
           │
           ▼
┌───────────────────────────────────┐
│ Property Data                     │
│ ┌───────────────────────────────┐ │
│ │ _id: ABC123                   │ │
│ │ status: PENDING_APPROVAL      │ │
│ │ title: "Luxury Apartment"     │ │
│ │ brokerId: XYZ789              │ │
│ └───────────────────────────────┘ │
└──────────┬────────────────────────┘
           │
           ▼
┌────────────────────────────┐
│ 4. Validation Checks       │
│    ✓ Status is PENDING_    │
│      APPROVAL              │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│ 5. Update Property         │
│    status = LIVE           │
│    approvedBy = admin._id  │
│    approvedAt = now()      │
│    listedAt = now()        │
│    rejectionReason = null  │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│ 6. Save to MongoDB         │
│    property.save()         │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│ 7. Response 200 OK         │
│    {                       │
│      message: "Approved",  │
│      property: {...}       │
│    }                       │
└────────────────────────────┘
```

---

## 🎉 Stage 4 Complete!

All admin lifecycle management working:
✅ Strict ADMIN-only authorization  
✅ Property approval workflow  
✅ Property rejection with feedback  
✅ Complete state machine  
✅ Business rule enforcement  
✅ Dashboard statistics  
✅ Comprehensive filtering  
✅ Full audit trail  
