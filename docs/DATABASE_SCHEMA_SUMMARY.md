# Database Schema Summary

This document lists the Prisma models, their fields, and key attributes inferred from `schema.prisma`. Field types include optional markers (`?`) and list markers (`[]`).

## accounts

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id |
| firstNameAr | String? |  |
| lastNameAr | String? |  |
| roleType | String? |  |
| accountIdType | String? |  |
| accountNumber | String | @unique |
| parentAccount | String? |  |
| usernameEn | String? |  |
| mobile | String? |  |
| createDate | DateTime? |  |
| expiryDate | DateTime? |  |
| status | String? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime |  |

## agent_profiles

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id |
| userId | String | @unique |
| organizationId | String? |  |
| licenseNo | String | @unique |
| licenseValidTo | DateTime |  |
| territories | String |  |
| isIndividualAgent | Boolean | @default(false) |
| status | AgentStatus | @default(PENDING_VERIFICATION) |
| specialties | String |  |
| experience | Int? |  |
| bio | String? |  |
| avatar | String? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime |  |
| organizations | organizations? | @relation(fields: [organizationId], references: [id]) |
| users | users | @relation(fields: [userId], references: [id]) |

## audit_logs

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id |
| userId | String |  |
| action | String |  |
| entity | String |  |
| entityId | String |  |
| beforeJson | String? |  |
| afterJson | String? |  |
| ipAddress | String? |  |
| userAgent | String? |  |
| createdAt | DateTime | @default(now()) |
| users | users | @relation(fields: [userId], references: [id]) |

## buyer_requests

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id |
| createdByUserId | String |  |
| city | String |  |
| type | String |  |
| minBedrooms | Int? |  |
| maxBedrooms | Int? |  |
| minPrice | Decimal? |  |
| maxPrice | Decimal? |  |
| contactPreferences | String |  |
| status | BuyerRequestStatus | @default(OPEN) |
| maskedContact | String |  |
| fullContactJson | String |  |
| multiAgentAllowed | Boolean | @default(false) |
| notes | String? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime |  |
| users | users | @relation(fields: [createdByUserId], references: [id]) |
| claims | claims[] |  |
| leads | leads[] |  |

## cities

| Field | Type | Attributes |
| --- | --- | --- |
| id | Int | @id |
| regionId | Int |  |
| nameAr | String |  |
| nameEn | String |  |
| centerLatitude | Decimal? |  |
| centerLongitude | Decimal? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime |  |
| regions | regions | @relation(fields: [regionId], references: [id]) |
| districts | districts[] |  |

## claims

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id |
| agentId | String |  |
| buyerRequestId | String |  |
| claimedAt | DateTime | @default(now()) |
| expiresAt | DateTime |  |
| status | ClaimStatus | @default(ACTIVE) |
| notes | String? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| users | users | @relation(fields: [agentId], references: [id]) |
| buyer_requests | buyer_requests | @relation(fields: [buyerRequestId], references: [id]) |

## contact_logs

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id |
| leadId | String |  |
| agentId | String |  |
| note | String |  |
| channel | ContactChannel |  |
| contactedAt | DateTime | @default(now()) |
| createdAt | DateTime | @default(now()) |
| users | users | @relation(fields: [agentId], references: [id]) |
| leads | leads | @relation(fields: [leadId], references: [id]) |

## districts

| Field | Type | Attributes |
| --- | --- | --- |
| id | BigInt | @id |
| regionId | Int |  |
| cityId | Int |  |
| nameAr | String |  |
| nameEn | String |  |
| boundary | Json? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime |  |
| cities | cities | @relation(fields: [cityId], references: [id]) |
| regions | regions | @relation(fields: [regionId], references: [id]) |

## file_assets

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id |
| ownerUserId | String? |  |
| organizationId | String? |  |
| entity | String |  |
| entityId | String |  |
| url | String |  |
| mime | String |  |
| size | Int |  |
| filename | String |  |
| createdAt | DateTime | @default(now()) |
| organizations | organizations? | @relation(fields: [organizationId], references: [id]) |
| users | users? | @relation(fields: [ownerUserId], references: [id]) |

## landing_page_contact_info

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id |
| type | String |  |
| label | String |  |
| value | String |  |
| icon | String |  |
| order | Int | @default(0) |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime |  |
| landingPageContentId | String |  |
| landing_page_content | landing_page_content | @relation(fields: [landingPageContentId], references: [id], onDelete: Cascade) |

## landing_page_content

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime |  |
| loadingText | String | @default("جار تحميل المحتوى...") |
| heroWelcomeText | String | @default("مرحباً بك في") |
| heroTitle | String | @default("منصة عقاراتي للوساطة العقارية") |
| heroSubtitle | String | @default("منصة شاملة لإدارة العقارات والوساطة العقارية مع أدوات تسويق متقدمة") |
| heroButton | String | @default("ابدأ رحلتك المجانية") |
| heroLoginButton | String | @default("تسجيل الدخول") |
| heroDashboardTitle | String | @default("منصة عقاراتي - لوحة التحكم") |
| featuresTitle | String | @default("لماذا تختار منصة عقاراتي؟") |
| featuresDescription | String | @default("عندما يجتمع التحديث بالاحترافية، تكون منصة عقاراتي هي الخيار الأمثل لإدارة عقاراتك بكفاءة") |
| solutionsTitle | String | @default("حلول شاملة لإدارة العقارات") |
| solutionsDescription | String | @default("أدوات متكاملة تساعدك في إدارة جميع جوانب أعمالك العقارية") |
| statsTitle | String | @default("أرقامنا تتحدث") |
| pricingTitle | String | @default("خطط الأسعار") |
| pricingSubtitle | String | @default("اختر الخطة المناسبة لك") |
| contactTitle | String | @default("تواصل معنا") |
| contactDescription | String | @default("نحن هنا لمساعدتك في رحلتك العقارية") |
| footerDescription | String | @default("منصة عقاراتي - الحل الشامل لإدارة العقارات والوساطة العقارية") |
| footerCopyright | String | @default("© 2024 منصة عقاراتي. جميع الحقوق محفوظة.") |
| landing_page_contact_info | landing_page_contact_info[] |  |
| landing_page_features | landing_page_features[] |  |
| landing_page_footer_links | landing_page_footer_links[] |  |
| landing_page_hero_metrics | landing_page_hero_metrics[] |  |
| landing_page_navigation | landing_page_navigation[] |  |
| landing_page_solutions | landing_page_solutions[] |  |
| landing_page_stats | landing_page_stats[] |  |

## landing_page_features

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id |
| title | String |  |
| description | String |  |
| icon | String |  |
| order | Int | @default(0) |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime |  |
| landingPageContentId | String |  |
| landing_page_content | landing_page_content | @relation(fields: [landingPageContentId], references: [id], onDelete: Cascade) |

## landing_page_footer_links

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id |
| text | String |  |
| url | String |  |
| category | String |  |
| order | Int | @default(0) |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime |  |
| landingPageContentId | String |  |
| landing_page_content | landing_page_content | @relation(fields: [landingPageContentId], references: [id], onDelete: Cascade) |

## landing_page_hero_metrics

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id |
| value | String |  |
| label | String |  |
| color | String |  |
| order | Int | @default(0) |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime |  |
| landingPageContentId | String |  |
| landing_page_content | landing_page_content | @relation(fields: [landingPageContentId], references: [id], onDelete: Cascade) |

## landing_page_navigation

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id |
| text | String |  |
| url | String |  |
| order | Int | @default(0) |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime |  |
| landingPageContentId | String |  |
| landing_page_content | landing_page_content | @relation(fields: [landingPageContentId], references: [id], onDelete: Cascade) |

## landing_page_solution_features

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id |
| text | String |  |
| icon | String |  |
| order | Int | @default(0) |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime |  |
| solutionId | String |  |
| landing_page_solutions | landing_page_solutions | @relation(fields: [solutionId], references: [id], onDelete: Cascade) |

## landing_page_solutions

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id |
| title | String |  |
| description | String |  |
| icon | String |  |
| order | Int | @default(0) |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime |  |
| landingPageContentId | String |  |
| landing_page_solution_features | landing_page_solution_features[] |  |
| landing_page_content | landing_page_content | @relation(fields: [landingPageContentId], references: [id], onDelete: Cascade) |

## landing_page_stats

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id |
| number | String |  |
| label | String |  |
| suffix | String? |  |
| order | Int | @default(0) |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime |  |
| landingPageContentId | String |  |
| landing_page_content | landing_page_content | @relation(fields: [landingPageContentId], references: [id], onDelete: Cascade) |

## leads

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id |
| agentId | String |  |
| organizationId | String? |  |
| customerId | String? |  |
| buyerRequestId | String? |  |
| sellerSubmissionId | String? |  |
| status | LeadStatus | @default(NEW) |
| notes | String? |  |
| source | String? |  |
| priority | Int? |  |
| assignedAt | DateTime? |  |
| lastContactAt | DateTime? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime |  |
| contact_logs | contact_logs[] |  |
| users | users | @relation(fields: [agentId], references: [id]) |
| organization | organizations? | @relation(fields: [organizationId], references: [id], onDelete: SetNull) |
| customer | customers? | @relation(fields: [customerId], references: [id], onDelete: SetNull) |
| buyer_requests | buyer_requests? | @relation(fields: [buyerRequestId], references: [id]) |
| seller_submissions | seller_submissions? | @relation(fields: [sellerSubmissionId], references: [id]) |

## listings

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id |
| propertyId | String |  |
| agentId | String |  |
| organizationId | String? |  |
| unitId | String? |  |
| sellerCustomerId | String? |  |
| listingType | ListingType |  |
| exclusive | Boolean | @default(false) |
| publishedAt | DateTime? |  |
| status | ListingStatus | @default(ACTIVE) |
| price | Decimal? |  |
| description | String? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime |  |
| users | users | @relation(fields: [agentId], references: [id]) |
| organizations | organizations? | @relation(fields: [organizationId], references: [id]) |
| properties | properties | @relation(fields: [propertyId], references: [id], onDelete: NoAction, onUpdate: NoAction, map: "listings_propertyid_fkey") |
| unit | property_units? | @relation("ListingUnit", fields: [unitId], references: [id], onDelete: SetNull) |
| seller | customers? | @relation("listing_seller", fields: [sellerCustomerId], references: [id], onDelete: SetNull) |
| inquiries | inquiries[] |  |
| appointments | appointments[] |  |
| deals | deals[] |  |

## organizations

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id |
| legalName | String |  |
| tradeName | String |  |
| licenseNo | String | @unique |
| status | OrganizationStatus | @default(PENDING_VERIFICATION) |
| address | String? |  |
| phone | String? |  |
| email | String? |  |
| website | String? |  |
| industry | String? |  |
| size | Int? |  |
| countryCode | String? |  |
| city | String? |  |
| region | String? |  |
| timezone | String? |  |
| billingEmail | String? |  |
| billingPhone | String? |  |
| metadata | Json? |  |
| primaryContactId | String? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime |  |
| agent_profiles | agent_profiles[] |  |
| file_assets | file_assets[] |  |
| listings | listings[] |  |
| users | users[] |  |
| primaryContact | users? | @relation("organization_primary_contact", fields: [primaryContactId], references: [id]) |
| memberships | organization_memberships[] |  |
| billing_accounts | billing_accounts[] |  |
| settings | organization_settings? |  |
| organization_invites | organization_invites[] |  |
| analytics_event_logs | analytics_event_logs[] |  |
| leads | leads[] |  |
| customers | customers[] |  |
| inquiries | inquiries[] |  |
| appointments | appointments[] |  |
| deals | deals[] |  |
| support_tickets | support_tickets[] |  |
| billing_payouts | billing_payouts[] |  |

## pricing_plan_features

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id |
| text | String |  |
| included | Boolean | @default(true) |
| order | Int | @default(0) |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime |  |
| pricingPlanId | String |  |
| pricing_plans | pricing_plans | @relation(fields: [pricingPlanId], references: [id], onDelete: Cascade) |

## pricing_plans

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id |
| name | String |  |
| price | Float |  |
| period | String | @default("monthly") |
| billingInterval | String | @default("monthly") |
| currency | String | @default("SAR") |
| isPopular | Boolean | @default(false) |
| isArchived | Boolean | @default(false) |
| description | String |  |
| buttonText | String | @default("ابدأ الآن") |
| order | Int | @default(0) |
| metadata | Json? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime |  |
| pricing_plan_features | pricing_plan_features[] |  |
| subscriptions | billing_subscriptions[] |  |

## properties

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id |
| agentId | String? |  |
| organizationId | String? |  |
| title | String? |  |
| description | String? |  |
| type | String? |  |
| category | String? |  |
| city | String? |  |
| district | String? |  |
| address | String? |  |
| bedrooms | Int? |  |
| bathrooms | Decimal? |  |
| areaSqm | Decimal? |  |
| price | Decimal? |  |
| status | PropertyStatus? |  |
| visibility | String? |  |
| latitude | Decimal? |  |
| longitude | Decimal? |  |
| features | String? |  |
| photos | String? |  |
| createdAt | DateTime? |  |
| updatedAt | DateTime? |  |
| cityId | Int? |  |
| districtId | BigInt? |  |
| regionId | Int? |  |
| listings | listings[] |  |
| units | property_units[] |  |
| media | property_media[] |  |
| inquiries | inquiries[] |  |
| appointments | appointments[] |  |
| deals | deals[] |  |

## property_units

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id @default(uuid()) |
| propertyId | String |  |
| unitType | String? |  |
| bedrooms | Int? |  |
| bathrooms | Decimal? | @db.Decimal(6, 2) |
| areaSqm | Decimal? | @db.Decimal(10, 2) |
| price | Decimal? | @db.Decimal(14, 2) |
| floor | Int? |  |
| isFurnished | Boolean? | @default(false) |
| hasBalcony | Boolean? | @default(false) |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| property | properties | @relation(fields: [propertyId], references: [id], onDelete: Cascade) |
| listings | listings[] | @relation("ListingUnit") |

## property_media

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id @default(uuid()) |
| propertyId | String |  |
| mediaType | String | @default("PHOTO") |
| url | String |  |
| isPrimary | Boolean | @default(false) |
| metadata | Json? |  |
| createdAt | DateTime | @default(now()) |
| property | properties | @relation(fields: [propertyId], references: [id], onDelete: Cascade) |

## properties_seeker

| Field | Type | Attributes |
| --- | --- | --- |
| seeker_num | BigInt | @id @default(autoincrement()) |
| first_name | String |  |
| last_name | String |  |
| mobile_number | String |  |
| email | String |  |
| nationality | String |  |
| age | Int |  |
| monthly_income | Decimal |  |
| gender | String |  |
| type_of_property | String |  |
| type_of_contract | String |  |
| number_of_rooms | Int |  |
| number_of_bathrooms | Int |  |
| number_of_living_rooms | Int |  |
| house_direction | String? |  |
| budget_size | Decimal |  |
| has_maid_room | Boolean | @default(false) |
| has_driver_room | Boolean? | @default(false) |
| kitchen_installed | Boolean? | @default(false) |
| has_elevator | Boolean? | @default(false) |
| parking_available | Boolean? | @default(false) |
| city | String? |  |
| district | String? |  |
| region | String? |  |
| other_comments | String? |  |
| created_at | DateTime | @default(now()) |
| updated_at | DateTime | @default(now()) |
| Sqm | BigInt? |  |
| seeker_id | String? | @unique @default(dbgenerated("('S-'::text \|\| lpad((seeker_num)::text, 11, '0'::text))")) @db.Char(13) |

## regions

| Field | Type | Attributes |
| --- | --- | --- |
| id | Int | @id |
| code | String? |  |
| nameAr | String |  |
| nameEn | String |  |
| population | Int? |  |
| centerLatitude | Decimal? |  |
| centerLongitude | Decimal? |  |
| boundary | Json? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime |  |
| cities | cities[] |  |
| districts | districts[] |  |

## seller_submissions

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id |
| createdByUserId | String |  |
| city | String |  |
| type | String |  |
| bedrooms | Int? |  |
| priceExpectation | Decimal? |  |
| exclusivePreference | Boolean | @default(false) |
| status | SellerSubmissionStatus | @default(OPEN) |
| maskedContact | String |  |
| fullContactJson | String |  |
| notes | String? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime |  |
| leads | leads[] |  |
| users | users | @relation(fields: [createdByUserId], references: [id]) |

## customers

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id @default(uuid()) |
| organizationId | String |  |
| type | CustomerType | @default(BUYER) |
| salutation | String? |  |
| firstName | String |  |
| lastName | String |  |
| email | String? |  |
| phone | String |  |
| secondaryPhone | String? |  |
| whatsappNumber | String? |  |
| preferredLanguage | String? | @default("ar") |
| city | String? |  |
| district | String? |  |
| nationality | String? |  |
| source | String? |  |
| notes | String? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| organization | organizations | @relation(fields: [organizationId], references: [id], onDelete: Cascade) |
| leads | leads[] |  |
| inquiries | inquiries[] |  |
| appointments | appointments[] |  |
| deals | deals[] |  |
| support_tickets | support_tickets[] |  |
| listings | listings[] | @relation("listing_seller") |

## inquiries

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id @default(uuid()) |
| organizationId | String |  |
| customerId | String |  |
| propertyId | String? |  |
| listingId | String? |  |
| agentId | String? |  |
| channel | InquiryChannel | @default(WEBSITE) |
| status | InquiryStatus | @default(NEW) |
| message | String? |  |
| preferredTime | DateTime? |  |
| createdAt | DateTime | @default(now()) |
| respondedAt | DateTime? |  |
| organization | organizations | @relation(fields: [organizationId], references: [id], onDelete: Cascade) |
| customer | customers | @relation(fields: [customerId], references: [id], onDelete: Cascade) |
| property | properties? | @relation(fields: [propertyId], references: [id], onDelete: SetNull) |
| listing | listings? | @relation(fields: [listingId], references: [id], onDelete: SetNull) |
| agent | users? | @relation(fields: [agentId], references: [id], onDelete: SetNull) |
| appointments | appointments[] |  |

## appointments

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id @default(uuid()) |
| organizationId | String |  |
| customerId | String |  |
| propertyId | String? |  |
| listingId | String? |  |
| inquiryId | String? |  |
| agentId | String? |  |
| status | AppointmentStatus | @default(SCHEDULED) |
| scheduledAt | DateTime |  |
| location | String? |  |
| notes | String? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| organization | organizations | @relation(fields: [organizationId], references: [id], onDelete: Cascade) |
| customer | customers | @relation(fields: [customerId], references: [id], onDelete: Cascade) |
| property | properties? | @relation(fields: [propertyId], references: [id], onDelete: SetNull) |
| listing | listings? | @relation(fields: [listingId], references: [id], onDelete: SetNull) |
| inquiry | inquiries? | @relation(fields: [inquiryId], references: [id], onDelete: SetNull) |
| agent | users? | @relation(fields: [agentId], references: [id], onDelete: SetNull) |

## deals

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id @default(uuid()) |
| organizationId | String |  |
| listingId | String? |  |
| propertyId | String? |  |
| customerId | String |  |
| agentId | String? |  |
| stage | DealStage | @default(NEW) |
| source | String? |  |
| expectedCloseDate | DateTime? |  |
| agreedPrice | Decimal? | @db.Decimal(14, 2) |
| currency | String | @default("SAR") |
| wonAt | DateTime? |  |
| lostAt | DateTime? |  |
| notes | String? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| organization | organizations | @relation(fields: [organizationId], references: [id], onDelete: Cascade) |
| listing | listings? | @relation(fields: [listingId], references: [id], onDelete: SetNull) |
| property | properties? | @relation(fields: [propertyId], references: [id], onDelete: SetNull) |
| customer | customers | @relation(fields: [customerId], references: [id], onDelete: Cascade) |
| agent | users? | @relation(fields: [agentId], references: [id], onDelete: SetNull) |

## support_tickets

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id @default(uuid()) |
| organizationId | String |  |
| customerId | String? |  |
| createdByUserId | String? |  |
| assignedToUserId | String? |  |
| subject | String |  |
| description | String? |  |
| status | SupportTicketStatus | @default(OPEN) |
| priority | SupportTicketPriority | @default(MEDIUM) |
| channel | InquiryChannel? | @default(WEBSITE) |
| openedAt | DateTime | @default(now()) |
| closedAt | DateTime? |  |
| updatedAt | DateTime | @updatedAt |
| organization | organizations | @relation(fields: [organizationId], references: [id], onDelete: Cascade) |
| customer | customers? | @relation(fields: [customerId], references: [id], onDelete: SetNull) |
| createdBy | users? | @relation("SupportTicketsCreated", fields: [createdByUserId], references: [id], onDelete: SetNull) |
| assignedTo | users? | @relation("SupportTicketsAssigned", fields: [assignedToUserId], references: [id], onDelete: SetNull) |

## users

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id |
| username | String | @unique |
| email | String? | @unique |
| phone | String? | @unique |
| firstName | String |  |
| lastName | String |  |
| passwordHash | String |  |
| roles | String |  |
| organizationId | String? |  |
| isActive | Boolean | @default(true) |
| lastLoginAt | DateTime? |  |
| lastSeenAt | DateTime? |  |
| jobTitle | String? |  |
| department | String? |  |
| approvalStatus | UserApprovalStatus | @default(PENDING) |
| timezone | String? |  |
| avatarUrl | String? |  |
| metadata | Json? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| agent_profiles | agent_profiles? |  |
| audit_logs | audit_logs[] |  |
| buyer_requests | buyer_requests[] |  |
| claims | claims[] |  |
| contact_logs | contact_logs[] |  |
| file_assets | file_assets[] |  |
| leads | leads[] |  |
| listings | listings[] |  |
| seller_submissions | seller_submissions[] |  |
| organization | organizations? | @relation(fields: [organizationId], references: [id]) |
| organization_memberships | organization_memberships[] |  |
| user_roles | user_roles[] |  |
| billing_accounts | billing_accounts[] |  |
| billing_payment_methods | billing_payment_methods[] | @relation("user_billing_payment_methods") |
| primaryContactFor | organizations[] | @relation("organization_primary_contact") |
| analytics_event_logs | analytics_event_logs[] |  |
| supportTicketsCreated | support_tickets[] | @relation("SupportTicketsCreated") |
| supportTicketsAssigned | support_tickets[] | @relation("SupportTicketsAssigned") |
| inquiries | inquiries[] |  |
| appointments | appointments[] |  |
| deals | deals[] |  |

## permissions

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id @default(uuid()) |
| key | String | @unique |
| label | String |  |
| description | String? |  |
| domain | String |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| role_permissions | role_permissions[] |  |

## system_roles

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id @default(uuid()) |
| key | String | @unique |
| name | String |  |
| description | String? |  |
| scope | RoleScope | @default(PLATFORM) |
| isDefault | Boolean | @default(false) |
| isSystem | Boolean | @default(false) |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| role_permissions | role_permissions[] |  |
| user_roles | user_roles[] |  |
| organization_memberships | organization_memberships[] |  |
| organization_invites | organization_invites[] |  |

## role_permissions

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id @default(uuid()) |
| roleId | String |  |
| permissionId | String |  |
| createdAt | DateTime | @default(now()) |
| createdBy | String? |  |
| role | system_roles | @relation(fields: [roleId], references: [id], onDelete: Cascade) |
| permission | permissions | @relation(fields: [permissionId], references: [id], onDelete: Cascade) |

## user_roles

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id @default(uuid()) |
| userId | String |  |
| roleId | String |  |
| assignedBy | String? |  |
| assignedAt | DateTime | @default(now()) |
| user | users | @relation(fields: [userId], references: [id], onDelete: Cascade) |
| role | system_roles | @relation(fields: [roleId], references: [id], onDelete: Cascade) |

## organization_memberships

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id @default(uuid()) |
| organizationId | String |  |
| userId | String |  |
| roleId | String? |  |
| title | String? |  |
| isPrimary | Boolean | @default(false) |
| status | MembershipStatus | @default(PENDING) |
| invitedBy | String? |  |
| invitedAt | DateTime? |  |
| joinedAt | DateTime? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| organization | organizations | @relation(fields: [organizationId], references: [id], onDelete: Cascade) |
| user | users | @relation(fields: [userId], references: [id], onDelete: Cascade) |
| role | system_roles? | @relation(fields: [roleId], references: [id], onDelete: SetNull) |

## organization_settings

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id @default(uuid()) |
| organizationId | String | @unique |
| locale | String? | @default("ar-SA") |
| timezone | String? | @default("Asia/Riyadh") |
| notificationEmail | String? |  |
| notificationPhone | String? |  |
| featureFlags | Json? |  |
| billingPreferences | Json? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| organization | organizations | @relation(fields: [organizationId], references: [id], onDelete: Cascade) |

## organization_invites

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id @default(uuid()) |
| organizationId | String |  |
| email | String |  |
| roleId | String? |  |
| status | MembershipStatus | @default(INVITED) |
| invitedBy | String? |  |
| invitedAt | DateTime | @default(now()) |
| expiresAt | DateTime? |  |
| acceptedAt | DateTime? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| organization | organizations | @relation(fields: [organizationId], references: [id], onDelete: Cascade) |
| role | system_roles? | @relation(fields: [roleId], references: [id], onDelete: SetNull) |

## billing_accounts

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id @default(uuid()) |
| organizationId | String? |  |
| userId | String? |  |
| status | BillingAccountStatus | @default(ACTIVE) |
| currency | String | @default("SAR") |
| billingEmail | String? |  |
| billingPhone | String? |  |
| taxNumber | String? |  |
| addressLine1 | String? |  |
| addressLine2 | String? |  |
| city | String? |  |
| region | String? |  |
| postalCode | String? |  |
| countryCode | String? |  |
| metadata | Json? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| organization | organizations? | @relation(fields: [organizationId], references: [id], onDelete: Cascade) |
| user | users? | @relation(fields: [userId], references: [id], onDelete: Cascade) |
| subscriptions | billing_subscriptions[] |  |
| payment_methods | billing_payment_methods[] |  |
| invoices | billing_invoices[] |  |
| payments | billing_payments[] |  |
| billing_payouts | billing_payouts[] |  |

## billing_payment_methods

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id @default(uuid()) |
| accountId | String |  |
| ownerUserId | String? |  |
| type | PaymentMethodType |  |
| status | PaymentMethodStatus | @default(ACTIVE) |
| vendor | String? |  |
| reference | String? |  |
| maskedDetails | String? |  |
| expiresAt | DateTime? |  |
| isDefault | Boolean | @default(false) |
| metadata | Json? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| account | billing_accounts | @relation(fields: [accountId], references: [id], onDelete: Cascade) |
| owner | users? | @relation("user_billing_payment_methods", fields: [ownerUserId], references: [id], onDelete: SetNull) |
| payments | billing_payments[] |  |
| attempts | billing_payment_attempts[] |  |

## billing_subscriptions

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id @default(uuid()) |
| accountId | String |  |
| planId | String |  |
| status | SubscriptionStatus | @default(TRIALING) |
| trialEndsAt | DateTime? |  |
| startDate | DateTime | @default(now()) |
| currentPeriodStart | DateTime |  |
| currentPeriodEnd | DateTime |  |
| cancelAtPeriodEnd | Boolean | @default(false) |
| canceledAt | DateTime? |  |
| renewalReminderSentAt | DateTime? |  |
| metadata | Json? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| account | billing_accounts | @relation(fields: [accountId], references: [id], onDelete: Cascade) |
| plan | pricing_plans | @relation(fields: [planId], references: [id], onDelete: Restrict) |
| invoices | billing_invoices[] |  |
| usage_records | billing_usage_records[] |  |
| billing_invoice_items | billing_invoice_items[] |  |

## billing_usage_records

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id @default(uuid()) |
| subscriptionId | String |  |
| metric | String |  |
| quantity | Decimal | @db.Decimal(14, 2) |
| recordedAt | DateTime |  |
| createdAt | DateTime | @default(now()) |
| subscription | billing_subscriptions | @relation(fields: [subscriptionId], references: [id], onDelete: Cascade) |

## billing_invoices

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id @default(uuid()) |
| accountId | String |  |
| subscriptionId | String? |  |
| number | String | @unique |
| status | InvoiceStatus | @default(DRAFT) |
| issueDate | DateTime | @default(now()) |
| dueDate | DateTime? |  |
| amountDue | Decimal | @default(0) @db.Decimal(14, 2) |
| amountPaid | Decimal | @default(0) @db.Decimal(14, 2) |
| currency | String | @default("SAR") |
| notes | String? |  |
| pdfUrl | String? |  |
| metadata | Json? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| account | billing_accounts | @relation(fields: [accountId], references: [id], onDelete: Cascade) |
| subscription | billing_subscriptions? | @relation(fields: [subscriptionId], references: [id], onDelete: SetNull) |
| items | billing_invoice_items[] |  |
| payments | billing_payments[] |  |

## billing_invoice_items

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id @default(uuid()) |
| invoiceId | String |  |
| subscriptionId | String? |  |
| description | String |  |
| quantity | Decimal | @default(1) @db.Decimal(14, 2) |
| unitAmount | Decimal | @db.Decimal(14, 2) |
| total | Decimal | @db.Decimal(14, 2) |
| metadata | Json? |  |
| createdAt | DateTime | @default(now()) |
| invoice | billing_invoices | @relation(fields: [invoiceId], references: [id], onDelete: Cascade) |
| subscription | billing_subscriptions? | @relation(fields: [subscriptionId], references: [id], onDelete: SetNull) |

## billing_payments

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id @default(uuid()) |
| invoiceId | String |  |
| accountId | String |  |
| methodId | String? |  |
| status | PaymentStatus | @default(PENDING) |
| amount | Decimal | @db.Decimal(14, 2) |
| currency | String | @default("SAR") |
| transactionReference | String? |  |
| gateway | String? |  |
| processedAt | DateTime? |  |
| metadata | Json? |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |
| invoice | billing_invoices | @relation(fields: [invoiceId], references: [id], onDelete: Cascade) |
| account | billing_accounts | @relation(fields: [accountId], references: [id], onDelete: Cascade) |
| method | billing_payment_methods? | @relation(fields: [methodId], references: [id], onDelete: SetNull) |
| attempts | billing_payment_attempts[] |  |

## billing_payouts

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id @default(uuid()) |
| organizationId | String? |  |
| accountId | String |  |
| amount | Decimal | @db.Decimal(14, 2) |
| currency | String | @default("SAR") |
| status | PaymentStatus | @default(PENDING) |
| reference | String? |  |
| beneficiary | String? |  |
| processedAt | DateTime? |  |
| periodStart | DateTime? |  |
| periodEnd | DateTime? |  |
| metadata | Json? |  |
| createdAt | DateTime | @default(now()) |
| account | billing_accounts | @relation(fields: [accountId], references: [id], onDelete: Cascade) |
| organization | organizations? | @relation(fields: [organizationId], references: [id], onDelete: SetNull) |

## billing_payment_attempts

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id @default(uuid()) |
| paymentId | String |  |
| methodId | String? |  |
| status | PaymentStatus | @default(PENDING) |
| amount | Decimal | @db.Decimal(14, 2) |
| failureReason | String? |  |
| processedAt | DateTime? |  |
| createdAt | DateTime | @default(now()) |
| payment | billing_payments | @relation(fields: [paymentId], references: [id], onDelete: Cascade) |
| method | billing_payment_methods? | @relation(fields: [methodId], references: [id], onDelete: SetNull) |

## revenue_snapshots

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id @default(uuid()) |
| snapshotDate | DateTime |  |
| metric | RevenueMetricType |  |
| dimension | String? |  |
| dimensionId | String? |  |
| value | Decimal | @db.Decimal(18, 4) |
| currency | String | @default("SAR") |
| notes | String? |  |
| createdAt | DateTime | @default(now()) |

## analytics_daily_metrics

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id @default(uuid()) |
| metric | AnalyticsMetricType |  |
| recordedFor | DateTime |  |
| dimension | String? |  |
| dimensionValue | String? |  |
| total | Decimal? | @db.Decimal(18, 4) |
| count | Int? |  |
| changePercent | Decimal? | @db.Decimal(9, 4) |
| createdAt | DateTime | @default(now()) |

## analytics_event_logs

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id @default(uuid()) |
| eventName | String |  |
| userId | String? |  |
| organizationId | String? |  |
| occurredAt | DateTime |  |
| payload | Json? |  |
| createdAt | DateTime | @default(now()) |
| user | users? | @relation(fields: [userId], references: [id], onDelete: SetNull) |
| organization | organizations? | @relation(fields: [organizationId], references: [id], onDelete: SetNull) |

## cms_content_blocks

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id @default(uuid()) |
| key | String |  |
| locale | String | @default("en") |
| value | String |  |
| createdAt | DateTime | @default(now()) |
| updatedAt | DateTime | @updatedAt |

## LandingSection

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id @default(uuid()) |
| slug | String | @unique |
| title | String |  |
| subtitle | String? |  |
| layoutVariant | String | @default("custom") |
| theme | Json? |  |
| orderIndex | Int | @default(0) |
| visible | Boolean | @default(true) |
| status | String | @default("draft") |
| draftJson | Json? |  |
| publishedJson | Json? |  |
| version | Int | @default(1) |
| updatedBy | String? |  |
| publishedBy | String? |  |
| updatedAt | DateTime | @updatedAt |
| publishedAt | DateTime? |  |
| createdAt | DateTime | @default(now()) |
| cards | LandingCard[] |  |

## LandingCard

| Field | Type | Attributes |
| --- | --- | --- |
| id | String | @id @default(uuid()) |
| sectionId | String |  |
| orderIndex | Int | @default(0) |
| title | String? |  |
| body | String? |  |
| mediaUrl | String? |  |
| icon | String? |  |
| ctaLabel | String? |  |
| ctaHref | String? |  |
| visible | Boolean | @default(true) |
| status | String | @default("draft") |
| draftJson | Json? |  |
| publishedJson | Json? |  |
| version | Int | @default(1) |
| updatedBy | String? |  |
| publishedBy | String? |  |
| updatedAt | DateTime | @updatedAt |
| publishedAt | DateTime? |  |
| createdAt | DateTime | @default(now()) |
| section | LandingSection | @relation(fields: [sectionId], references: [id], onDelete: Cascade) |

## LandingAuditLog

| Field | Type | Attributes |
| --- | --- | --- |
| id | BigInt | @id @default(autoincrement()) |
| actor | String |  |
| entityType | String |  |
| entityId | String |  |
| action | String |  |
| fromVersion | Int? |  |
| toVersion | Int? |  |
| createdAt | DateTime | @default(now()) |

## LandingVersion

| Field | Type | Attributes |
| --- | --- | --- |
| id | BigInt | @id @default(autoincrement()) |
| entityType | String |  |
| entityId | String |  |
| version | Int |  |
| snapshot | Json |  |
| createdBy | String? |  |
| createdAt | DateTime | @default(now()) |
