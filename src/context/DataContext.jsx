import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
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
const DATA_VERSION = 'brightloop_v3_auth';

export const DataProvider = ({ children }) => {
  const isUpToDate = localStorage.getItem('brightloop_data_version') === DATA_VERSION;

  // Real Authenticated User State (Loaded from Backend /me or null)
  const [user, setUser] = useState(() => {
    const local = localStorage.getItem('brightloop_auth_user');
    return local ? JSON.parse(local) : null;
  });

  const [authLoading, setAuthLoading] = useState(true);

  // Initialize data stores
  const [customers, setCustomers] = useState(() => {
    if (!isUpToDate) return initialCustomers;
    const local = localStorage.getItem('brightloop_customers');
    return local ? JSON.parse(local) : initialCustomers;
  });

  const [products, setProducts] = useState(() => {
    if (!isUpToDate) return initialProducts;
    const local = localStorage.getItem('brightloop_products');
    return local ? JSON.parse(local) : initialProducts;
  });

  const [plans, setPlans] = useState(() => {
    if (!isUpToDate) return initialPlans;
    const local = localStorage.getItem('brightloop_plans');
    return local ? JSON.parse(local) : initialPlans;
  });

  const [discounts, setDiscounts] = useState(() => {
    if (!isUpToDate) return initialDiscounts;
    const local = localStorage.getItem('brightloop_discounts');
    return local ? JSON.parse(local) : initialDiscounts;
  });

  const [subscriptions, setSubscriptions] = useState(() => {
    if (!isUpToDate) return initialSubscriptions;
    const local = localStorage.getItem('brightloop_subscriptions');
    return local ? JSON.parse(local) : initialSubscriptions;
  });

  const [quotations, setQuotations] = useState(() => {
    if (!isUpToDate) return initialQuotations;
    const local = localStorage.getItem('brightloop_quotations');
    return local ? JSON.parse(local) : initialQuotations;
  });

  const [invoices, setInvoices] = useState(() => {
    if (!isUpToDate) return initialInvoices;
    const local = localStorage.getItem('brightloop_invoices');
    return local ? JSON.parse(local) : initialInvoices;
  });

  const [payments, setPayments] = useState(() => {
    if (!isUpToDate) return initialPayments;
    const local = localStorage.getItem('brightloop_payments');
    return local ? JSON.parse(local) : initialPayments;
  });

  const [globalSearch, setGlobalSearch] = useState('');

  // Synchronize with backend GET /api/auth/me on mount
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
      }
    };

    fetchSession();
  }, []);

  // Persist current version and state
  useEffect(() => {
    localStorage.setItem('brightloop_data_version', DATA_VERSION);
  }, []);

  useEffect(() => {
    localStorage.setItem('brightloop_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('brightloop_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('brightloop_plans', JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    localStorage.setItem('brightloop_discounts', JSON.stringify(discounts));
  }, [discounts]);

  useEffect(() => {
    localStorage.setItem('brightloop_subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  useEffect(() => {
    localStorage.setItem('brightloop_quotations', JSON.stringify(quotations));
  }, [quotations]);

  useEffect(() => {
    localStorage.setItem('brightloop_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('brightloop_payments', JSON.stringify(payments));
  }, [payments]);

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

  // Customer Actions
  const addCustomer = (customer) => {
    const newCust = {
      ...customer,
      id: `CUST-00${customers.length + 1}`,
      registrationDate: new Date().toISOString().split('T')[0],
      status: customer.status || 'Active',
      avatar: customer.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
    };
    setCustomers([newCust, ...customers]);
    return newCust;
  };

  const updateCustomer = (id, updated) => {
    setCustomers(customers.map(c => c.id === id ? { ...c, ...updated } : c));
  };

  const deleteCustomer = (id) => {
    setCustomers(customers.filter(c => c.id !== id));
  };

  // Product Actions
  const addProduct = (prod) => {
    const newProd = {
      ...prod,
      id: `PROD-00${products.length + 1}`,
      salesPrice: Number(prod.salesPrice) || 0,
      costPrice: Number(prod.costPrice) || 0,
      variants: prod.variants && prod.variants.length > 0 ? prod.variants : [
        { name: "Standard", additionalPrice: 0, finalPrice: Number(prod.salesPrice) || 0 }
      ]
    };
    setProducts([newProd, ...products]);
    return newProd;
  };

  const updateProduct = (id, updated) => {
    setProducts(products.map(p => p.id === id ? { ...p, ...updated } : p));
  };

  const deleteProduct = (id) => {
    setProducts(products.filter(p => p.id !== id));
  };

  // Plan Actions
  const addPlan = (plan) => {
    const newPlan = {
      ...plan,
      id: `PLAN-00${plans.length + 1}`,
      price: Number(plan.price) || 0,
      minQuantity: Number(plan.minQuantity) || 1,
      status: plan.status || 'Active'
    };
    setPlans([newPlan, ...plans]);
    return newPlan;
  };

  const updatePlan = (id, updated) => {
    setPlans(plans.map(p => p.id === id ? { ...p, ...updated } : p));
  };

  const deletePlan = (id) => {
    setPlans(plans.filter(p => p.id !== id));
  };

  // Subscription Actions
  const addSubscription = (subData) => {
    const newSub = {
      ...subData,
      id: `SUB-${new Date().getFullYear()}-00${subscriptions.length + 1}`,
      status: subData.status || 'Draft',
      taxRate: subData.taxRate || 18,
      renewalAlert: "Active",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
    };
    setSubscriptions([newSub, ...subscriptions]);
    return newSub;
  };

  const updateSubscription = (id, updated) => {
    setSubscriptions(subscriptions.map(s => s.id === id ? { ...s, ...updated } : s));
  };

  const changeSubscriptionStatus = (id, status) => {
    setSubscriptions(subscriptions.map(s => s.id === id ? { ...s, status } : s));
  };

  // Quotation Actions
  const addQuotation = (quote) => {
    const newQuote = {
      ...quote,
      id: `QUO-${new Date().getFullYear()}-00${quotations.length + 1}`,
      status: quote.status || 'Draft'
    };
    setQuotations([newQuote, ...quotations]);
    return newQuote;
  };

  const updateQuotation = (id, updated) => {
    setQuotations(quotations.map(q => q.id === id ? { ...q, ...updated } : q));
  };

  // Convert Quotation into active/confirmed Subscription
  const convertQuotationToSubscription = (quotationId) => {
    const quote = quotations.find(q => q.id === quotationId);
    if (!quote) return null;

    const matchedPlan = plans.find(p => p.id === quote.planId) || plans[0];
    const customer = customers.find(c => c.id === quote.customerId);

    const newSub = {
      id: `SUB-${new Date().getFullYear()}-00${subscriptions.length + 1}`,
      customerId: quote.customerId,
      customerName: quote.customerName || (customer ? customer.name : 'Unknown Customer'),
      planId: quote.planId,
      planName: quote.planName || matchedPlan.name,
      productId: quote.items?.[0]?.productId || 'PROD-001',
      variantName: quote.items?.[0]?.productName || 'Standard',
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      billingInterval: matchedPlan.billingInterval || 'Monthly',
      quantity: 1,
      unitPrice: quote.subtotal,
      taxRate: 18,
      taxAmount: quote.tax,
      discountAmount: quote.discount || 0,
      totalAmount: quote.total,
      paymentTerms: "Net 15",
      status: "Confirmed",
      renewalAlert: "Just converted",
      avatar: customer?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
    };

    setSubscriptions([newSub, ...subscriptions]);
    updateQuotation(quotationId, { status: 'Accepted' });

    // Auto-generate invoice
    const newInvoice = {
      id: `INV-${new Date().getFullYear()}-00${invoices.length + 1}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-00${invoices.length + 1}`,
      subscriptionId: newSub.id,
      customerId: newSub.customerId,
      customerName: newSub.customerName,
      customerEmail: customer?.email || "customer@chennaitech.in",
      customerAddress: customer?.address || "Registered Address",
      billingPeriod: `${newSub.startDate} to ${newSub.nextBillingDate}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal: quote.subtotal,
      discount: quote.discount || 0,
      taxRate: 18,
      tax: quote.tax,
      total: quote.total,
      amountPaid: 0,
      balanceDue: quote.total,
      status: "Confirmed",
      items: quote.items.map(it => ({
        description: it.productName,
        qty: it.qty,
        unitPrice: it.unitPrice,
        amount: it.amount
      }))
    };
    setInvoices([newInvoice, ...invoices]);

    return newSub;
  };

  // Invoice Actions
  const addInvoice = (inv) => {
    const newInv = {
      ...inv,
      id: `INV-${new Date().getFullYear()}-00${invoices.length + 1}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-00${invoices.length + 1}`,
      invoiceDate: inv.invoiceDate || new Date().toISOString().split('T')[0],
      status: inv.status || 'Draft',
      amountPaid: Number(inv.amountPaid) || 0,
      balanceDue: Number(inv.total) - (Number(inv.amountPaid) || 0)
    };
    setInvoices([newInv, ...invoices]);
    return newInv;
  };

  const updateInvoice = (id, updated) => {
    setInvoices(invoices.map(inv => inv.id === id ? { ...inv, ...updated } : inv));
  };

  // Payment Actions
  const recordPayment = (paymentData) => {
    const amount = Number(paymentData.amount) || 0;
    const newPayment = {
      ...paymentData,
      id: `PAY-${new Date().getFullYear()}-00${payments.length + 1}`,
      amount,
      paymentDate: paymentData.paymentDate || new Date().toISOString().replace('T', ' ').substring(0, 16),
      transactionRef: paymentData.transactionRef || `UPI/${Math.floor(1000000000 + Math.random() * 9000000000)}/OKAXIS`
    };

    setPayments([newPayment, ...payments]);

    if (paymentData.invoiceId) {
      setInvoices(prevInvoices => prevInvoices.map(inv => {
        if (inv.id === paymentData.invoiceId || inv.invoiceNumber === paymentData.invoiceId) {
          const currentPaid = Number(inv.amountPaid || 0);
          const totalPaid = currentPaid + amount;
          const total = Number(inv.total || 0);
          const newBalance = Math.max(0, total - totalPaid);
          const newStatus = newBalance <= 0.01 ? 'Paid' : totalPaid > 0 ? 'Partially Paid' : inv.status;
          return {
            ...inv,
            amountPaid: totalPaid,
            balanceDue: newBalance,
            status: newStatus
          };
        }
        return inv;
      }));
    }

    return newPayment;
  };

  // Discount Actions
  const addDiscount = (disc) => {
    const newDisc = {
      ...disc,
      id: `DISC-00${discounts.length + 1}`,
      value: Number(disc.value) || 0,
      minPurchase: Number(disc.minPurchase) || 0,
      minQuantity: Number(disc.minQuantity) || 1,
      usageLimit: Number(disc.usageLimit) || 100,
      usageCount: 0,
      status: 'Active'
    };
    setDiscounts([newDisc, ...discounts]);
    return newDisc;
  };

  const updateDiscount = (id, updated) => {
    setDiscounts(discounts.map(d => d.id === id ? { ...d, ...updated } : d));
  };

  const deleteDiscount = (id) => {
    setDiscounts(discounts.filter(d => d.id !== id));
  };

  return (
    <DataContext.Provider value={{
      user,
      setUser,
      authLoading,
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
