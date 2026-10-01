# Stage 3: Property Backend & Lifecycle - Documentation

## Overview
Stage 3 implements the complete property management system with CRUD operations, validation, filtering, and lifecycle state management.

---

## Files Created

1. **server/src/validators/propertyValidator.js** - Zod validation schemas
2. **server/src/controllers/propertyController.js** - Business logic and controllers
3. **server/src/routes/propertyRoutes.js** - Route definitions with middleware
4. **server/src/server.js** - Updated to include property routes

---

## API Endpoints

### 1. Create Property Draft
**POST** `/api/v1/properties`

**Access**: BROKER, ADMIN (requires authentication)

**Request Body**:
```json
{
  "title": "Luxury Apartment in Downtown",
  "description": "Beautiful 3BHK apartment with modern amenities and great city views",
  "type": "APARTMENT",
  "address": "123 Main Street, Building A, Floor 5",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "areaSqft": 1500,
  "valuation": 1000000000,
  "totalUnits": 100,
  "minUnits": 1,
  "expectedAppreciationPct": 15.5,
  "rentalYieldPct": 4.2,
  "holdingPeriodMonths": 36,
  "images": [
    {
      "url": "https://example.com/image1.jpg",
      "publicId": "prop_img_1",
      "name": "Living Room"
    }
  ],
  "documents": [
    {
      "url": "https://example.com/doc1.pdf",
      "publicId": "prop_doc_1",
      "name": "Title Deed"
    }
  ]
}
```

**Response**: 201 Created
```json
{
  "message": "Property draft created successfully",
  "property": {
    "_id": "...",
    "title": "Luxury Apartment in Downtown",
    "status": "DRAFT",
    "brokerId": "...",
    "unitPrice": 10000000,
    "unitsSold": 0,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Notes**:
- Property is created in `DRAFT` status
- `brokerId` is automatically set to the authenticated user's ID
- `unitPrice` is calculated server-side as `valuation / totalUnits`
- Valuation must divide cleanly by totalUnits (no fractional paise)

---

### 2. List Properties (Marketplace)
**GET** `/api/v1/properties`

**Access**: Public (no authentication required)

**Query Parameters**:
- `city` (string, optional) - Filter by city (case-insensitive)
- `type` (string, optional) - Filter by type: APARTMENT, VILLA, COMMERCIAL, PLOT, WAREHOUSE
- `minPrice` (number, optional) - Minimum unit price in paise
- `maxPrice` (number, optional) - Maximum unit price in paise
- `status` (string, optional) - Filter by status (default: LIVE, FUNDED)
- `search` (string, optional) - Search in title, description, city, address
- `sort` (string, optional) - Sort field: createdAt, -createdAt, valuation, -valuation, unitPrice, -unitPrice (default: -createdAt)
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Items per page (default: 20)

**Example Request**:
```
GET /api/v1/properties?city=Mumbai&type=APARTMENT&minPrice=5000000&maxPrice=20000000&page=1&limit=10&sort=-valuation
```

**Response**: 200 OK
```json
{
  "properties": [
    {
      "_id": "...",
      "title": "Luxury Apartment in Downtown",
      "description": "...",
      "type": "APARTMENT",
      "city": "Mumbai",
      "valuation": 1000000000,
      "totalUnits": 100,
      "unitPrice": 10000000,
      "unitsSold": 45,
      "status": "LIVE",
      "brokerId": {
        "_id": "...",
        "name": "John Broker",
        "email": "john@example.com"
      },
      "images": [...],
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Notes**:
- By default, only shows properties with status `LIVE` or `FUNDED`
- Populates broker information (name, email)
- Supports full-text search across multiple fields

---

### 3. Get Property Details
**GET** `/api/v1/properties/:id`

**Access**: Public (no authentication required)

**Response**: 200 OK
```json
{
  "property": {
    "_id": "...",
    "title": "Luxury Apartment in Downtown",
    "description": "...",
    "type": "APARTMENT",
    "address": "123 Main Street, Building A, Floor 5",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "areaSqft": 1500,
    "valuation": 1000000000,
    "totalUnits": 100,
    "unitPrice": 10000000,
    "minUnits": 1,
    "unitsSold": 45,
    "expectedAppreciationPct": 15.5,
    "rentalYieldPct": 4.2,
    "holdingPeriodMonths": 36,
    "status": "LIVE",
    "brokerId": {
      "_id": "...",
      "name": "John Broker",
      "email": "john@example.com",
      "phone": "+91XXXXXXXXXX"
    },
    "approvedBy": {
      "_id": "...",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "images": [...],
    "documents": [...],
    "fundingPct": 45.00,
    "investorCount": 12,
    "unitsAvailable": 55,
    "listedAt": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Calculated Fields**:
- `fundingPct` - Percentage of units sold (unitsSold / totalUnits * 100)
- `investorCount` - Unique number of active investors
- `unitsAvailable` - Remaining units (totalUnits - unitsSold)

---

### 4. Update Property
**PUT** `/api/v1/properties/:id`

**Access**: Owner broker or ADMIN (requires authentication)

**Request Body**: (all fields optional)
```json
{
  "title": "Updated Property Title",
  "description": "Updated description",
  "expectedAppreciationPct": 18.0,
  "images": [...]
}
```

**Response**: 200 OK
```json
{
  "message": "Property updated successfully",
  "property": { ... }
}
```

**Business Rules**:
- Only the property owner (broker) or an ADMIN can update
- Once property status is `LIVE`, `FUNDED`, `HOLDING`, or `SOLD`:
  - **Cannot modify**: `valuation`, `totalUnits`, `unitPrice`
  - **Can modify**: Other fields like description, images, etc.
- If both `valuation` and `totalUnits` are updated, `unitPrice` is recalculated automatically

**Error Response** (403):
```json
{
  "message": "Cannot modify valuation, totalUnits, or unitPrice once property is LIVE or beyond"
}
```

---

### 5. Submit Property for Approval
**POST** `/api/v1/properties/:id/submit`

**Access**: Owner broker only (requires authentication)

**Request Body**: None

**Response**: 200 OK
```json
{
  "message": "Property submitted for approval successfully",
  "property": {
    "_id": "...",
    "status": "PENDING_APPROVAL",
    ...
  }
}
```

**Business Rules**:
- Only properties with status `DRAFT` or `REJECTED` can be submitted
- Only the property owner can submit (not ADMIN)
- Validates minimum required fields are present
- Requires at least 3 images

**Validation Errors**:

Missing fields (400):
```json
{
  "message": "Missing required fields",
  "missingFields": ["description", "areaSqft"]
}
```

Insufficient images (400):
```json
{
  "message": "At least 3 property images are required for submission"
}
```

Invalid status (400):
```json
{
  "message": "Cannot submit property with status LIVE. Only DRAFT or REJECTED properties can be submitted."
}
```

---

## Property Lifecycle States

```
DRAFT → PENDING_APPROVAL → LIVE → FUNDED → HOLDING → SOLD
          ↓
      REJECTED (can go back to PENDING_APPROVAL)
          ↓
      CANCELLED
```

### State Definitions:

- **DRAFT**: Initial state when broker creates property
- **PENDING_APPROVAL**: Broker has submitted for admin review
- **LIVE**: Admin approved, property is on marketplace
- **FUNDED**: All units are sold
- **HOLDING**: Property is held for the holding period
- **SOLD**: Property is liquidated, payouts distributed
- **REJECTED**: Admin rejected the property
- **CANCELLED**: Property was cancelled

---

## Validation Rules

### Property Types
- APARTMENT
- VILLA
- COMMERCIAL
- PLOT
- WAREHOUSE

### Required Fields for Creation
- title (5-200 chars)
- description (20-5000 chars)
- type (enum)
- address (10-500 chars)
- city (2-100 chars)
- state (2-100 chars)
- pincode (6 digits)
- areaSqft (integer, min 1)
- valuation (integer paise, min 1)
- totalUnits (integer, min 1)
- minUnits (integer, min 1)

### Business Validations
1. **Clean Division**: `valuation % totalUnits === 0` (no fractional paise per unit)
2. **Min/Max Units**: `minUnits <= totalUnits`
3. **Pincode Format**: Exactly 6 digits
4. **Positive Values**: All monetary and numeric values must be positive
5. **Image URLs**: Must be valid URLs
6. **Submission Requirements**: At least 3 images required

---

## Authorization Matrix

| Endpoint | Public | INVESTOR | BROKER | ADMIN |
|----------|--------|----------|--------|-------|
| GET /properties | ✅ | ✅ | ✅ | ✅ |
| GET /properties/:id | ✅ | ✅ | ✅ | ✅ |
| POST /properties | ❌ | ❌ | ✅ | ✅ |
| PUT /properties/:id | ❌ | ❌ | ✅ (owner) | ✅ |
| POST /properties/:id/submit | ❌ | ❌ | ✅ (owner) | ❌ |

---

## Error Handling

All endpoints return consistent error responses:

**400 Bad Request** - Validation errors
```json
{
  "message": "Validation failed",
  "errors": {
    "title": ["Title must be at least 5 characters"],
    "valuation": ["Valuation must divide evenly by total units"]
  }
}
```

**401 Unauthorized** - Missing or invalid authentication
```json
{
  "message": "Authentication required"
}
```

**403 Forbidden** - Insufficient permissions
```json
{
  "message": "You are not authorized to update this property"
}
```

**404 Not Found** - Property doesn't exist
```json
{
  "message": "Property not found"
}
```

**500 Internal Server Error** - Server errors
```json
{
  "message": "Unable to create property"
}
```

---

## Testing Examples

### Create a Property (as BROKER)
```bash
curl -X POST http://localhost:5000/api/v1/properties \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Modern Villa in Goa",
    "description": "Spacious 4BHK villa with pool and garden",
    "type": "VILLA",
    "address": "Beach Road, Anjuna",
    "city": "Goa",
    "state": "Goa",
    "pincode": "403509",
    "areaSqft": 3000,
    "valuation": 5000000000,
    "totalUnits": 200,
    "minUnits": 5,
    "expectedAppreciationPct": 20,
    "rentalYieldPct": 5,
    "holdingPeriodMonths": 48,
    "images": [
      {"url": "https://example.com/villa1.jpg", "name": "Front View"},
      {"url": "https://example.com/villa2.jpg", "name": "Pool"},
      {"url": "https://example.com/villa3.jpg", "name": "Garden"}
    ]
  }'
```

### List Properties with Filters
```bash
curl "http://localhost:5000/api/v1/properties?city=Mumbai&type=APARTMENT&minPrice=5000000&page=1&limit=10"
```

### Get Property Details
```bash
curl http://localhost:5000/api/v1/properties/PROPERTY_ID
```

### Update Property
```bash
curl -X PUT http://localhost:5000/api/v1/properties/PROPERTY_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description with more details",
    "expectedAppreciationPct": 22.5
  }'
```

### Submit for Approval
```bash
curl -X POST http://localhost:5000/api/v1/properties/PROPERTY_ID/submit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Key Implementation Details

### Server-Side Calculations
- `unitPrice` is always calculated as `valuation / totalUnits`
- `fundingPct` is calculated dynamically in GET endpoints
- `investorCount` is fetched from Investment collection
- `unitsAvailable` is calculated as `totalUnits - unitsSold`

### Database Queries Optimization
- Indexed fields: `city`, `status`, `brokerId`, `city+status`, `brokerId+status`
- Lean queries for list endpoints (better performance)
- Population of related documents (broker, approver info)
- Efficient counting with separate countDocuments query

### Security Features
- Bearer token authentication for protected routes
- Role-based authorization (BROKER, ADMIN)
- Ownership verification for updates
- Status-based field immutability
- Input validation with Zod

---

## Next Steps (Future Stages)

Stage 4 will likely include:
- Admin approval/rejection endpoints
- Investment endpoints (buy units)
- Property status transitions (LIVE → FUNDED → SOLD)
- Payout distribution system
- Transaction ledger integration

---

## Notes

- All monetary values are stored in **paise** (integer) to avoid floating-point precision issues
- ₹1 = 100 paise
- Example: ₹10,00,000 = 1000000000 paise
- The property model's pre-validation hook also ensures unitPrice calculation consistency
