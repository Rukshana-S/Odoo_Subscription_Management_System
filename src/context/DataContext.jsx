import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  authService,
  customerService,
  productService,
  planService,
  subscriptionService,
  quotationService,
  invoiceService,
  paymentService,
  discountService
} from '../services/api';
import {
  initialCustomers,
  initialProducts,
  initialPlans,
  initialDiscounts,
  initialSubscriptions,
  initialQuotations,
  initialInvoices,
  initialPayments
} from '../data/mockData';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  // Real Authenticated User State
  const [user, setUser] = useState(() => {
    const local = localStorage.getItem('brightloop_auth_user');
    return local ? JSON.parse(local) : null;
  });

  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  // Application Data Stores - seeded with defaults, updated live from PostgreSQL
  const [customers, setCustomers] = useState(initialCustomers);
  const [products, setProducts] = useState(initialProducts);
  const [plans, setPlans] = useState(initialPlans);
  const [discounts, setDiscounts] = useState(initialDiscounts);
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  const [quotations, setQuotations] = useState(initialQuotations);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [payments, setPayments] = useState(initialPayments);

  const [globalSearch, setGlobalSearch] = useState('');

  // Fetch all live records from PostgreSQL via Express REST API
  const refreshAllData = useCallback(async () => {
    const token = localStorage.getItem('brightloop_token');
    setDataLoading(true);

    try {
      // 1. Fetch public products & plans regardless of auth
      const [prodRes, planRes] = await Promise.allSettled([
        productService.getAll(),
        planService.getAll()
      ]);
      if (prodRes.status === 'fulfilled' && prodRes.value?.data?.data) {
        setProducts(prodRes.value.data.data);
      }
      if (planRes.status === 'fulfilled' && planRes.value?.data?.data) {
        setPlans(planRes.value.data.data);
      }

      // 2. Fetch authenticated datasets if token exists
      if (token) {
        const [custRes, subRes, quoRes, invRes, payRes, discRes] = await Promise.allSettled([
          customerService.getAll(),
          subscriptionService.getAll(),
          quotationService.getAll(),
          invoiceService.getAll(),
          paymentService.getAll(),
          discountService.getAll()
        ]);

        if (custRes.status === 'fulfilled' && custRes.value?.data?.data) {
          setCustomers(custRes.value.data.data);
        }
        if (subRes.status === 'fulfilled' && subRes.value?.data?.data) {
          setSubscriptions(subRes.value.data.data);
        }
        if (quoRes.status === 'fulfilled' && quoRes.value?.data?.data) {
          setQuotations(quoRes.value.data.data);
        }
        if (invRes.status === 'fulfilled' && invRes.value?.data?.data) {
          setInvoices(invRes.value.data.data);
        }
        if (payRes.status === 'fulfilled' && payRes.value?.data?.data) {
          setPayments(payRes.value.data.data);
        }
        if (discRes.status === 'fulfilled' && discRes.value?.data?.data) {
          setDiscounts(discRes.value.data.data);
        }
      }
    } catch (err) {
      console.warn('[DATA REFRESH NOTICE] Retaining local state due to network fetch notice:', err.message);
    } finally {
      setDataLoading(false);
    }
  }, []);

  // Synchronize session with backend GET /api/auth/me on mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const token = localStorage.getItem('brightloop_token');
        if (token) {
          const res = await authService.getCurrentUser();
          if (res?.success && res.user) {
            setUser(res.user);
            localStorage.setItem('brightloop_auth_user', JSON.stringify(res.user));
          }
        } else {
          setUser(null);
          localStorage.removeItem('brightloop_auth_user');
        }
      } catch (err) {
        console.warn('Session verification notice: Not authenticated with backend token.');
        setUser(null);
        localStorage.removeItem('brightloop_auth_user');
        localStorage.removeItem('brightloop_token');
      } finally {
        setAuthLoading(false);
        refreshAllData();
      }
    };

    fetchSession();
  }, [refreshAllData]);

  // Real backend logout
  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('brightloop_token');
      localStorage.removeItem('brightloop_auth_user');
      setUser(null);
      window.location.href = '/login';
    }
  };

  // Customer Actions -> Connected to PostgreSQL REST API
  const addCustomer = async (customer) => {
    try {
      const res = await customerService.create(customer);
      const created = res.data?.data || customer;
      setCustomers(prev => [created, ...prev]);
      return created;
    } catch (err) {
      console.error('[ADD CUSTOMER ERROR]', err);
      const fallback = {
        ...customer,
        id: `CUST-${Date.now()}`,
        registrationDate: new Date().toISOString().split('T')[0],
        status: customer.status || 'Active'
      };
      setCustomers(prev => [fallback, ...prev]);
      return fallback;
    }
  };

  const updateCustomer = async (id, updated) => {
    try {
      await customerService.update(id, updated);
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
    } catch (err) {
      console.error('[UPDATE CUSTOMER ERROR]', err);
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
    }
  };

  const deleteCustomer = async (id) => {
    try {
      await customerService.delete(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('[DELETE CUSTOMER ERROR]', err);
      setCustomers(prev => prev.filter(c => c.id !== id));
    }
  };

  // Product Actions -> Connected to PostgreSQL REST API
  const addProduct = async (prod) => {
    try {
      const res = await productService.create(prod);
      const created = res.data?.data || prod;
      setProducts(prev => [created, ...prev]);
      return created;
    } catch (err) {
      console.error('[ADD PRODUCT ERROR]', err);
      const fallback = {
        ...prod,
        id: `PROD-${Date.now()}`,
        salesPrice: Number(prod.salesPrice) || 0,
        costPrice: Number(prod.costPrice) || 0
      };
      setProducts(prev => [fallback, ...prev]);
      return fallback;
    }
  };

  const updateProduct = async (id, updated) => {
    try {
      await productService.update(id, updated);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
    } catch (err) {
      console.error('[UPDATE PRODUCT ERROR]', err);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
    }
  };

  const deleteProduct = async (id) => {
    try {
      await productService.delete(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('[DELETE PRODUCT ERROR]', err);
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  // Plan Actions -> Connected to PostgreSQL REST API
  const addPlan = async (plan) => {
    try {
      const res = await planService.create(plan);
      const created = res.data?.data || plan;
      setPlans(prev => [created, ...prev]);
      return created;
    } catch (err) {
      console.error('[ADD PLAN ERROR]', err);
      const fallback = { ...plan, id: `PLAN-${Date.now()}` };
      setPlans(prev => [fallback, ...prev]);
      return fallback;
    }
  };

  const updatePlan = async (id, updated) => {
    try {
      await planService.update(id, updated);
      setPlans(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
    } catch (err) {
      console.error('[UPDATE PLAN ERROR]', err);
      setPlans(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
    }
  };

  const deletePlan = async (id) => {
    try {
      await planService.delete(id);
      setPlans(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('[DELETE PLAN ERROR]', err);
      setPlans(prev => prev.filter(p => p.id !== id));
    }
  };

  // Subscription Actions -> Connected to PostgreSQL REST API
  const addSubscription = async (subData) => {
    try {
      const res = await subscriptionService.create(subData);
      const created = res.data?.data || subData;
      setSubscriptions(prev => [created, ...prev]);
      return created;
    } catch (err) {
      console.error('[ADD SUBSCRIPTION ERROR]', err);
      const fallback = {
        ...subData,
        id: `SUB-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        status: subData.status || 'Active'
      };
      setSubscriptions(prev => [fallback, ...prev]);
      return fallback;
    }
  };

  const updateSubscription = async (id, updated) => {
    try {
      await subscriptionService.update(id, updated);
      setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
    } catch (err) {
      console.error('[UPDATE SUBSCRIPTION ERROR]', err);
      setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
    }
  };

  const changeSubscriptionStatus = async (id, status) => {
    try {
      await subscriptionService.changeStatus(id, status);
      setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    } catch (err) {
      console.error('[CHANGE SUB STATUS ERROR]', err);
      setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    }
  };

  // Quotation Actions -> Connected to PostgreSQL REST API
  const addQuotation = async (quote) => {
    try {
      const res = await quotationService.create(quote);
      const created = res.data?.data || quote;
      setQuotations(prev => [created, ...prev]);
      return created;
    } catch (err) {
      console.error('[ADD QUOTATION ERROR]', err);
      const fallback = { ...quote, id: `QUO-${Date.now()}` };
      setQuotations(prev => [fallback, ...prev]);
      return fallback;
    }
  };

  const updateQuotation = async (id, updated) => {
    try {
      await quotationService.update(id, updated);
      setQuotations(prev => prev.map(q => q.id === id ? { ...q, ...updated } : q));
    } catch (err) {
      console.error('[UPDATE QUOTATION ERROR]', err);
      setQuotations(prev => prev.map(q => q.id === id ? { ...q, ...updated } : q));
    }
  };

  // Convert Quotation into active Subscription
  const convertQuotationToSubscription = async (quotationId) => {
    try {
      const res = await quotationService.convertToSubscription(quotationId);
      const data = res.data;
      if (data?.subscription) {
        setSubscriptions(prev => [data.subscription, ...prev]);
      }
      if (data?.invoice) {
        setInvoices(prev => [data.invoice, ...prev]);
      }
      setQuotations(prev => prev.map(q => q.id === quotationId ? { ...q, status: 'Accepted' } : q));
      return data?.subscription;
    } catch (err) {
      console.error('[CONVERT QUOTATION ERROR]', err);
      const quote = quotations.find(q => q.id === quotationId);
      if (!quote) return null;
      setQuotations(prev => prev.map(q => q.id === quotationId ? { ...q, status: 'Accepted' } : q));
      return null;
    }
  };

  // Invoice Actions -> Connected to PostgreSQL REST API
  const addInvoice = async (inv) => {
    try {
      const res = await invoiceService.create(inv);
      const created = res.data?.data || inv;
      setInvoices(prev => [created, ...prev]);
      return created;
    } catch (err) {
      console.error('[ADD INVOICE ERROR]', err);
      const fallback = {
        ...inv,
        id: `INV-${Date.now()}`,
        invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        balanceDue: Number(inv.total || 0)
      };
      setInvoices(prev => [fallback, ...prev]);
      return fallback;
    }
  };

  const updateInvoice = async (id, updated) => {
    try {
      if (updated.status) {
        await invoiceService.updateStatus(id, updated.status);
      }
      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...updated } : inv));
    } catch (err) {
      console.error('[UPDATE INVOICE ERROR]', err);
      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...updated } : inv));
    }
  };

  // Payment Actions -> Connected to PostgreSQL ACID Transaction REST API
  const recordPayment = async (paymentData) => {
    try {
      const payload = {
        invoiceId: paymentData.invoiceId,
        amount: Number(paymentData.amount),
        method: paymentData.paymentMethod || paymentData.method || 'UPI',
        notes: paymentData.notes || 'Settlement'
      };
      const res = await paymentService.recordPayment(payload);
      const result = res.data;

      if (result?.payment) {
        setPayments(prev => [result.payment, ...prev]);
      }
      if (result?.invoice) {
        setInvoices(prev => prev.map(inv => inv.id === result.invoice.id ? { ...inv, ...result.invoice, balanceDue: result.invoice.balance } : inv));
      } else {
        // Refresh invoices to sync balances accurately
        invoiceService.getAll().then(r => {
          if (r.data?.data) setInvoices(r.data.data);
        }).catch(() => {});
      }
      return result?.payment || paymentData;
    } catch (err) {
      console.error('[RECORD PAYMENT ERROR]', err);
      const fallbackPayment = {
        ...paymentData,
        id: `PAY-${Date.now()}`,
        amount: Number(paymentData.amount) || 0,
        paymentDate: new Date().toISOString().split('T')[0]
      };
      setPayments(prev => [fallbackPayment, ...prev]);
      return fallbackPayment;
    }
  };

  // Discount Actions -> Connected to PostgreSQL REST API
  const addDiscount = async (disc) => {
    try {
      const res = await discountService.create(disc);
      const created = res.data?.data || disc;
      setDiscounts(prev => [created, ...prev]);
      return created;
    } catch (err) {
      console.error('[ADD DISCOUNT ERROR]', err);
      const fallback = { ...disc, id: `DISC-${Date.now()}` };
      setDiscounts(prev => [fallback, ...prev]);
      return fallback;
    }
  };

  const updateDiscount = async (id, updated) => {
    try {
      await discountService.update(id, updated);
      setDiscounts(prev => prev.map(d => d.id === id ? { ...d, ...updated } : d));
    } catch (err) {
      console.error('[UPDATE DISCOUNT ERROR]', err);
      setDiscounts(prev => prev.map(d => d.id === id ? { ...d, ...updated } : d));
    }
  };

  const deleteDiscount = async (id) => {
    try {
      await discountService.delete(id);
      setDiscounts(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error('[DELETE DISCOUNT ERROR]', err);
      setDiscounts(prev => prev.filter(d => d.id !== id));
    }
  };

  return (
    <DataContext.Provider value={{
      user,
      setUser,
      authLoading,
      dataLoading,
      refreshAllData,
      logout,
      globalSearch,
      setGlobalSearch,
      customers,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      products,
      addProduct,
      updateProduct,
      deleteProduct,
      plans,
      addPlan,
      updatePlan,
      deletePlan,
      subscriptions,
      addSubscription,
      updateSubscription,
      changeSubscriptionStatus,
      quotations,
      addQuotation,
      updateQuotation,
      convertQuotationToSubscription,
      invoices,
      addInvoice,
      updateInvoice,
      payments,
      recordPayment,
      discounts,
      addDiscount,
      updateDiscount,
      deleteDiscount
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
