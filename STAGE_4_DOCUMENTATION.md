# Stage 4: Admin Approval & Lifecycle Management - Documentation

## Overview
Stage 4 implements the complete admin control panel for property management, including approval workflows, status transitions, and lifecycle management.

---

## Files Created

1. **server/src/controllers/adminPropertyController.js** - Admin-only property management controllers
2. **server/src/routes/adminPropertyRoutes.js** - Admin route definitions with strict authorization
3. **server/src/server.js** - Updated to include admin routes

---

## API Endpoints

### 1. List All Properties (Admin View)
**GET** `/api/v1/admin/properties`

**Access**: ADMIN only (requires authentication + ADMIN role)

**Query Parameters**:
- `status` (string, optional) - Filter by status (supports comma-separated values for multiple statuses)
- `brokerId` (string, optional) - Filter by broker ID
- `city` (string, optional) - Filter by city (case-insensitive)
- `search` (string, optional) - Search in title, description, city, address
- `sort` (string, optional) - Sort field (default: -createdAt)
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Items per page (default: 20)

**Example Request**:
```bash
GET /api/v1/admin/properties?status=PENDING_APPROVAL&page=1&limit=10
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

**Response**: 200 OK
```json
{
  "properties": [
    {
      "_id": "...",
      "title": "Luxury Apartment in Bandra",
      "status": "PENDING_APPROVAL",
      "valuation": 1000000000,
      "totalUnits": 100,
      "unitPrice": 10000000,
      "brokerId": {
        "_id": "...",
        "name": "John Broker",
        "email": "john@example.com",
        "phone": "+91XXXXXXXXXX",
        "brokerApproved": true
      },
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

**Features**:
- View ALL properties regardless of status
- Filter by multiple statuses: `?status=PENDING_APPROVAL,LIVE,FUNDED`
- See broker details including broker approval status
- Full pagination support

---

### 2. Approve Property
**PATCH** `/api/v1/admin/properties/:id/approve`

**Access**: ADMIN only

**Request**: No body required

**Example Request**:
```bash
PATCH /api/v1/admin/properties/ABC123/approve
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

**Response**: 200 OK
```json
{
  "message": "Property approved and listed successfully",
  "property": {
    "_id": "ABC123",
    "title": "Luxury Apartment in Bandra",
    "status": "LIVE",
    "approvedBy": "ADMIN_USER_ID",
    "approvedAt": "2024-01-15T12:00:00.000Z",
    "listedAt": "2024-01-15T12:00:00.000Z",
    "brokerId": {
      "name": "John Broker",
      "email": "john@example.com"
    },
    ...
  }
}
```

**Business Rules**:
- Only properties with status `PENDING_APPROVAL` can be approved
- Status changes to `LIVE`
- Sets `approvedBy` to current admin's ID
- Records `approvedAt` timestamp
- Records `listedAt` timestamp
- Clears any previous `rejectionReason`

**Error Responses**:

Invalid status (400):
```json
{
  "message": "Cannot approve property with status DRAFT. Only PENDING_APPROVAL properties can be approved."
}
```

Property not found (404):
```json
{
  "message": "Property not found"
}
```

---

### 3. Reject Property
**PATCH** `/api/v1/admin/properties/:id/reject`

**Access**: ADMIN only

**Request Body**:
```json
{
  "rejectionReason": "Property documents are incomplete. Please upload the title deed and NOC certificate."
}
```

**Example Request**:
```bash
PATCH /api/v1/admin/properties/ABC123/reject
Authorization: Bearer <ADMIN_JWT_TOKEN>
Content-Type: application/json

{
  "rejectionReason": "Property valuation seems incorrect based on market rates. Please provide updated valuation report."
}
```

**Response**: 200 OK
```json
{
  "message": "Property rejected",
  "property": {
    "_id": "ABC123",
    "title": "Luxury Apartment in Bandra",
    "status": "REJECTED",
    "rejectionReason": "Property valuation seems incorrect based on market rates. Please provide updated valuation report.",
    "brokerId": {
      "name": "John Broker",
      "email": "john@example.com"
    },
    ...
  }
}
```

**Business Rules**:
- Only properties with status `PENDING_APPROVAL` can be rejected
- `rejectionReason` is required and must be at least 10 characters
- Status changes to `REJECTED`
- Broker can fix issues and resubmit (REJECTED → PENDING_APPROVAL)

**Error Responses**:

Missing rejection reason (400):
```json
{
  "message": "Rejection reason is required and must be a non-empty string"
}
```

Rejection reason too short (400):
```json
{
  "message": "Rejection reason must be at least 10 characters long"
}
```

Invalid status (400):
```json
{
  "message": "Cannot reject property with status LIVE. Only PENDING_APPROVAL properties can be rejected."
}
```

---

### 4. Change Property Status
**PATCH** `/api/v1/admin/properties/:id/status`

**Access**: ADMIN only

**Request Body**:
```json
{
  "status": "FUNDED",
  "notes": "All 100 units have been sold. Moving to funded status."
}
```

**Example Request**:
```bash
PATCH /api/v1/admin/properties/ABC123/status
Authorization: Bearer <ADMIN_JWT_TOKEN>
Content-Type: application/json

{
  "status": "HOLDING",
  "notes": "Property fully funded, entering holding period of 36 months."
}
```

**Response**: 200 OK
```json
{
  "message": "Property status changed from FUNDED to HOLDING",
  "property": {
    "_id": "ABC123",
    "status": "HOLDING",
    ...
  },
  "previousStatus": "FUNDED",
  "newStatus": "HOLDING"
}
```

**Valid Status Transitions**:

```
DRAFT → PENDING_APPROVAL, CANCELLED
PENDING_APPROVAL → LIVE, REJECTED, CANCELLED
LIVE → FUNDED, CANCELLED
FUNDED → HOLDING, CANCELLED
HOLDING → SOLD, CANCELLED
REJECTED → PENDING_APPROVAL, CANCELLED
SOLD → (terminal state, no transitions)
CANCELLED → (terminal state, no transitions)
```

**Special Business Rules**:

1. **Transition to FUNDED**:
   - Validates that `unitsSold === totalUnits`
   - Sets `fundedAt` timestamp
   
   Error if units not fully sold:
   ```json
   {
     "message": "Cannot mark as FUNDED. Only 45 of 100 units are sold.",
     "unitsSold": 45,
     "totalUnits": 100,
     "unitsRemaining": 55
   }
   ```

2. **Transition to SOLD**:
   - Must be coming from `HOLDING` status
   - Sets `soldAt` timestamp
   
   Error if not from HOLDING:
   ```json
   {
     "message": "Property must be in HOLDING status before marking as SOLD"
   }
   ```

3. **Transition to CANCELLED**:
   - Checks for active investments
   - Cannot cancel if there are active investments
   
   Error if active investments exist:
   ```json
   {
     "message": "Cannot cancel property with 12 active investments. Refund investors first.",
     "activeInvestments": 12
   }
   ```

4. **Transition to LIVE**:
   - Sets `listedAt` timestamp
   - Sets `approvedBy` and `approvedAt` if not already set

**Error Responses**:

Invalid status (400):
```json
{
  "message": "Invalid status. Must be one of: DRAFT, PENDING_APPROVAL, LIVE, FUNDED, HOLDING, SOLD, REJECTED, CANCELLED"
}
```

Already in requested status (400):
```json
{
  "message": "Property is already in LIVE status"
}
```

Invalid transition (400):
```json
{
  "message": "Invalid status transition from LIVE to DRAFT. Allowed transitions: FUNDED, CANCELLED",
  "currentStatus": "LIVE",
  "requestedStatus": "DRAFT",
  "allowedTransitions": ["FUNDED", "CANCELLED"]
}
```

Terminal state (400):
```json
{
  "message": "Invalid status transition from SOLD to HOLDING. Allowed transitions: none (terminal state)",
  "currentStatus": "SOLD",
  "requestedStatus": "HOLDING",
  "allowedTransitions": []
}
```

---

### 5. Get Property Statistics
**GET** `/api/v1/admin/properties/stats`

**Access**: ADMIN only

**Request**: No parameters required

**Example Request**:
```bash
GET /api/v1/admin/properties/stats
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

**Response**: 200 OK
```json
{
  "totalProperties": 150,
  "pendingApprovals": 8,
  "totalValuation": 500000000000,
  "statusBreakdown": {
    "DRAFT": {
      "count": 20,
      "totalValuation": 50000000000
    },
    "PENDING_APPROVAL": {
      "count": 8,
      "totalValuation": 20000000000
    },
    "LIVE": {
      "count": 45,
      "totalValuation": 150000000000
    },
    "FUNDED": {
      "count": 30,
      "totalValuation": 100000000000
    },
    "HOLDING": {
      "count": 25,
      "totalValuation": 90000000000
    },
    "SOLD": {
      "count": 15,
      "totalValuation": 60000000000
    },
    "REJECTED": {
      "count": 5,
      "totalValuation": 20000000000
    },
    "CANCELLED": {
      "count": 2,
      "totalValuation": 10000000000
    }
  },
  "recentProperties": [
    {
      "_id": "...",
      "title": "New Apartment Listing",
      "status": "PENDING_APPROVAL",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "brokerId": {
        "name": "John Broker",
        "email": "john@example.com"
      }
    }
  ]
}
```

**Use Cases**:
- Admin dashboard overview
- Quick view of pending approvals
- Total valuation across all properties
- Status distribution analytics
- Recent activity monitoring

---

## Property Lifecycle State Machine

```
┌──────────┐
│  DRAFT   │ ◄─────────────────┐
└────┬─────┘                   │
     │                         │
     │ Broker submits          │
     ▼                         │
┌──────────────────┐           │
│ PENDING_APPROVAL │           │
└────┬─────────────┘           │
     │                         │
┌────┴─────┐                   │
│          │                   │
│ Admin    │                   │
│ Reviews  │                   │
│          │                   │
└────┬─────┘                   │
     │                         │
 ┌───┴────┐                    │
 │        │                    │
 ▼        ▼                    │
┌────┐  ┌──────────┐           │
│LIVE│  │ REJECTED │───────────┘
└─┬──┘  └──────────┘
  │
  │ Units being sold
  │ (unitsSold < totalUnits)
  │
  ▼
┌────────┐
│ FUNDED │ (unitsSold = totalUnits)
└───┬────┘
    │
    │ Holding period starts
    ▼
┌──────────┐
│ HOLDING  │
└─────┬────┘
      │
      │ Holding period ends
      │ Property sold/liquidated
      ▼
┌──────────┐
│   SOLD   │ (Terminal)
└──────────┘

   At any point (except SOLD):
          │
          ▼
   ┌────────────┐
   │ CANCELLED  │ (Terminal)
   └────────────┘
```

---

## Authorization & Security

### Strict Admin-Only Access

All routes in this module require:
1. **Authentication**: Valid JWT token
2. **Authorization**: User role must be `ADMIN`

```javascript
// Applied to all routes in adminPropertyRoutes.js
router.use(authenticate);
router.use(authorize('ADMIN'));
```

### Security Features

- ✅ Server-side role validation (cannot be bypassed)
- ✅ JWT token verification on every request
- ✅ Active user check (deactivated users blocked)
- ✅ Ownership and permission validation
- ✅ Business rule enforcement
- ✅ Audit trail (approvedBy, timestamps)

---

## Business Logic Validations

### 1. Approval Validation
- Property must be in `PENDING_APPROVAL` status
- Records who approved and when
- Clears rejection reason

### 2. Rejection Validation
- Property must be in `PENDING_APPROVAL` status
- Requires meaningful rejection reason (min 10 chars)
- Allows broker to fix and resubmit

### 3. Status Change Validation
- Enforces valid state transitions
- Prevents moving to already-current status
- Terminal states (SOLD, CANCELLED) cannot be changed
- Special rules for FUNDED (units check)
- Special rules for SOLD (must come from HOLDING)
- Special rules for CANCELLED (no active investments)

### 4. Data Integrity
- Timestamps recorded for key lifecycle events
- Admin ID tracked for accountability
- Validation prevents data corruption
- Atomic operations with MongoDB

---

## Testing Examples

### Test as Admin

#### 1. Login as Admin
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin@123"
  }'
```

Save the `accessToken` for subsequent requests.

#### 2. View All Properties
```bash
curl http://localhost:5000/api/v1/admin/properties \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

#### 3. View Pending Approvals
```bash
curl "http://localhost:5000/api/v1/admin/properties?status=PENDING_APPROVAL" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

#### 4. Approve a Property
```bash
curl -X PATCH http://localhost:5000/api/v1/admin/properties/PROPERTY_ID/approve \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

#### 5. Reject a Property
```bash
curl -X PATCH http://localhost:5000/api/v1/admin/properties/PROPERTY_ID/reject \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "rejectionReason": "Property documents are incomplete. Please upload title deed."
  }'
```

#### 6. Change Status to FUNDED
```bash
curl -X PATCH http://localhost:5000/api/v1/admin/properties/PROPERTY_ID/status \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "FUNDED",
    "notes": "All units sold"
  }'
```

#### 7. Get Dashboard Statistics
```bash
curl http://localhost:5000/api/v1/admin/properties/stats \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

## Error Handling

All endpoints return consistent error responses:

**401 Unauthorized** - Not authenticated
```json
{
  "message": "Authentication required"
}
```

**403 Forbidden** - Not an admin
```json
{
  "message": "Forbidden"
}
```

**400 Bad Request** - Validation or business rule error
```json
{
  "message": "Cannot approve property with status DRAFT. Only PENDING_APPROVAL properties can be approved."
}
```

**404 Not Found** - Property doesn't exist
```json
{
  "message": "Property not found"
}
```

**500 Internal Server Error** - Server error
```json
{
  "message": "Unable to approve property"
}
```

---

## Integration with Stage 3

Stage 4 builds on Stage 3 property management:

| Stage | Responsibility |
|-------|----------------|
| **Stage 3** | Broker creates, updates, submits properties |
| **Stage 4** | Admin reviews, approves/rejects, manages lifecycle |

**Complete Flow**:
1. Broker creates property (Stage 3) → DRAFT
2. Broker submits for approval (Stage 3) → PENDING_APPROVAL
3. Admin reviews in admin panel (Stage 4)
4. Admin approves (Stage 4) → LIVE
5. Public can view and invest (Stage 3 public endpoints)
6. Admin transitions status as needed (Stage 4) → FUNDED → HOLDING → SOLD

---

## Notes

### Currency Format
- All monetary values in integer paise
- ₹1 = 100 paise
- Example: totalValuation: 500000000000 = ₹5,000 Crore

### Timestamps
- `approvedAt` - When property was approved
- `listedAt` - When property went live
- `fundedAt` - When all units were sold
- `soldAt` - When property was liquidated

### Audit Trail
- `approvedBy` - Admin user who approved
- Status change history can be tracked via timestamps
- Consider adding statusHistory array for full audit trail

---

## Next Steps (Stage 5)

With Stage 4 complete, you're ready for:
- Investment functionality (buying units)
- Payment integration
- Wallet system
- Commission calculations
- Payout distribution

---

## Summary

Stage 4 provides complete admin control over:
✅ Property approval workflow  
✅ Property rejection with feedback  
✅ Lifecycle status management  
✅ Business rule enforcement  
✅ Dashboard statistics  
✅ Comprehensive filtering and search  
✅ Full audit trail  
