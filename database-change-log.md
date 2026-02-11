# Database Change Log

## 2026-02-08 – Revenue Chart Data Query Pattern

### What Changed
- No schema changes
- New query pattern: Uses `storage.getAllDeals()` to fetch deals, then filters by stage and date in application layer
- Commission calculation: Uses `deal.commission` field or falls back to `deal.agreedPrice * 0.03`

### Why This Change Was Made
- **User Requirement:** Provide real revenue data from database
- **Data Integrity:** Uses existing Prisma storage layer (no raw SQL)
- **Flexibility:** Handles multiple date fields (closedAt, wonAt, updatedAt) as fallback

### Impact
- **Query Performance:** Current implementation acceptable for MVP, may need optimization for large datasets
- **Data Consistency:** Properly filters closed/won deals
- **Unicode Safety:** Month names handled as strings (UTF-8 safe)

### Notes / Trade-offs
- **Performance Consideration:** Loading all deals then filtering in JavaScript may be slow with 1000+ deals
- **Index Optimization:** Should verify indexes exist on `stage`, `closedAt`, `wonAt` fields for optimal performance
- **Commission Logic:** Fallback calculation (3% of agreedPrice) should be documented as business rule
- **Future Optimization:** Consider adding database-level date range filtering for better performance at scale
