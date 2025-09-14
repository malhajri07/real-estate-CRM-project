import { Router } from "express";
import { storage } from "../storage-prisma";
import { type User } from "@shared/types";

const router = Router();

/**
 * Create new account (registration)
 */
router.post("/register", async (req, res) => {
  try {
    const userData = req.body;
    
    // Validate required fields
    if (!userData.email || !userData.firstName || !userData.accountType) {
      return res.status(400).json({ 
        error: "Missing required fields: email, firstName, accountType" 
      });
    }

    // Check if email already exists
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const newUser = await accountService.createAccount(userData);
    
    // Remove sensitive information
    const { ...publicUserData } = newUser;
    
    res.status(201).json({
      message: "Account created successfully",
      user: publicUserData
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to create account" });
  }
});

/**
 * Get account statistics and limits
 */
router.get("/stats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const stats = await accountService.getAccountStats(userId);
    res.json(stats);
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ error: "Failed to get account statistics" });
  }
});

/**
 * Check if user can create a new listing
 */
router.get("/can-create-listing/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await accountService.canCreateListing(userId);
    res.json(result);
  } catch (error) {
    console.error("Check listing permission error:", error);
    res.status(500).json({ error: "Failed to check listing permissions" });
  }
});

/**
 * Check if user can add a new customer
 */
router.get("/can-add-customer/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await accountService.canAddCustomer(userId);
    res.json(result);
  } catch (error) {
    console.error("Check customer permission error:", error);
    res.status(500).json({ error: "Failed to check customer permissions" });
  }
});

/**
 * Add employee to corporate company
 */
router.post("/company/:companyId/employees", async (req, res) => {
  try {
    const { companyId } = req.params;
    const employeeData = req.body;
    
    const newEmployee = await accountService.addEmployeeToCompany(companyId, employeeData);
    
    res.status(201).json({
      message: "Employee added successfully",
      employee: newEmployee
    });
  } catch (error) {
    console.error("Add employee error:", error);
    res.status(500).json({ error: error.message || "Failed to add employee" });
  }
});

/**
 * Get company employees
 */
router.get("/company/:companyId/employees", async (req, res) => {
  try {
    const { companyId } = req.params;
    const employees = await accountService.getCompanyEmployees(companyId);
    res.json(employees);
  } catch (error) {
    console.error("Get employees error:", error);
    res.status(500).json({ error: error.message || "Failed to get employees" });
  }
});

/**
 * Get publicly visible properties (for customers)
 */
router.get("/public/properties", async (req, res) => {
  try {
    const filters = {
      city: req.query.city as string,
      propertyType: req.query.propertyType as string,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      bedrooms: req.query.bedrooms ? Number(req.query.bedrooms) : undefined,
    };

    const properties = await accountService.getPublicProperties(filters);
    res.json(properties);
  } catch (error) {
    console.error("Get public properties error:", error);
    res.status(500).json({ error: "Failed to get properties" });
  }
});

/**
 * Get single property details (for customers)
 */
router.get("/public/properties/:propertyId", async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    const property = await db
      .select({
        id: properties.id,
        title: properties.title,
        description: properties.description,
        address: properties.address,
        city: properties.city,
        state: properties.state,
        zipCode: properties.zipCode,
        latitude: properties.latitude,
        longitude: properties.longitude,
        price: properties.price,
        propertyCategory: properties.propertyCategory,
        propertyType: properties.propertyType,
        bedrooms: properties.bedrooms,
        bathrooms: properties.bathrooms,
        squareFeet: properties.squareFeet,
        listingType: properties.listingType,
        availableFrom: properties.availableFrom,
        photoUrls: properties.photoUrls,
        virtualTourUrl: properties.virtualTourUrl,
        features: properties.features,
        isFeatured: properties.isFeatured,
        viewCount: properties.viewCount,
        createdAt: properties.createdAt,
        // Broker information
        brokerId: users.id,
        brokerName: users.firstName,
        brokerLastName: users.lastName,
        brokerPhone: users.phone,
        brokerEmail: users.email,
        companyName: users.companyName,
        accountType: users.accountType,
      })
      .from(properties)
      .leftJoin(users, eq(properties.ownerId, users.id))
      .where(
        and(
          eq(properties.id, propertyId),
          eq(properties.status, 'active'),
          eq(properties.isPubliclyVisible, true)
        )
      )
      .limit(1);

    if (!property.length) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Increment view count
    await db
      .update(properties)
      .set({ viewCount: property[0].viewCount + 1 })
      .where(eq(properties.id, propertyId));

    res.json(property[0]);
  } catch (error) {
    console.error("Get property details error:", error);
    res.status(500).json({ error: "Failed to get property details" });
  }
});

/**
 * Create property inquiry (for customers)
 */
router.post("/public/properties/:propertyId/inquire", async (req, res) => {
  try {
    const { propertyId } = req.params;
    const inquiryData = {
      ...req.body,
      propertyId,
    };

    const inquiry = await accountService.createPropertyInquiry(inquiryData);
    
    res.status(201).json({
      message: "Inquiry submitted successfully",
      inquiry
    });
  } catch (error) {
    console.error("Create inquiry error:", error);
    res.status(500).json({ error: "Failed to submit inquiry" });
  }
});

/**
 * Get user's property inquiries (for brokers)
 */
router.get("/inquiries/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    const base = db
      .select({
        id: propertyInquiries.id,
        propertyTitle: properties.title,
        customerName: propertyInquiries.customerName,
        customerEmail: propertyInquiries.customerEmail,
        customerPhone: propertyInquiries.customerPhone,
        inquiryType: propertyInquiries.inquiryType,
        message: propertyInquiries.message,
        status: propertyInquiries.status,
        preferredContactMethod: propertyInquiries.preferredContactMethod,
        createdAt: propertyInquiries.createdAt,
        propertyId: properties.id,
      })
      .from(propertyInquiries)
      .leftJoin(properties, eq(propertyInquiries.propertyId, properties.id))
    ;

    const conds: any[] = [eq(properties.ownerId, userId)];

    if (status) {
      conds.push(eq(propertyInquiries.status, status as string));
    }

    const inquiries = await base.where(and(...conds)).orderBy(desc(propertyInquiries.createdAt));
    res.json(inquiries);
  } catch (error) {
    console.error("Get inquiries error:", error);
    res.status(500).json({ error: "Failed to get inquiries" });
  }
});

/**
 * Update inquiry status (for brokers)
 */
router.patch("/inquiries/:inquiryId", async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const { status, brokerResponse, respondedBy } = req.body;

    const updateData: any = { status, updatedAt: new Date() };
    
    if (brokerResponse) {
      updateData.brokerResponse = brokerResponse;
      updateData.respondedAt = new Date();
    }
    
    if (respondedBy) {
      updateData.respondedBy = respondedBy;
    }

    await db
      .update(propertyInquiries)
      .set(updateData)
      .where(eq(propertyInquiries.id, inquiryId));

    res.json({ message: "Inquiry updated successfully" });
  } catch (error) {
    console.error("Update inquiry error:", error);
    res.status(500).json({ error: "Failed to update inquiry" });
  }
});

export default router;
