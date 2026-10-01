# Stage 4 Testing Checklist

## Prerequisites
- [ ] MongoDB is running
- [ ] Server is running (`npm run dev`)
- [ ] You have created test users:
  - [ ] At least one ADMIN user
  - [ ] At least one BROKER user
  - [ ] At least one INVESTOR user
- [ ] You have properties in various states for testing

---

## Test Setup

### Create Admin User
Since ADMIN cannot self-register, create one directly in MongoDB:

```javascript
// MongoDB Shell or Compass
db.users.insertOne({
  name: "Admin User",
  email: "admin@test.com",
  phone: "9999999999",
  // Password: Admin@123 (hashed with bcrypt cost 11)
  passwordHash: "$2a$11$YourHashedPasswordHere",
  role: "ADMIN",
  isActive: true,
  brokerApproved: false,
  kyc: { status: "NOT_SUBMITTED" },
  createdAt: new Date(),
  updatedAt: new Date()
})
```

Or use this helper to hash the password:
```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('Admin@123', 11);
console.log(hash);
```

### Create Test Properties
1. [ ] Login as broker
2. [ ] Create 3-4 properties
3. [ ] Submit 2 for approval (status: PENDING_APPROVAL)
4. [ ] Leave 1-2 in DRAFT

---

## Test Scenarios

### 1. Authentication & Authorization

**Test Case 1.1**: Admin can access admin routes
- [ ] Login as ADMIN
- [ ] GET /api/v1/admin/properties → Expect 200
- [ ] Verify properties are returned

**Test Case 1.2**: Non-admin cannot access admin routes
- [ ] Login as BROKER
- [ ] GET /api/v1/admin/properties → Expect 403
- [ ] Login as INVESTOR
- [ ] GET /api/v1/admin/properties → Expect 403

**Test Case 1.3**: Unauthenticated requests fail
- [ ] GET /api/v1/admin/properties (no token) → Expect 401
- [ ] PATCH /api/v1/admin/properties/:id/approve (no token) → Expect 401

---

### 2. List All Properties (Admin View)

**Test Case 2.1**: List all properties without filters
- [ ] GET /api/v1/admin/properties
- [ ] Verify all properties are returned (including DRAFT, REJECTED, etc.)
- [ ] Verify pagination metadata is present
- [ ] Verify broker info is populated

**Test Case 2.2**: Filter by status
- [ ] GET ?status=PENDING_APPROVAL
- [ ] Verify only PENDING_APPROVAL properties returned
- [ ] GET ?status=DRAFT
- [ ] Verify only DRAFT properties returned

**Test Case 2.3**: Filter by multiple statuses
- [ ] GET ?status=PENDING_APPROVAL,LIVE
- [ ] Verify both PENDING_APPROVAL and LIVE properties returned

**Test Case 2.4**: Filter by broker
- [ ] GET ?brokerId=BROKER_USER_ID
- [ ] Verify only that broker's properties returned

**Test Case 2.5**: Filter by city
- [ ] GET ?city=Mumbai
- [ ] Verify only Mumbai properties returned
- [ ] Test case-insensitive: ?city=mumbai

**Test Case 2.6**: Search functionality
- [ ] GET ?search=luxury
- [ ] Verify properties matching search term returned
- [ ] Check search works across title, description, city, address

**Test Case 2.7**: Pagination
- [ ] GET ?page=1&limit=5
- [ ] Verify exactly 5 properties returned
- [ ] Verify hasNextPage is true if more exist
- [ ] GET ?page=2&limit=5
- [ ] Verify next page returned

**Test Case 2.8**: Sorting
- [ ] GET ?sort=createdAt (ascending)
- [ ] GET ?sort=-createdAt (descending, default)
- [ ] GET ?sort=valuation
- [ ] Verify proper sort order

---

### 3. Approve Property

**Test Case 3.1**: Approve valid property
- [ ] Create property as broker
- [ ] Submit for approval → PENDING_APPROVAL
- [ ] As admin: PATCH /:id/approve
- [ ] Verify response status 200
- [ ] Verify status changed to LIVE
- [ ] Verify approvedBy is set to admin's ID
- [ ] Verify approvedAt timestamp is set
- [ ] Verify listedAt timestamp is set
- [ ] Verify rejectionReason is cleared (if previously rejected)

**Test Case 3.2**: Cannot approve non-pending property
- [ ] Try to approve DRAFT property → Expect 400
- [ ] Try to approve LIVE property → Expect 400
- [ ] Try to approve REJECTED property → Expect 400
- [ ] Verify error message explains the issue

**Test Case 3.3**: Property not found
- [ ] PATCH /approve with invalid ID → Expect 404
- [ ] PATCH /approve with non-existent ID → Expect 404

**Test Case 3.4**: Verify property is now in public marketplace
- [ ] After approval, GET /api/v1/properties (public endpoint)
- [ ] Verify approved property appears in list

---

### 4. Reject Property

**Test Case 4.1**: Reject with valid reason
- [ ] Create property and submit as broker
- [ ] As admin: PATCH /:id/reject with rejectionReason
- [ ] Verify response status 200
- [ ] Verify status changed to REJECTED
- [ ] Verify rejectionReason is saved
- [ ] Verify broker can see rejection reason

**Test Case 4.2**: Missing rejection reason
- [ ] PATCH /:id/reject without body → Expect 400
- [ ] PATCH /:id/reject with empty string → Expect 400
- [ ] Verify error message indicates reason is required

**Test Case 4.3**: Rejection reason too short
- [ ] PATCH /:id/reject with reason: "Bad" (< 10 chars) → Expect 400
- [ ] Verify error message indicates minimum length

**Test Case 4.4**: Cannot reject non-pending property
- [ ] Try to reject DRAFT property → Expect 400
- [ ] Try to reject LIVE property → Expect 400
- [ ] Verify error message explains the issue

**Test Case 4.5**: Broker can resubmit after rejection
- [ ] Admin rejects property
- [ ] As broker: fix issues
- [ ] POST /:id/submit → PENDING_APPROVAL
- [ ] Admin can approve again

---

### 5. Change Property Status

**Test Case 5.1**: Valid status transitions

DRAFT → PENDING_APPROVAL:
- [ ] Property in DRAFT
- [ ] PATCH /:id/status with status: PENDING_APPROVAL
- [ ] Verify status changed

PENDING_APPROVAL → LIVE:
- [ ] Property in PENDING_APPROVAL
- [ ] PATCH /:id/status with status: LIVE
- [ ] Verify status changed to LIVE
- [ ] Verify listedAt and approvedAt set

LIVE → FUNDED:
- [ ] Property in LIVE with unitsSold = totalUnits
- [ ] PATCH /:id/status with status: FUNDED
- [ ] Verify status changed
- [ ] Verify fundedAt timestamp set

FUNDED → HOLDING:
- [ ] Property in FUNDED
- [ ] PATCH /:id/status with status: HOLDING
- [ ] Verify status changed

HOLDING → SOLD:
- [ ] Property in HOLDING
- [ ] PATCH /:id/status with status: SOLD
- [ ] Verify status changed
- [ ] Verify soldAt timestamp set

**Test Case 5.2**: Invalid status transitions

- [ ] DRAFT → LIVE (skip PENDING_APPROVAL) → Expect 400
- [ ] LIVE → HOLDING (skip FUNDED) → Expect 400
- [ ] FUNDED → SOLD (skip HOLDING) → Expect 400
- [ ] SOLD → any status → Expect 400 (terminal state)
- [ ] CANCELLED → any status → Expect 400 (terminal state)

**Test Case 5.3**: Already in requested status
- [ ] Property in LIVE
- [ ] PATCH /:id/status with status: LIVE → Expect 400
- [ ] Verify error message indicates already in status

**Test Case 5.4**: Invalid status value
- [ ] PATCH /:id/status with status: INVALID → Expect 400
- [ ] Verify error lists valid statuses

**Test Case 5.5**: FUNDED validation (units check)
- [ ] Property in LIVE with unitsSold < totalUnits
- [ ] PATCH /:id/status with status: FUNDED → Expect 400
- [ ] Verify error message shows units sold vs total
- [ ] Manually set unitsSold = totalUnits
- [ ] Try again → Expect 200

**Test Case 5.6**: SOLD validation (must be from HOLDING)
- [ ] Property in FUNDED
- [ ] PATCH /:id/status with status: SOLD → Expect 400
- [ ] Verify error requires HOLDING status first

**Test Case 5.7**: CANCELLED validation (active investments check)
- [ ] Property with active investments
- [ ] PATCH /:id/status with status: CANCELLED → Expect 400
- [ ] Verify error shows active investment count
- [ ] Property without active investments
- [ ] PATCH /:id/status with status: CANCELLED → Expect 200

**Test Case 5.8**: Notes parameter
- [ ] PATCH /:id/status with notes field
- [ ] Verify request succeeds
- [ ] Check console logs for notes (or implement statusHistory)

---

### 6. Get Property Statistics

**Test Case 6.1**: Basic stats retrieval
- [ ] GET /api/v1/admin/properties/stats
- [ ] Verify response status 200
- [ ] Verify totalProperties count is correct
- [ ] Verify pendingApprovals count is correct
- [ ] Verify totalValuation is calculated

**Test Case 6.2**: Status breakdown
- [ ] Verify statusBreakdown contains all statuses
- [ ] Verify counts match actual database
- [ ] Verify totalValuation per status is correct

**Test Case 6.3**: Recent properties
- [ ] Verify recentProperties array is present
- [ ] Verify contains max 5 properties
- [ ] Verify sorted by creation date (newest first)
- [ ] Verify broker info is populated

**Test Case 6.4**: Empty database
- [ ] Delete all properties (test database)
- [ ] GET /stats
- [ ] Verify returns zeroes gracefully

---

### 7. Complete Workflow Tests

**Test Case 7.1**: Complete approval workflow
1. [ ] Broker creates property → DRAFT
2. [ ] Broker submits → PENDING_APPROVAL
3. [ ] Admin lists pending → Sees property
4. [ ] Admin approves → LIVE
5. [ ] Public can see property
6. [ ] Units get sold (Stage 5)
7. [ ] Admin changes to FUNDED
8. [ ] Admin changes to HOLDING
9. [ ] Admin changes to SOLD
10. [ ] Verify all timestamps are set

**Test Case 7.2**: Rejection and resubmission workflow
1. [ ] Broker creates and submits property
2. [ ] Admin rejects with reason
3. [ ] Broker sees rejection reason
4. [ ] Broker updates property
5. [ ] Broker resubmits
6. [ ] Admin approves
7. [ ] Verify rejection reason is cleared

**Test Case 7.3**: Cancellation workflow
1. [ ] Property is LIVE
2. [ ] No investments yet
3. [ ] Admin cancels → CANCELLED
4. [ ] Verify cannot transition from CANCELLED
5. [ ] Verify terminal state behavior

---

### 8. Edge Cases

**Test Case 8.1**: Concurrent admin actions
- [ ] Two admins try to approve same property simultaneously
- [ ] Verify only one succeeds
- [ ] Verify proper error for the second

**Test Case 8.2**: Very large datasets
- [ ] Create 1000+ properties
- [ ] Test pagination performance
- [ ] Test filter performance
- [ ] Test stats calculation time

**Test Case 8.3**: Special characters
- [ ] Rejection reason with special characters
- [ ] Search with regex special characters
- [ ] Verify proper escaping

**Test Case 8.4**: Invalid property IDs
- [ ] Invalid ObjectId format → Expect 400
- [ ] Non-existent ObjectId → Expect 404

---

## Integration Tests

### Integration 8.1: Stage 3 + Stage 4
- [ ] Broker uses Stage 3 endpoints to create property
- [ ] Admin uses Stage 4 endpoints to approve
- [ ] Public uses Stage 3 endpoints to view
- [ ] Verify seamless integration

### Integration 8.2: Multi-user scenario
- [ ] Multiple brokers create properties
- [ ] Admin filters by specific broker
- [ ] Admin approves/rejects selectively
- [ ] Verify each broker only sees their own in broker view
- [ ] Verify admin sees all in admin view

---

## Database Verification

After key operations, verify in MongoDB:

**After Approval**:
- [ ] status = "LIVE"
- [ ] approvedBy is set to admin ObjectId
- [ ] approvedAt is set to recent timestamp
- [ ] listedAt is set to recent timestamp

**After Rejection**:
- [ ] status = "REJECTED"
- [ ] rejectionReason is set
- [ ] approvedBy is not modified

**After Status Change**:
- [ ] status matches requested status
- [ ] Appropriate timestamps are set
- [ ] Related fields are updated

---

## Security Tests

**Test Case S.1**: Authorization bypass attempts
- [ ] Try to access admin routes with broker token → 403
- [ ] Try to access admin routes with investor token → 403
- [ ] Try to access admin routes with expired token → 401
- [ ] Try to access admin routes with invalid token → 401

**Test Case S.2**: Role manipulation
- [ ] Cannot change role via API
- [ ] JWT payload tampering is detected
- [ ] Server validates role from database

**Test Case S.3**: SQL/NoSQL injection
- [ ] Try injection in search query
- [ ] Try injection in status filter
- [ ] Try injection in rejection reason
- [ ] Verify all are properly escaped/validated

---

## Performance Tests

- [ ] List 1000 properties: < 200ms
- [ ] Approve property: < 150ms
- [ ] Reject property: < 150ms
- [ ] Change status: < 150ms
- [ ] Get stats: < 300ms (includes aggregation)

---

## Success Criteria

✅ All admin routes require ADMIN role  
✅ Approval/rejection workflow works correctly  
✅ Status transitions follow business rules  
✅ Validation prevents invalid operations  
✅ Timestamps and audit fields are set  
✅ Error messages are clear and helpful  
✅ Filtering and pagination work efficiently  
✅ Statistics are calculated accurately  
✅ Integration with Stage 3 is seamless  

---

## Common Issues & Solutions

**Issue**: "Forbidden" when using admin routes
- Solution: Verify user role is "ADMIN" in database
- Check JWT token is for admin user
- Ensure authenticate and authorize middleware are applied

**Issue**: "Cannot approve property with status DRAFT"
- Solution: Property must be in PENDING_APPROVAL
- Broker needs to submit first using POST /:id/submit

**Issue**: "Cannot mark as FUNDED. Only X of Y units sold"
- Solution: This is correct validation
- Either wait for units to be sold or manually update for testing
- Update: `db.properties.updateOne({_id: ObjectId(...)}, {$set: {unitsSold: totalUnits}})`

**Issue**: Statistics show 0 for all counts
- Solution: Create test properties in various statuses
- Stats are calculated from actual database data

---

## Next Steps After Testing

Once Stage 4 is verified:
1. All admin controls are functional
2. Property lifecycle is fully managed
3. Ready for Stage 5 (Investment & Transactions)
4. Can build admin dashboard frontend
