// Centralized Mock Data for Brightloop Subscription Management System
// Updated with realistic Tamil Nadu names and Indian enterprise demo data

export const initialCustomers = [
  {
    id: "CUST-001",
    name: "Kavin",
    email: "kavin@chennaitech.in",
    phone: "+91 98401 23456",
    company: "Kavin Tech Solutions Pvt Ltd",
    address: "42 OMR IT Corridor, Thoraipakkam, Chennai, TN - 600097",
    registrationDate: "2024-01-15",
    status: "Active",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "CUST-002",
    name: "Nila",
    email: "nila@coimbatoretextiles.in",
    phone: "+91 94432 78901",
    company: "Nila Loom & Fabrics",
    address: "15 Avinashi Road, Peelamedu, Coimbatore, TN - 641004",
    registrationDate: "2024-02-01",
    status: "Active",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "CUST-003",
    name: "Arjun",
    email: "arjun@madurailogistics.in",
    phone: "+91 97901 44556",
    company: "Arjun Cargo & Freight",
    address: "88 Byepass Road, Ponmeni, Madurai, TN - 625016",
    registrationDate: "2024-02-18",
    status: "Active",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "CUST-004",
    name: "Yazhini",
    email: "yazhini@trichymedia.in",
    phone: "+91 96291 33445",
    company: "Yazhini Creative Media Studio",
    address: "24 Thillai Nagar Main Road, Tiruchirappalli, TN - 620018",
    registrationDate: "2024-03-05",
    status: "Active",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "CUST-005",
    name: "Harish",
    email: "harish@salemagro.in",
    phone: "+91 95001 88990",
    company: "Salem Natural Agro Ventures",
    address: "102 Meyyanur Bypass, Salem, TN - 636004",
    registrationDate: "2024-03-20",
    status: "Inactive",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
  }
];

export const initialProducts = [
  {
    id: "PROD-001",
    name: "Business Software Suite",
    type: "Software",
    salesPrice: 1000.00,
    costPrice: 450.00,
    notes: "Core enterprise ERP & CRM bundle with multi-tenant support.",
    variants: [
      { name: "Standard", additionalPrice: 0, finalPrice: 1000.00 },
      { name: "Odoo Brand Edition", additionalPrice: 560, finalPrice: 1560.00 },
      { name: "Enterprise Pro", additionalPrice: 900, finalPrice: 1900.00 }
    ]
  },
  {
    id: "PROD-002",
    name: "Cloud Hosting & Storage",
    type: "Service",
    salesPrice: 500.00,
    costPrice: 200.00,
    notes: "99.99% uptime dedicated cloud server with automated backups.",
    variants: [
      { name: "50GB SSD", additionalPrice: 0, finalPrice: 500.00 },
      { name: "250GB NVMe High IOPS", additionalPrice: 350, finalPrice: 850.00 },
      { name: "1TB Dedicated Cloud Vault", additionalPrice: 800, finalPrice: 1300.00 }
    ]
  },
  {
    id: "PROD-003",
    name: "API Gateway & Webhook Engine",
    type: "Software",
    salesPrice: 300.00,
    costPrice: 100.00,
    notes: "High-throughput API microservices mesh.",
    variants: [
      { name: "Basic 10k calls/day", additionalPrice: 0, finalPrice: 300.00 },
      { name: "Unlimited High Concurrency", additionalPrice: 400, finalPrice: 700.00 }
    ]
  },
  {
    id: "PROD-004",
    name: "Dedicated Account Support",
    type: "Service",
    salesPrice: 750.00,
    costPrice: 300.00,
    notes: "24/7 Priority SLA response within 15 minutes.",
    variants: [
      { name: "Standard Support", additionalPrice: 0, finalPrice: 750.00 },
      { name: "Executive 24/7 Dedicated POC", additionalPrice: 500, finalPrice: 1250.00 }
    ]
  }
];

export const initialPlans = [
  {
    id: "PLAN-001",
    name: "Bright Enterprise Monthly",
    description: "Full suite access with monthly recurring cycle and flexibility.",
    price: 1560.00,
    billingInterval: "Monthly",
    minQuantity: 1,
    availableFrom: "2024-01-01",
    availableUntil: "2026-12-31",
    autoClose: false,
    earlyClosure: true,
    pauseOption: true,
    renewalOption: true,
    status: "Active"
  },
  {
    id: "PLAN-002",
    name: "Annual Business Growth Tier",
    description: "Discounted yearly plan designed for scaling corporations.",
    price: 14999.00,
    billingInterval: "Yearly",
    minQuantity: 1,
    availableFrom: "2024-01-01",
    availableUntil: "2027-12-31",
    autoClose: false,
    earlyClosure: false,
    pauseOption: true,
    renewalOption: true,
    status: "Active"
  },
  {
    id: "PLAN-003",
    name: "Startup Sprint Weekly",
    description: "Short iteration billing for early-stage test runs.",
    price: 499.00,
    billingInterval: "Weekly",
    minQuantity: 1,
    availableFrom: "2024-01-01",
    availableUntil: "2025-12-31",
    autoClose: true,
    earlyClosure: true,
    pauseOption: false,
    renewalOption: false,
    status: "Active"
  },
  {
    id: "PLAN-004",
    name: "Developer Sandboxed Daily",
    description: "On-demand per-day testing subscription for sandbox engineers.",
    price: 99.00,
    billingInterval: "Daily",
    minQuantity: 1,
    availableFrom: "2024-01-01",
    availableUntil: "2025-12-31",
    autoClose: true,
    earlyClosure: true,
    pauseOption: false,
    renewalOption: true,
    status: "Active"
  }
];

export const initialDiscounts = [
  {
    id: "DISC-001",
    name: "HACKATHON_HERO",
    type: "Percentage",
    value: 15,
    minPurchase: 1000.00,
    minQuantity: 1,
    applicableProducts: ["All"],
    startDate: "2024-01-01",
    endDate: "2025-12-31",
    usageLimit: 100,
    usageCount: 42,
    status: "Active"
  },
  {
    id: "DISC-002",
    name: "ODOO_PARTNER_FLAT",
    type: "Fixed",
    value: 500.00,
    minPurchase: 3000.00,
    minQuantity: 2,
    applicableProducts: ["PROD-001", "PROD-002"],
    startDate: "2024-01-01",
    endDate: "2025-06-30",
    usageLimit: 50,
    usageCount: 18,
    status: "Active"
  },
  {
    id: "DISC-003",
    name: "EARLYBIRD_FLASH",
    type: "Percentage",
    value: 25,
    minPurchase: 2000.00,
    minQuantity: 1,
    applicableProducts: ["All"],
    startDate: "2023-01-01",
    endDate: "2023-12-31",
    usageLimit: 20,
    usageCount: 20,
    status: "Expired"
  }
];

export const initialSubscriptions = [
  {
    id: "SUB-2024-001",
    customerId: "CUST-001",
    customerName: "Kavin",
    planId: "PLAN-001",
    planName: "Bright Enterprise Monthly",
    productId: "PROD-001",
    variantName: "Odoo Brand Edition",
    startDate: "2024-01-15",
    expiryDate: "2025-01-14",
    nextBillingDate: "2024-11-02",
    billingInterval: "Monthly",
    quantity: 1,
    unitPrice: 1560.00,
    taxRate: 18,
    taxAmount: 280.80,
    discountAmount: 0.00,
    totalAmount: 1840.80,
    paymentTerms: "Net 15",
    status: "Active",
    renewalAlert: "Due today!",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "SUB-2024-002",
    customerId: "CUST-001",
    customerName: "Kavin",
    planId: "PLAN-002",
    planName: "Annual Business Growth Tier",
    productId: "PROD-002",
    variantName: "1TB Dedicated Cloud Vault",
    startDate: "2024-02-01",
    expiryDate: "2025-01-31",
    nextBillingDate: "2024-11-03",
    billingInterval: "Yearly",
    quantity: 1,
    unitPrice: 14999.00,
    taxRate: 18,
    taxAmount: 2609.82,
    discountAmount: 500.00,
    totalAmount: 17108.82,
    paymentTerms: "Immediate",
    status: "Active",
    renewalAlert: "Due tomorrow",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "SUB-2024-003",
    customerId: "CUST-002",
    customerName: "Nila",
    planId: "PLAN-001",
    planName: "Bright Enterprise Monthly",
    productId: "PROD-001",
    variantName: "Enterprise Pro",
    startDate: "2024-02-10",
    expiryDate: "2025-02-09",
    nextBillingDate: "2024-11-10",
    billingInterval: "Monthly",
    quantity: 2,
    unitPrice: 1900.00,
    taxRate: 18,
    taxAmount: 648.00,
    discountAmount: 200.00,
    totalAmount: 4248.00,
    paymentTerms: "Net 30",
    status: "Active",
    renewalAlert: "Due in 8 days",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "SUB-2024-004",
    customerId: "CUST-003",
    customerName: "Arjun",
    planId: "PLAN-002",
    planName: "Annual Business Growth Tier",
    productId: "PROD-001",
    variantName: "Standard",
    startDate: "2024-03-01",
    expiryDate: "2025-02-28",
    nextBillingDate: "2024-11-23",
    billingInterval: "Yearly",
    quantity: 1,
    unitPrice: 14999.00,
    taxRate: 18,
    taxAmount: 2699.82,
    discountAmount: 0.00,
    totalAmount: 17698.82,
    paymentTerms: "Net 15",
    status: "Confirmed",
    renewalAlert: "Due in 21 days",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "SUB-2024-005",
    customerId: "CUST-004",
    customerName: "Yazhini",
    planId: "PLAN-003",
    planName: "Startup Sprint Weekly",
    productId: "PROD-003",
    variantName: "Basic 10k calls/day",
    startDate: "2024-03-10",
    expiryDate: "2024-09-10",
    nextBillingDate: "2024-09-10",
    billingInterval: "Weekly",
    quantity: 1,
    unitPrice: 499.00,
    taxRate: 18,
    taxAmount: 89.82,
    discountAmount: 0.00,
    totalAmount: 588.82,
    paymentTerms: "Immediate",
    status: "Paused",
    renewalAlert: "Paused by User",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80"
  }
];

export const initialQuotations = [
  {
    id: "QUO-2024-001",
    customerId: "CUST-001",
    customerName: "Kavin",
    planId: "PLAN-001",
    planName: "Bright Enterprise Monthly",
    items: [
      { productId: "PROD-001", productName: "Business Software Suite (Odoo Brand)", qty: 2, unitPrice: 1560.00, amount: 3120.00 },
      { productId: "PROD-004", productName: "Dedicated Account Support", qty: 1, unitPrice: 750.00, amount: 750.00 }
    ],
    subtotal: 3870.00,
    discount: 387.00,
    tax: 626.94,
    total: 4109.94,
    validUntil: "2024-11-20",
    status: "Accepted",
    notes: "Includes 10% partner onboarding discount."
  },
  {
    id: "QUO-2024-002",
    customerId: "CUST-002",
    customerName: "Nila",
    planId: "PLAN-002",
    planName: "Annual Business Growth Tier",
    items: [
      { productId: "PROD-002", productName: "Cloud Hosting & Storage (1TB)", qty: 1, unitPrice: 1300.00, amount: 1300.00 }
    ],
    subtotal: 1300.00,
    discount: 0.00,
    tax: 234.00,
    total: 1534.00,
    validUntil: "2024-11-25",
    status: "Sent",
    notes: "Awaiting legal agreement review."
  },
  {
    id: "QUO-2024-003",
    customerId: "CUST-005",
    customerName: "Harish",
    planId: "PLAN-001",
    planName: "Bright Enterprise Monthly",
    items: [
      { productId: "PROD-003", productName: "API Gateway High Concurrency", qty: 3, unitPrice: 700.00, amount: 2100.00 }
    ],
    subtotal: 2100.00,
    discount: 100.00,
    tax: 360.00,
    total: 2360.00,
    validUntil: "2024-10-15",
    status: "Expired",
    notes: "Quotation expired without client confirmation."
  }
];

export const initialInvoices = [
  {
    id: "INV-2024-001",
    invoiceNumber: "INV-2024-001",
    subscriptionId: "SUB-2024-001",
    customerId: "CUST-001",
    customerName: "Kavin",
    customerEmail: "kavin@chennaitech.in",
    customerAddress: "42 OMR IT Corridor, Thoraipakkam, Chennai, TN - 600097",
    billingPeriod: "01 Oct 2024 - 31 Oct 2024",
    invoiceDate: "2024-10-01",
    dueDate: "2024-10-16",
    subtotal: 1560.00,
    discount: 0.00,
    taxRate: 18,
    tax: 280.80,
    total: 1840.80,
    amountPaid: 1840.80,
    balanceDue: 0.00,
    status: "Paid",
    items: [
      { description: "Bright Enterprise Monthly (Odoo Brand Edition)", qty: 1, unitPrice: 1560.00, amount: 1560.00 }
    ]
  },
  {
    id: "INV-2024-002",
    invoiceNumber: "INV-2024-002",
    subscriptionId: "SUB-2024-002",
    customerId: "CUST-001",
    customerName: "Kavin",
    customerEmail: "kavin@chennaitech.in",
    customerAddress: "42 OMR IT Corridor, Thoraipakkam, Chennai, TN - 600097",
    billingPeriod: "01 Nov 2024 - 31 Oct 2025",
    invoiceDate: "2024-10-25",
    dueDate: "2024-11-03",
    subtotal: 14999.00,
    discount: 500.00,
    taxRate: 18,
    tax: 2609.82,
    total: 17108.82,
    amountPaid: 8000.00,
    balanceDue: 9108.82,
    status: "Partially Paid",
    items: [
      { description: "Annual Business Growth Tier - Cloud Vault 1TB", qty: 1, unitPrice: 14999.00, amount: 14999.00 }
    ]
  },
  {
    id: "INV-2024-003",
    invoiceNumber: "INV-2024-003",
    subscriptionId: "SUB-2024-003",
    customerId: "CUST-002",
    customerName: "Nila",
    customerEmail: "nila@coimbatoretextiles.in",
    customerAddress: "15 Avinashi Road, Peelamedu, Coimbatore, TN - 641004",
    billingPeriod: "10 Oct 2024 - 09 Nov 2024",
    invoiceDate: "2024-10-10",
    dueDate: "2024-10-25",
    subtotal: 3800.00,
    discount: 200.00,
    taxRate: 18,
    tax: 648.00,
    total: 4248.00,
    amountPaid: 0.00,
    balanceDue: 4248.00,
    status: "Overdue",
    items: [
      { description: "Enterprise Pro Suite Licenses", qty: 2, unitPrice: 1900.00, amount: 3800.00 }
    ]
  },
  {
    id: "INV-2024-004",
    invoiceNumber: "INV-2024-004",
    subscriptionId: "SUB-2024-004",
    customerId: "CUST-003",
    customerName: "Arjun",
    customerEmail: "arjun@madurailogistics.in",
    customerAddress: "88 Byepass Road, Ponmeni, Madurai, TN - 625016",
    billingPeriod: "01 Nov 2024 - 30 Nov 2024",
    invoiceDate: "2024-10-28",
    dueDate: "2024-11-12",
    subtotal: 14999.00,
    discount: 0.00,
    taxRate: 18,
    tax: 2699.82,
    total: 17698.82,
    amountPaid: 0.00,
    balanceDue: 17698.82,
    status: "Confirmed",
    items: [
      { description: "Annual Software Fleet License", qty: 1, unitPrice: 14999.00, amount: 14999.00 }
    ]
  }
];

export const initialPayments = [
  {
    id: "PAY-2024-001",
    invoiceId: "INV-2024-001",
    invoiceNumber: "INV-2024-001",
    customerId: "CUST-001",
    customerName: "Kavin",
    amount: 1840.80,
    paymentMethod: "UPI",
    paymentDate: "2024-10-05 14:30",
    transactionRef: "UPI/4289192931/OKAXIS",
    notes: "Full payment received for October subscription."
  },
  {
    id: "PAY-2024-002",
    invoiceId: "INV-2024-002",
    invoiceNumber: "INV-2024-002",
    customerId: "CUST-001",
    customerName: "Kavin",
    amount: 8000.00,
    paymentMethod: "Bank Transfer",
    paymentDate: "2024-10-29 11:15",
    transactionRef: "NEFT/HDFC29819238",
    notes: "Part 1 of 2 payment for Annual Growth Tier."
  }
];

export const monthlyOverview = [
  { month: "Jan", count: 2, revenue: 18000.00 },
  { month: "Feb", count: 2, revenue: 21500.00 },
  { month: "Mar", count: 3, revenue: 26800.00 },
  { month: "Apr", count: 7, revenue: 45200.00 },
  { month: "May", count: 4, revenue: 38400.00 },
  { month: "Jun", count: 6, revenue: 52100.00 },
  { month: "Jul", count: 5, revenue: 49000.00 },
  { month: "Aug", count: 8, revenue: 64000.00 },
  { month: "Sep", count: 7, revenue: 61000.00 },
  { month: "Oct", count: 9, revenue: 78500.00 },
  { month: "Nov", count: 8, revenue: 73000.00 },
  { month: "Dec", count: 11, revenue: 95000.00 }
];

export const upcomingPaymentsFeed = [
  { day: "02", date: "2 Nov 2024", title: "Subscription renewal alert", desc: "3 of 4 payments, Cloud Recharge", time: "10:00 - 11:30", amount: 1840.80, customer: "Kavin", status: "Due Soon" },
  { day: "08", date: "8 Nov 2024", title: "Payment Due", desc: "3 of 4 payments, Infrastructure & Support", time: "11:00 - 12:30", amount: 4248.00, customer: "Nila", status: "Pending" },
  { day: "11", date: "11 Nov 2024", title: "Subscription upgrade", desc: "1 of 2 upgrades, Enterprise PBX", time: "10:00 - 11:30", amount: 1560.00, customer: "Arjun", status: "Upcoming" },
  { day: "23", date: "23 Nov 2024", title: "Bill payment alert", desc: "2 of 4 payments, Cloud Tier", time: "10:00 - 11:30", amount: 9108.82, customer: "Kavin", status: "Upcoming" },
  { day: "27", date: "27 Nov 2024", title: "Subscription Due", desc: "1 of 4 payments, Gateway Mesh", time: "10:00 - 11:30", amount: 700.00, customer: "Yazhini", status: "Upcoming" }
];

export const recentActivities = [
  { id: 1, action: "Payment Received", desc: "₹8,000.00 via Bank Transfer from Kavin", time: "10 mins ago", type: "payment" },
  { id: 2, action: "Quotation Accepted", desc: "QUO-2024-001 converted for Kavin", time: "1 hour ago", type: "quotation" },
  { id: 3, action: "Subscription Paused", desc: "SUB-2024-005 paused by Yazhini", time: "3 hours ago", type: "subscription" },
  { id: 4, action: "Invoice Generated", desc: "INV-2024-004 generated for Arjun", time: "5 hours ago", type: "invoice" },
  { id: 5, action: "New Customer Added", desc: "Harish registered under Salem Natural Agro", time: "1 day ago", type: "customer" }
];
