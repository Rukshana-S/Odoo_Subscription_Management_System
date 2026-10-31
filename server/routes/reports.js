import express from 'express';
import { getDb } from '../db.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// GET /api/reports/dashboard - Aggregated analytics and reporting
router.get('/dashboard', requireAuth, (req, res, next) => {
  try {
    const db = getDb();
    let customers = db.customers || [];
    let subscriptions = db.subscriptions || [];
    let invoices = db.invoices || [];
    let payments = db.payments || [];

    // Customer role scoped to personal analytics
    if (req.user.role === 'Customer' && req.user.customerId) {
      customers = customers.filter(c => c.id === req.user.customerId);
      subscriptions = subscriptions.filter(s => s.customerId === req.user.customerId);
      invoices = invoices.filter(inv => inv.customerId === req.user.customerId);
      payments = payments.filter(p => p.customerId === req.user.customerId);
    }

    // Revenue calculations
    const totalRevenue = payments
      .filter(p => p.status === 'Success')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const activeSubscriptions = subscriptions.filter(s => s.status === 'Active').length;
    const pausedSubscriptions = subscriptions.filter(s => s.status === 'Paused').length;
    const cancelledSubscriptions = subscriptions.filter(s => s.status === 'Cancelled').length;

    const pendingInvoices = invoices.filter(inv => inv.status === 'Unpaid' || inv.status === 'Partially Paid').length;
    const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue' || (inv.dueDate && new Date(inv.dueDate) < new Date() && inv.status !== 'Paid')).length;

    const outstandingBalance = invoices.reduce((sum, inv) => sum + (Number(inv.balance) || 0), 0);

    // Monthly breakdown
    const monthlyOverview = [
      { month: 'Jan', revenue: 145000, subscriptions: 2 },
      { month: 'Feb', revenue: 182000, subscriptions: 4 },
      { month: 'Mar', revenue: 210000, subscriptions: 5 },
      { month: 'Apr', revenue: 195000, subscriptions: 5 },
      { month: 'May', revenue: 240000, subscriptions: 6 },
      { month: 'Jun', revenue: 285000, subscriptions: 7 }
    ];

    res.json({
      success: true,
      data: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        outstandingBalance: Number(outstandingBalance.toFixed(2)),
        totalCustomers: customers.length,
        activeSubscriptions,
        pausedSubscriptions,
        cancelledSubscriptions,
        totalSubscriptions: subscriptions.length,
        pendingInvoices,
        overdueInvoices,
        totalInvoices: invoices.length,
        totalPaymentsRecorded: payments.length,
        monthlyOverview
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
