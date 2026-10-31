import bcrypt from 'bcryptjs';

// Pre-computed bcrypt hash for 'BrightLoop@2026!'
export const DEMO_PASSWORD = 'BrightLoop@2026!';
export const DEMO_PASSWORD_HASH = bcrypt.hashSync(DEMO_PASSWORD, 10);

export const mockUsers = [
  // 1 Admin
  {
    id: 'USER-ADMIN-01',
    first_name: 'Arul',
    last_name: 'Selvan',
    email: 'arul@brightloop.in',
    password_hash: DEMO_PASSWORD_HASH,
    role: 'Admin',
    token_version: 1,
    is_active: true,
    email_verified: true,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  // 3 Staff
  {
    id: 'USER-STAFF-01',
    first_name: 'Priya',
    last_name: 'Rajan',
    email: 'priya@brightloop.in',
    password_hash: DEMO_PASSWORD_HASH,
    role: 'Staff',
    token_version: 1,
    is_active: true,
    email_verified: true,
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USER-STAFF-02',
    first_name: 'Dharan',
    last_name: 'Kumar',
    email: 'dharan@brightloop.in',
    password_hash: DEMO_PASSWORD_HASH,
    role: 'Staff',
    token_version: 1,
    is_active: true,
    email_verified: true,
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USER-STAFF-03',
    first_name: 'Iniya',
    last_name: 'Sundar',
    email: 'iniya@brightloop.in',
    password_hash: DEMO_PASSWORD_HASH,
    role: 'Staff',
    token_version: 1,
    is_active: true,
    email_verified: true,
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  // 10 Customers
  {
    id: 'USER-CUST-01',
    first_name: 'Kavin',
    last_name: 'Moorthy',
    email: 'kavin@chennaitech.in',
    password_hash: DEMO_PASSWORD_HASH,
    role: 'Customer',
    token_version: 1,
    is_active: true,
    email_verified: true
  },
  {
    id: 'USER-CUST-02',
    first_name: 'Nila',
    last_name: 'Venkat',
    email: 'nila@kovaisolutions.com',
    password_hash: DEMO_PASSWORD_HASH,
    role: 'Customer',
    token_version: 1,
    is_active: true,
    email_verified: true
  },
  {
    id: 'USER-CUST-03',
    first_name: 'Hari',
    last_name: 'Prasad',
    email: 'hari@maduraienterprises.in',
    password_hash: DEMO_PASSWORD_HASH,
    role: 'Customer',
    token_version: 1,
    is_active: true,
    email_verified: true
  },
  {
    id: 'USER-CUST-04',
    first_name: 'Yazhini',
    last_name: 'Kannan',
    email: 'yazhini@trichydigital.com',
    password_hash: DEMO_PASSWORD_HASH,
    role: 'Customer',
    token_version: 1,
    is_active: true,
    email_verified: true
  },
  {
    id: 'USER-CUST-05',
    first_name: 'Vimal',
    last_name: 'Chandran',
    email: 'vimal@salemlogistics.in',
    password_hash: DEMO_PASSWORD_HASH,
    role: 'Customer',
    token_version: 1,
    is_active: true,
    email_verified: true
  },
  {
    id: 'USER-CUST-06',
    first_name: 'Keerthi',
    last_name: 'Vasan',
    email: 'keerthi@erodeglobal.in',
    password_hash: DEMO_PASSWORD_HASH,
    role: 'Customer',
    token_version: 1,
    is_active: true,
    email_verified: true
  },
  {
    id: 'USER-CUST-07',
    first_name: 'Naveen',
    last_name: 'Balaji',
    email: 'naveen@tiruppurtextiles.com',
    password_hash: DEMO_PASSWORD_HASH,
    role: 'Customer',
    token_version: 1,
    is_active: true,
    email_verified: true
  },
  {
    id: 'USER-CUST-08',
    first_name: 'Divya',
    last_name: 'Prakash',
    email: 'divya@chennaimedia.org',
    password_hash: DEMO_PASSWORD_HASH,
    role: 'Customer',
    token_version: 1,
    is_active: true,
    email_verified: true
  },
  {
    id: 'USER-CUST-09',
    first_name: 'Gokul',
    last_name: 'Nath',
    email: 'gokul@velloretech.in',
    password_hash: DEMO_PASSWORD_HASH,
    role: 'Customer',
    token_version: 1,
    is_active: true,
    email_verified: true
  },
  {
    id: 'USER-CUST-10',
    first_name: 'Swetha',
    last_name: 'Mani',
    email: 'swetha@thanjavuragro.in',
    password_hash: DEMO_PASSWORD_HASH,
    role: 'Customer',
    token_version: 1,
    is_active: true,
    email_verified: true
  }
];

export const mockCustomers = [
  {
    id: 'CUST-001',
    user_id: 'USER-CUST-01',
    customer_code: 'BL-CUST-101',
    name: 'Kavin',
    email: 'kavin@chennaitech.in',
    phone: '+91 98401 23456',
    company_name: 'Kavin Tech Solutions Pvt Ltd',
    address: '42 OMR IT Expressway, Thoraipakkam',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600097',
    status: 'Active'
  },
  {
    id: 'CUST-002',
    user_id: 'USER-CUST-02',
    customer_code: 'BL-CUST-102',
    name: 'Nila',
    email: 'nila@kovaisolutions.com',
    phone: '+91 94432 78901',
    company_name: 'Kovai Dynamic Fabrics',
    address: '15 Avinashi Road, Peelamedu',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    pincode: '641004',
    status: 'Active'
  },
  {
    id: 'CUST-003',
    user_id: 'USER-CUST-03',
    customer_code: 'BL-CUST-103',
    name: 'Hari',
    email: 'hari@maduraienterprises.in',
    phone: '+91 97901 44556',
    company_name: 'Madurai Cargo & Freightways',
    address: '88 Byepass Road, Ponmeni',
    city: 'Madurai',
    state: 'Tamil Nadu',
    pincode: '625016',
    status: 'Active'
  },
  {
    id: 'CUST-004',
    user_id: 'USER-CUST-04',
    customer_code: 'BL-CUST-104',
    name: 'Yazhini',
    email: 'yazhini@trichydigital.com',
    phone: '+91 96291 33445',
    company_name: 'Trichy Creative Media Studio',
    address: '24 Thillai Nagar Main Road',
    city: 'Tiruchirappalli',
    state: 'Tamil Nadu',
    pincode: '620018',
    status: 'Active'
  },
  {
    id: 'CUST-005',
    user_id: 'USER-CUST-05',
    customer_code: 'BL-CUST-105',
    name: 'Vimal',
    email: 'vimal@salemlogistics.in',
    phone: '+91 95001 88990',
    company_name: 'Salem Steel & Agro Haulers',
    address: '102 Meyyanur Bypass',
    city: 'Salem',
    state: 'Tamil Nadu',
    pincode: '636004',
    status: 'Active'
  },
  {
    id: 'CUST-006',
    user_id: 'USER-CUST-06',
    customer_code: 'BL-CUST-106',
    name: 'Keerthi',
    email: 'keerthi@erodeglobal.in',
    phone: '+91 94881 22334',
    company_name: 'Erode Turmeric Agro Traders',
    address: '77 Perundurai Road',
    city: 'Erode',
    state: 'Tamil Nadu',
    pincode: '638011',
    status: 'Active'
  },
  {
    id: 'CUST-007',
    user_id: 'USER-CUST-07',
    customer_code: 'BL-CUST-107',
    name: 'Naveen',
    email: 'naveen@tiruppurtextiles.com',
    phone: '+91 98941 55667',
    company_name: 'Tiruppur Export Knitwears',
    address: '12 Palladam Road',
    city: 'Tiruppur',
    state: 'Tamil Nadu',
    pincode: '641604',
    status: 'Active'
  },
  {
    id: 'CUST-008',
    user_id: 'USER-CUST-08',
    customer_code: 'BL-CUST-108',
    name: 'Divya',
    email: 'divya@chennaimedia.org',
    phone: '+91 98410 77889',
    company_name: 'Madras Digital Broadcasts',
    address: '56 Anna Salai, Mount Road',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600002',
    status: 'Active'
  },
  {
    id: 'CUST-009',
    user_id: 'USER-CUST-09',
    customer_code: 'BL-CUST-109',
    name: 'Gokul',
    email: 'gokul@velloretech.in',
    phone: '+91 99441 33221',
    company_name: 'Vellore Health Systems',
    address: '33 Arcot Road, Katpadi',
    city: 'Vellore',
    state: 'Tamil Nadu',
    pincode: '632014',
    status: 'Active'
  },
  {
    id: 'CUST-010',
    user_id: 'USER-CUST-10',
    customer_code: 'BL-CUST-110',
    name: 'Swetha',
    email: 'swetha@thanjavuragro.in',
    phone: '+91 97891 11223',
    company_name: 'Delta Heritage Paddy Organics',
    address: '19 South Rampart',
    city: 'Thanjavur',
    state: 'Tamil Nadu',
    pincode: '613001',
    status: 'Inactive'
  }
];

export const mockProducts = [
  {
    id: 'PROD-001',
    name: 'BrightLoop Enterprise Suite',
    description: 'Core subscription billing, quotation engine, and client management platform.',
    category: 'Enterprise SaaS',
    price: 4999.00,
    cost_price: 1500.00,
    gst_rate: 18.00,
    billing_interval: 'Monthly'
  },
  {
    id: 'PROD-002',
    name: 'Cloud Hosting & Storage Engine',
    description: 'High-availability PostgreSQL replication cluster with daily automated backups.',
    category: 'Cloud Infrastructure',
    price: 2499.00,
    cost_price: 800.00,
    gst_rate: 18.00,
    billing_interval: 'Monthly'
  },
  {
    id: 'PROD-003',
    name: 'High-Throughput API Gateway',
    description: 'Sub-millisecond API rate limiting, webhook distribution, and token rotation.',
    category: 'Developer Tools',
    price: 1899.00,
    cost_price: 500.00,
    gst_rate: 18.00,
    billing_interval: 'Monthly'
  },
  {
    id: 'PROD-004',
    name: 'Automated GST Invoice Dispatcher',
    description: 'Integrated Indian GST compliance generator with digital seal stamping.',
    category: 'Fintech & Accounting',
    price: 1299.00,
    cost_price: 350.00,
    gst_rate: 18.00,
    billing_interval: 'Monthly'
  },
  {
    id: 'PROD-005',
    name: 'Dedicated 24/7 SLA Engineering Support',
    description: 'Guaranteed 15-minute response SLA from senior infrastructure engineers.',
    category: 'Managed Services',
    price: 3500.00,
    cost_price: 1200.00,
    gst_rate: 18.00,
    billing_interval: 'Monthly'
  },
  {
    id: 'PROD-006',
    name: 'Omnichannel Customer Notification Hub',
    description: 'Multi-provider SMS, WhatsApp Business, and transactional email distribution.',
    category: 'Communications',
    price: 1499.00,
    cost_price: 450.00,
    gst_rate: 18.00,
    billing_interval: 'Monthly'
  },
  {
    id: 'PROD-007',
    name: 'Security Shield & WAF Analyzer',
    description: 'Continuous intrusion detection, IP rate-limiting, and real-time security auditing.',
    category: 'Cybersecurity',
    price: 2899.00,
    cost_price: 900.00,
    gst_rate: 18.00,
    billing_interval: 'Monthly'
  },
  {
    id: 'PROD-008',
    name: 'Custom ERP Data Sync Pipeline',
    description: 'Bidirectional ETL synchronizer for Odoo ERP, Tally, and Zoho Books.',
    category: 'Integrations',
    price: 3999.00,
    cost_price: 1100.00,
    gst_rate: 18.00,
    billing_interval: 'Quarterly'
  }
];

export const mockPlans = [
  {
    id: 'PLAN-001',
    name: 'Starter Monthly Cloud',
    code: 'STARTER_MONTHLY',
    description: 'Designed for single-branch businesses and rising startups.',
    billing_interval: 'Monthly',
    price: 1499.00,
    popular: false,
    features: JSON.stringify(['Up to 100 subscriptions', 'Standard email invoices', 'Community support'])
  },
  {
    id: 'PLAN-002',
    name: 'Professional Monthly Cloud',
    code: 'PRO_MONTHLY',
    description: 'Ideal for scaling businesses requiring automated GST generation and webhook alerts.',
    billing_interval: 'Monthly',
    price: 3499.00,
    popular: true,
    features: JSON.stringify(['Unlimited subscriptions', 'Automated GST billing', 'Multi-user staff logins', '15m SLA support'])
  },
  {
    id: 'PLAN-003',
    name: 'Growth Quarterly Cloud',
    code: 'GROWTH_QUARTERLY',
    description: 'Quarterly prepaid subscription with a 10% platform fee discount.',
    billing_interval: 'Quarterly',
    price: 8999.00,
    popular: false,
    features: JSON.stringify(['All Professional features', 'Quarterly recurring invoices', 'Priority account manager'])
  },
  {
    id: 'PLAN-004',
    name: 'Scale Half-Yearly Cloud',
    code: 'SCALE_HALFYEARLY',
    description: 'Six months continuous coverage with custom invoice branding.',
    billing_interval: 'Half-Yearly',
    price: 16999.00,
    popular: false,
    features: JSON.stringify(['Custom ERP connectors', 'Dedicated PostgreSQL database pool', 'Custom domain mapping'])
  },
  {
    id: 'PLAN-005',
    name: 'Enterprise Annual Cloud',
    code: 'ENTERPRISE_ANNUAL',
    description: 'Full-year complete enterprise access with audit compliance and 24/7 dedicated engineering.',
    billing_interval: 'Yearly',
    price: 31999.00,
    popular: false,
    features: JSON.stringify(['Full platform features', 'Unlimited staff accounts', 'Custom webhook webhooks', 'Dedicated database instance'])
  },
  {
    id: 'PLAN-006',
    name: 'Ultra High-Volume Annual',
    code: 'ULTRA_ANNUAL',
    description: 'Custom infrastructure for enterprises with over 50,000 monthly invoices.',
    billing_interval: 'Yearly',
    price: 59999.00,
    popular: false,
    features: JSON.stringify(['Multi-region failover', 'White-label client portal', 'Custom SLA contracts', 'On-premise hybrid backup'])
  }
];

export const mockDiscounts = [
  {
    id: 'DISC-001',
    code: 'WELCOME20',
    description: '20% inaugural discount for newly registered Tamil Nadu enterprises.',
    discount_type: 'Percentage',
    discount_value: 20.00,
    max_uses: 200,
    used_count: 14,
    valid_until: '2026-12-31'
  },
  {
    id: 'DISC-002',
    code: 'PONGAL2026',
    description: 'Flat ₹500 discount on annual billing plans.',
    discount_type: 'Fixed',
    discount_value: 500.00,
    max_uses: 100,
    used_count: 42,
    valid_until: '2026-12-31'
  },
  {
    id: 'DISC-003',
    code: 'DIWALI25',
    description: '25% festive discount on Professional and Growth packages.',
    discount_type: 'Percentage',
    discount_value: 25.00,
    max_uses: 150,
    used_count: 89,
    valid_until: '2026-11-30'
  },
  {
    id: 'DISC-004',
    code: 'STARTUP1000',
    description: 'Flat ₹1,000 credit for verified MSME registrations.',
    discount_type: 'Fixed',
    discount_value: 1000.00,
    max_uses: 50,
    used_count: 12,
    valid_until: '2026-12-31'
  },
  {
    id: 'DISC-005',
    code: 'RENEW15',
    description: '15% loyalty discount for annual subscription renewals.',
    discount_type: 'Percentage',
    discount_value: 15.00,
    max_uses: 300,
    used_count: 65,
    valid_until: '2026-12-31'
  }
];

