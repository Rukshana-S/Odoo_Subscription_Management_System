import express from 'express';
import { getDb, saveDb, logAudit } from '../db.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// GET /api/products - List all products
router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    let products = db.products || [];

    const { search, category, status } = req.query;
    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }
    if (category && category !== 'all') {
      products = products.filter(p => p.category && p.category.toLowerCase() === category.toLowerCase());
    }
    if (status && status !== 'all') {
      products = products.filter(p => p.status && p.status.toLowerCase() === status.toLowerCase());
    }

    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id - Single product
router.get('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const product = (db.products || []).find(p => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

// POST /api/products - Create product (Admin, Staff)
router.post('/', requireAuth, requireRoles(['Admin', 'Staff']), (req, res, next) => {
  try {
    const { name, category, price, billingInterval, description, status } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Product name and price are required.' });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ success: false, message: 'Price must be a valid non-negative number.' });
    }

    const db = getDb();
    db.products = db.products || [];

    const newProduct = {
      id: `PROD-${String(db.products.length + 1).padStart(3, '0')}`,
      name: name.trim(),
      category: category || 'SaaS',
      price: numPrice,
      billingInterval: billingInterval || 'Monthly',
      description: description || '',
      status: status || 'Active',
      features: req.body.features || [],
      createdAt: new Date().toISOString()
    };

    db.products.push(newProduct);
    saveDb(db);

    logAudit({
      userId: req.user.id,
      email: req.user.email,
      action: 'PRODUCT_CREATED',
      details: { productId: newProduct.id, name: newProduct.name },
      ip: req.ip
    });

    res.status(201).json({ success: true, message: 'Product created successfully.', data: newProduct });
  } catch (err) {
    next(err);
  }
});

// PUT /api/products/:id - Update product (Admin, Staff)
router.put('/:id', requireAuth, requireRoles(['Admin', 'Staff']), (req, res, next) => {
  try {
    const db = getDb();
    const index = (db.products || []).findIndex(p => p.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const { name, category, price, billingInterval, description, status, features } = req.body;
    const product = db.products[index];

    if (name) product.name = name.trim();
    if (category) product.category = category.trim();
    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return res.status(400).json({ success: false, message: 'Invalid price value.' });
      }
      product.price = numPrice;
    }
    if (billingInterval) product.billingInterval = billingInterval;
    if (description !== undefined) product.description = description;
    if (status) product.status = status;
    if (features) product.features = features;

    product.updatedAt = new Date().toISOString();
    db.products[index] = product;
    saveDb(db);

    logAudit({
      userId: req.user.id,
      email: req.user.email,
      action: 'PRODUCT_UPDATED',
      details: { productId: product.id },
      ip: req.ip
    });

    res.json({ success: true, message: 'Product updated successfully.', data: product });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:id - Admin only
router.delete('/:id', requireAuth, requireRoles(['Admin']), (req, res, next) => {
  try {
    const db = getDb();
    const index = (db.products || []).findIndex(p => p.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const removed = db.products.splice(index, 1)[0];
    saveDb(db);

    logAudit({
      userId: req.user.id,
      email: req.user.email,
      action: 'PRODUCT_DELETED',
      details: { productId: removed.id, name: removed.name },
      ip: req.ip
    });

    res.json({ success: true, message: 'Product deleted successfully.', data: removed });
  } catch (err) {
    next(err);
  }
});

export default router;

