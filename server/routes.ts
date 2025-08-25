import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertPropertySchema, insertDealSchema, insertActivitySchema, insertMessageSchema } from "@shared/schema";
import { whatsappService } from "./whatsapp";
import { z } from "zod";
import { setupMockAuth, isAuthenticated } from "./authMock";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { registerRoleBasedRoutes } from "./roleRoutes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup mock authentication for development
  await setupMockAuth(app);

  // Register role-based access control routes
  registerRoleBasedRoutes(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  // CSV Upload routes for bulk lead import
  app.post("/api/csv/upload-url", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getCSVUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting CSV upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.post("/api/csv/process-leads", async (req, res) => {
    try {
      const { csvUrl } = req.body;
      
      if (!csvUrl) {
        return res.status(400).json({ error: "CSV URL is required" });
      }

      // Extract object path from URL
      const url = new URL(csvUrl);
      const pathParts = url.pathname.split('/');
      const objectPath = pathParts.slice(2).join('/'); // Remove bucket name

      const objectStorageService = new ObjectStorageService();
      const csvFile = await objectStorageService.getCSVFile(objectPath);
      const csvContent = await objectStorageService.downloadCSVContent(csvFile);

      // Parse CSV content
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        return res.status(400).json({ error: "ملف CSV فارغ" });
      }

      // Assume first line is header
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const dataLines = lines.slice(1);

      const results = {
        total: dataLines.length,
        successful: 0,
        failed: 0,
        errors: [] as string[]
      };

      // Process each line
      for (let i = 0; i < dataLines.length; i++) {
        try {
          const values = dataLines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const leadData: any = {};

          // Map CSV columns to lead fields
          headers.forEach((header, index) => {
            const value = values[index] || '';
            
            // Map common column names (case insensitive)
            const lowerHeader = header.toLowerCase();
            if (lowerHeader.includes('firstname') || lowerHeader.includes('first_name') || lowerHeader === 'الاسم الأول') {
              leadData.firstName = value;
            } else if (lowerHeader.includes('lastname') || lowerHeader.includes('last_name') || lowerHeader === 'الاسم الأخير') {
              leadData.lastName = value;
            } else if (lowerHeader.includes('email') || lowerHeader === 'البريد الإلكتروني') {
              leadData.email = value;
            } else if (lowerHeader.includes('phone') || lowerHeader === 'الهاتف') {
              leadData.phone = value;
            } else if (lowerHeader.includes('budget') || lowerHeader === 'الميزانية') {
              leadData.budgetRange = value;
            } else if (lowerHeader.includes('source') || lowerHeader === 'المصدر') {
              leadData.leadSource = value;
            } else if (lowerHeader.includes('interest') || lowerHeader === 'نوع الاهتمام') {
              leadData.interestType = value;
            } else if (lowerHeader.includes('notes') || lowerHeader === 'ملاحظات') {
              leadData.notes = value;
            }
          });

          // Validate required fields
          if (!leadData.firstName || !leadData.lastName || !leadData.email) {
            results.errors.push(`السطر ${i + 2}: مطلوب الاسم الأول والأخير والبريد الإلكتروني`);
            results.failed++;
            continue;
          }

          // Set defaults
          leadData.status = leadData.status || "new";
          leadData.leadSource = leadData.leadSource || "csv_import";
          leadData.interestType = leadData.interestType || "buying";

          // Validate using schema
          const validatedData = insertLeadSchema.parse(leadData);
          
          // Create lead
          await storage.createLead(validatedData);
          results.successful++;

        } catch (error) {
          console.error(`Error processing line ${i + 2}:`, error);
          results.errors.push(`السطر ${i + 2}: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
          results.failed++;
        }
      }

      res.json({
        success: true,
        message: `تم معالجة ${results.total} سطر. نجح: ${results.successful}, فشل: ${results.failed}`,
        results
      });

    } catch (error) {
      console.error("Error processing CSV:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "ملف CSV غير موجود" });
      }
      res.status(500).json({ error: "خطأ في معالجة ملف CSV" });
    }
  });

  // Lead routes
  app.get("/api/leads", isAuthenticated, async (req, res) => {
    try {
      const leads = await storage.getAllLeads();
      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.get("/api/leads/search", isAuthenticated, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const leads = await storage.searchLeads(query);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: "Failed to search leads" });
    }
  });

  app.get("/api/leads/:id", isAuthenticated, async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lead" });
    }
  });

  app.post("/api/leads", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(validatedData);
      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  app.put("/api/leads/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertLeadSchema.partial().parse(req.body);
      const lead = await storage.updateLead(req.params.id, validatedData);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update lead" });
    }
  });

  app.delete("/api/leads/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteLead(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  // Property routes
  app.get("/api/properties", isAuthenticated, async (req, res) => {
    try {
      const properties = await storage.getAllProperties();
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  app.get("/api/properties/:id", async (req, res) => {
    try {
      const property = await storage.getProperty(req.params.id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  app.get("/api/properties/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const properties = await storage.searchProperties(query);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to search properties" });
    }
  });

  app.get("/api/properties/:id", async (req, res) => {
    try {
      const property = await storage.getProperty(req.params.id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  app.post("/api/properties", async (req, res) => {
    try {
      const validatedData = insertPropertySchema.parse(req.body);
      const property = await storage.createProperty(validatedData);
      res.status(201).json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create property" });
    }
  });

  app.put("/api/properties/:id", async (req, res) => {
    try {
      const validatedData = insertPropertySchema.partial().parse(req.body);
      const property = await storage.updateProperty(req.params.id, validatedData);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update property" });
    }
  });

  app.delete("/api/properties/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProperty(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete property" });
    }
  });

  // Deal routes
  app.get("/api/deals", async (req, res) => {
    try {
      const deals = await storage.getAllDeals();
      res.json(deals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deals" });
    }
  });

  app.get("/api/deals/stage/:stage", async (req, res) => {
    try {
      const deals = await storage.getDealsByStage(req.params.stage);
      res.json(deals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deals by stage" });
    }
  });

  app.post("/api/deals", async (req, res) => {
    try {
      const validatedData = insertDealSchema.parse(req.body);
      const deal = await storage.createDeal(validatedData);
      res.status(201).json(deal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create deal" });
    }
  });

  app.put("/api/deals/:id", async (req, res) => {
    try {
      const validatedData = insertDealSchema.partial().parse(req.body);
      const deal = await storage.updateDeal(req.params.id, validatedData);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      res.json(deal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update deal" });
    }
  });

  // Activity routes
  app.get("/api/activities/lead/:leadId", async (req, res) => {
    try {
      const activities = await storage.getActivitiesByLead(req.params.leadId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.get("/api/activities/today", async (req, res) => {
    try {
      const activities = await storage.getTodaysActivities();
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch today's activities" });
    }
  });

  app.post("/api/activities", async (req, res) => {
    try {
      const validatedData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(validatedData);
      res.status(201).json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create activity" });
    }
  });

  // Dashboard metrics
  app.get("/api/dashboard/metrics", isAuthenticated, async (req, res) => {
    try {
      const leads = await storage.getAllLeads();
      const properties = await storage.getAllProperties();
      const deals = await storage.getAllDeals();
      
      const activeDeals = deals.filter(deal => !['closed', 'lost'].includes(deal.stage));
      const closedDeals = deals.filter(deal => deal.stage === 'closed');
      
      const monthlyRevenue = closedDeals.reduce((sum, deal) => {
        const commission = deal.commission ? parseFloat(deal.commission) : 0;
        return sum + commission;
      }, 0);

      const metrics = {
        totalLeads: leads.length,
        activeProperties: properties.filter(p => p.status === 'active').length,
        dealsInPipeline: activeDeals.length,
        monthlyRevenue: monthlyRevenue,
        pipelineByStage: {
          lead: deals.filter(d => d.stage === 'lead').length,
          qualified: deals.filter(d => d.stage === 'qualified').length,
          showing: deals.filter(d => d.stage === 'showing').length,
          negotiation: deals.filter(d => d.stage === 'negotiation').length,
          closed: deals.filter(d => d.stage === 'closed').length,
        }
      };

      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Message routes
  app.get("/api/messages", async (req, res) => {
    try {
      const messages = await storage.getAllMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.get("/api/messages/lead/:leadId", async (req, res) => {
    try {
      const { leadId } = req.params;
      const messages = await storage.getMessagesByLead(leadId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages for lead" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      
      // Send WhatsApp message if the type is whatsapp
      if (messageData.messageType === 'whatsapp') {
        const success = await whatsappService.sendMessage(messageData.phoneNumber, messageData.message);
        if (success) {
          await storage.updateMessageStatus(message.id, 'sent');
        } else {
          await storage.updateMessageStatus(message.id, 'failed');
        }
      }
      
      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create message" });
      }
    }
  });

  app.get("/api/whatsapp/status", (req, res) => {
    res.json({ 
      isReady: whatsappService.isClientReady(),
      service: 'WhatsApp Web'
    });
  });

  // Notifications API
  app.get("/api/notifications", async (req, res) => {
    try {
      const notifications = await storage.getNotifications();
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Campaigns API
  app.post("/api/campaigns", async (req, res) => {
    try {
      const { title, message, type, leadIds } = req.body;
      
      if (!title || !message || !type || !leadIds || !Array.isArray(leadIds)) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const campaign = {
        id: Date.now().toString(),
        title,
        message,
        type,
        leadIds,
        status: "sent",
        sentAt: new Date().toISOString(),
        recipientCount: leadIds.length
      };

      // For now, just return success - storage methods will be added
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
