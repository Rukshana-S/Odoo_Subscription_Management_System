import express from 'express';
import { getPool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/reports/dashboard & /api/dashboard/stats
router.get(['/dashboard', '/stats'], requireAuth, async (req, res, next) => {
  try {
    const pool = getPool();
    const isCustomer = req.user.role === 'Customer' && req.user.customerId;
    const custId = req.user.customerId;

    // 1. Total Revenue from successful payments
    let revQuery = "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'Success'";
    const revParams = [];
    if (isCustomer) {
      revParams.push(custId);
      revQuery += ` AND customer_id = $${revParams.length}`;
    }
    const { rows: revRows } = await pool.query(revQuery, revParams);
    const totalRevenue = Number(revRows[0].total);

    // 2. Customers Count
    let custQuery = 'SELECT COUNT(*) as cnt FROM customers';
    const custParams = [];
    if (isCustomer) {
      custParams.push(custId);
      custQuery += ` WHERE id = $${custParams.length}`;
    }
    const { rows: custRows } = await pool.query(custQuery, custParams);
    const totalCustomers = Number(custRows[0].cnt);

    // 3. Subscriptions Status Breakdown
    let subQuery = 'SELECT status, COUNT(*) as cnt FROM subscriptions';
    const subParams = [];
    if (isCustomer) {
      subParams.push(custId);
      subQuery += ` WHERE customer_id = $${subParams.length}`;
    }
    subQuery += ' GROUP BY status';
    const { rows: subRows } = await pool.query(subQuery, subParams);

    let activeSubscriptions = 0;
    let pausedSubscriptions = 0;
    let cancelledSubscriptions = 0;
    let totalSubscriptions = 0;

    subRows.forEach(r => {
      const c = Number(r.cnt);
      totalSubscriptions += c;
      if (r.status === 'Active') activeSubscriptions = c;
      if (r.status === 'Paused') pausedSubscriptions = c;
      if (r.status === 'Cancelled') cancelledSubscriptions = c;
    });

    // 4. Invoices and Outstanding Balances
    let invQuery = `
      SELECT 
        COUNT(*) as total_invoices,
        COALESCE(SUM(balance), 0) as outstanding_balance,
        COUNT(CASE WHEN status IN ('Unpaid', 'Partially Paid') THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'Overdue' OR (due_date < CURRENT_DATE AND status != 'Paid') THEN 1 END) as overdue_count
      FROM invoices
    `;
    const invParams = [];
    if (isCustomer) {
      invParams.push(custId);
      invQuery += ` WHERE customer_id = $${invParams.length}`;
    }
    const { rows: invRows } = await pool.query(invQuery, invParams);

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
        totalRevenue,
        outstandingBalance: Number(invRows[0].outstanding_balance),
        totalCustomers,
        activeSubscriptions,
        pausedSubscriptions,
        cancelledSubscriptions,
        totalSubscriptions,
        pendingInvoices: Number(invRows[0].pending_count),
        overdueInvoices: Number(invRows[0].overdue_count),
        totalInvoices: Number(invRows[0].total_invoices),
        monthlyOverview
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
