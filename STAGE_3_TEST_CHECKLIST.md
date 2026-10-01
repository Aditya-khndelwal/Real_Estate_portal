# Stage 3 Testing Checklist

## Prerequisites
- [ ] MongoDB is running
- [ ] Environment variables are configured (.env file with MONGODB_URI, JWT_SECRET)
- [ ] Server is running (`npm run dev` from server directory)
- [ ] You have created test users (1 BROKER, 1 ADMIN, 1 INVESTOR)

---

## Test Scenarios

### 1. Authentication Setup
- [ ] Login as BROKER and save JWT token
- [ ] Login as ADMIN and save JWT token
- [ ] Login as INVESTOR and save JWT token (for authorization tests)

---

### 2. Create Property (as BROKER)

**Test Case 2.1**: Create valid property draft
- [ ] POST /api/v1/properties with valid data
- [ ] Verify response status 201
- [ ] Verify status is "DRAFT"
- [ ] Verify brokerId matches your user ID
- [ ] Verify unitPrice is calculated (valuation / totalUnits)

**Test Case 2.2**: Create property with invalid data
- [ ] Missing required fields → Expect 400
- [ ] Password less than 5 chars → Expect 400
- [ ] Valuation not divisible by totalUnits → Expect 400
- [ ] minUnits > totalUnits → Expect 400
- [ ] Invalid pincode format → Expect 400

**Test Case 2.3**: Authorization checks
- [ ] Try to create property without authentication → Expect 401
- [ ] Try to create property as INVESTOR → Expect 403

---

### 3. List Properties (Public Access)

**Test Case 3.1**: Basic listing
- [ ] GET /api/v1/properties without filters
- [ ] Verify pagination metadata is present
- [ ] Verify only LIVE/FUNDED properties are shown by default

**Test Case 3.2**: Filtering
- [ ] Filter by city: ?city=Mumbai
- [ ] Filter by type: ?type=APARTMENT
- [ ] Filter by price range: ?minPrice=5000000&maxPrice=20000000
- [ ] Filter by status: ?status=DRAFT (should work for testing)
- [ ] Search: ?search=luxury

**Test Case 3.3**: Pagination & Sorting
- [ ] Test pagination: ?page=2&limit=5
- [ ] Sort by valuation ascending: ?sort=valuation
- [ ] Sort by valuation descending: ?sort=-valuation
- [ ] Sort by creation date: ?sort=-createdAt

---

### 4. Get Property Details (Public Access)

**Test Case 4.1**: Valid property
- [ ] GET /api/v1/properties/:id
- [ ] Verify calculated fields: fundingPct, investorCount, unitsAvailable
- [ ] Verify broker info is populated
- [ ] Verify all property details are present

**Test Case 4.2**: Invalid property
- [ ] GET with non-existent ID → Expect 404
- [ ] GET with invalid ObjectId format → Expect 400

---

### 5. Update Property

**Test Case 5.1**: Update as owner broker
- [ ] PUT /api/v1/properties/:id with updated description
- [ ] Verify response status 200
- [ ] Verify changes are saved

**Test Case 5.2**: Update as ADMIN
- [ ] PUT /api/v1/properties/:id as ADMIN user
- [ ] Verify ADMIN can update any property

**Test Case 5.3**: Authorization checks
- [ ] Try to update without authentication → Expect 401
- [ ] Try to update another broker's property → Expect 403
- [ ] Try to update as INVESTOR → Expect 403

**Test Case 5.4**: Immutability rules
- [ ] Create property and manually change status to LIVE (or use MongoDB directly)
- [ ] Try to update valuation → Expect 403
- [ ] Try to update totalUnits → Expect 403
- [ ] Try to update unitPrice → Expect 403
- [ ] Verify other fields can still be updated

**Test Case 5.5**: Validation on update
- [ ] Update with new valuation and totalUnits that don't divide cleanly → Expect 400
- [ ] Update minUnits > totalUnits → Expect 400

---

### 6. Submit Property for Approval

**Test Case 6.1**: Valid submission
- [ ] Create property with all required fields and 3+ images
- [ ] POST /api/v1/properties/:id/submit
- [ ] Verify status changes to PENDING_APPROVAL
- [ ] Verify rejectionReason is cleared (if previously rejected)

**Test Case 6.2**: Missing required data
- [ ] Create property without description
- [ ] Try to submit → Expect 400 with missingFields array

**Test Case 6.3**: Insufficient images
- [ ] Create property with only 2 images
- [ ] Try to submit → Expect 400 (need at least 3 images)

**Test Case 6.4**: Invalid status transitions
- [ ] Manually change property status to LIVE
- [ ] Try to submit → Expect 400 (only DRAFT/REJECTED can be submitted)

**Test Case 6.5**: Authorization checks
- [ ] Try to submit without authentication → Expect 401
- [ ] Try to submit another broker's property → Expect 403
- [ ] Try to submit as ADMIN → Expect 403 (only owner broker can submit)

---

## Sample Test Data

### Valid Property Creation Payload
```json
{
  "title": "Luxury Apartment in Bandra",
  "description": "Beautiful 3BHK apartment with modern amenities, gym, pool, and 24/7 security. Great location near Bandra station.",
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
    {
      "url": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00",
      "name": "Living Room"
    },
    {
      "url": "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2",
      "name": "Kitchen"
    },
    {
      "url": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
      "name": "Bedroom"
    }
  ],
  "documents": [
    {
      "url": "https://example.com/title-deed.pdf",
      "name": "Title Deed"
    }
  ]
}
```

---

## Edge Cases to Test

### Boundary Values
- [ ] areaSqft = 1 (minimum)
- [ ] minUnits = 1 (minimum)
- [ ] totalUnits = 1
- [ ] valuation = 1 paise
- [ ] title with exactly 5 characters
- [ ] title with 200 characters
- [ ] description with 20 characters
- [ ] pincode with exactly 6 digits

### Special Characters
- [ ] Title with special characters
- [ ] Search query with special regex characters
- [ ] Address with unicode characters (Indian language)

### Large Numbers
- [ ] Very large valuation (10 crore = 1000000000000 paise)
- [ ] Large number of total units (10000)
- [ ] Many images (20+)

---

## Performance Tests

- [ ] List 100+ properties with pagination
- [ ] Search with very long search query
- [ ] Filter with multiple conditions
- [ ] Concurrent create requests

---

## Database Verification

After each test, optionally verify in MongoDB:
- [ ] Property documents are created correctly
- [ ] brokerId references are correct
- [ ] Calculated unitPrice matches valuation/totalUnits
- [ ] Status transitions are recorded
- [ ] Timestamps (createdAt, updatedAt) are set

---

## Common Issues & Solutions

**Issue**: 401 Unauthorized
- Solution: Check if JWT token is included in Authorization header
- Format: `Bearer YOUR_JWT_TOKEN`

**Issue**: 403 Forbidden
- Solution: Verify user role matches required permission
- Check if trying to update another user's property

**Issue**: 400 Validation failed
- Solution: Check error response for specific field errors
- Ensure all required fields are present
- Verify data types match schema

**Issue**: Cannot modify valuation once LIVE
- Solution: This is expected behavior for data integrity
- Only test with DRAFT properties for valuation changes

---

## Success Criteria

✅ All CRUD operations work correctly
✅ Authorization rules are enforced
✅ Validation catches all invalid inputs
✅ Calculated fields are accurate
✅ Pagination and filtering work correctly
✅ Property lifecycle transitions are controlled
✅ Error messages are clear and helpful

---

## Next Steps After Testing

Once Stage 3 is verified:
1. Document any bugs or issues found
2. Consider edge cases for improvement
3. Ready for Stage 4 (Admin Approval & Investment)
