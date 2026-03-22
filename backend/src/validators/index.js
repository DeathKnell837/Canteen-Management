const Joi = require('joi');
const { AppError } = require('../utils/errorHandler');

const allowedOrderStatuses = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'PICKED_UP',
  'DELIVERED',
  'CANCELLED',
  'PAID',
  'ALL'
];

// Joi Schemas
const schemas = {
  register: Joi.object({
    email: Joi.string().email({ tlds: false }).required(),
    phone: Joi.string().pattern(/^[0-9]{10,11}$/).required(),
    password: Joi.string().min(8).required(),
    fullName: Joi.string().min(3).required()
  }),

  login: Joi.object({
    email: Joi.string().email({ tlds: false }).required(),
    password: Joi.string().required()
  }),

  createMenuItem: Joi.object({
    categoryId: Joi.number().positive().required(),
    name: Joi.string().min(2).max(120).required(),
    description: Joi.string().max(1000).allow('').required(),
    price: Joi.number().positive().required(),
    isVegetarian: Joi.boolean().default(false),
    prepTime: Joi.number().integer().min(1).max(240).default(15)
  }),

  updateMenuItem: Joi.object({
    categoryId: Joi.number().positive(),
    name: Joi.string().min(2).max(120),
    description: Joi.string().max(1000).allow(''),
    price: Joi.number().positive(),
    isVegetarian: Joi.boolean(),
    prepTime: Joi.number().integer().min(1).max(240)
  }).min(1),

  createOrder: Joi.object({
    items: Joi.array().items(
      Joi.object({
        item_id: Joi.number().positive().required(),
        quantity: Joi.number().integer().positive().required()
      })
    ).min(1).required(),
    deliveryType: Joi.string().valid('PICKUP', 'DELIVERY').required(),
    specialInstructions: Joi.string().allow('')
  }),

  processPayment: Joi.object({
    orderId: Joi.number().positive().required(),
    paymentMethod: Joi.string().valid('ONLINE_PAYMENT', 'ONLINE_TRANSACTION', 'DIRECT_CASH', 'WALLET', 'CARD', 'MOBILE_PAYMENT', 'CASH').required(),
    amount: Joi.number().positive().required(),
    walletPin: Joi.string().pattern(/^[0-9]{4,6}$/).allow('', null)
  }),

  topupWallet: Joi.object({
    amount: Joi.number().positive().required(),
    securityPin: Joi.string().pattern(/^[0-9]{4,6}$/).required(),
    sourceMethod: Joi.string().valid('GCASH', 'MAYA', 'BANK_TRANSFER').required(),
    sourceName: Joi.string().allow('').when('sourceMethod', {
      is: 'BANK_TRANSFER',
      then: Joi.string().trim().required(),
      otherwise: Joi.optional()
    })
  }),

  setWalletPin: Joi.object({
    pin: Joi.string().pattern(/^[0-9]{4,6}$/).required(),
    accountPassword: Joi.string().min(8).required()
  }),

  stockChange: Joi.object({
    quantity: Joi.number().integer().positive().required(),
    reason: Joi.string().max(255).allow('')
  }),

  idParam: Joi.object({
    id: Joi.number().integer().positive().required()
  }),

  adminWalletTopup: Joi.object({
    userId: Joi.number().integer().positive().required(),
    amount: Joi.number().positive().precision(2).required(),
    note: Joi.string().max(255).allow('', null)
  }),

  adminWalletSearchQuery: Joi.object({
    q: Joi.string().trim().max(100).allow('', null)
  }),

  topupHistoryQuery: Joi.object({
    limit: Joi.number().integer().min(1).max(200).default(50),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso()
  }),

  reportsDateQuery: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso()
  }),

  ordersListQuery: Joi.object({
    limit: Joi.number().integer().min(1).max(200).default(50),
    offset: Joi.number().integer().min(0).default(0),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    status: Joi.string().valid(...allowedOrderStatuses)
  }),

  userOrdersQuery: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0).default(0)
  }),

  updateOrderStatus: Joi.object({
    status: Joi.string().valid(
      'PENDING',
      'CONFIRMED',
      'PREPARING',
      'READY',
      'PICKED_UP',
      'DELIVERED',
      'CANCELLED',
      'PAID'
    ).required()
  }),

  createCategory: Joi.object({
    name: Joi.string().trim().min(2).max(80).required(),
    description: Joi.string().max(255).allow(''),
    displayOrder: Joi.number().integer().min(0).default(0)
  }),

  updateCategory: Joi.object({
    name: Joi.string().trim().min(2).max(80),
    description: Joi.string().max(255).allow(''),
    displayOrder: Joi.number().integer().min(0),
    isActive: Joi.boolean()
  }).min(1),

  updateSettingsProfile: Joi.object({
    fullName: Joi.string().trim().min(2).max(120),
    phone: Joi.string().pattern(/^[0-9]{10,11}$/)
  }).min(1),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).max(72).required()
  }),

  updateEmail: Joi.object({
    newEmail: Joi.string().email({ tlds: false }).required(),
    password: Joi.string().required()
  }),

  createAdmin: Joi.object({
    email: Joi.string().email({ tlds: false }).required(),
    fullName: Joi.string().trim().min(2).max(120).required(),
    password: Joi.string().min(8).max(72).required(),
    role: Joi.string().valid('ADMIN').default('ADMIN')
  })
};

// Validation middleware
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const target = req[source] || {};
    const { error, value } = schema.validate(target, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map((err) => `${err.path.join('.')} ${err.message}`);
      throw new AppError(`Validation error: ${details.join(', ')}`, 400);
    }

    req[source] = value;
    next();
  };
};

// Named validators for routes
const validateRegister = validate(schemas.register);
const validateLogin = validate(schemas.login);
const validateMenuItem = validate(schemas.createMenuItem);
const validateMenuItemUpdate = validate(schemas.updateMenuItem);
const validateCreateOrder = validate(schemas.createOrder);
const validateOrderIdParam = validate(Joi.object({ orderId: schemas.idParam.extract('id') }), 'params');
const validateUserIdParam = validate(Joi.object({ userId: schemas.idParam.extract('id') }), 'params');
const validateItemIdParam = validate(Joi.object({ itemId: schemas.idParam.extract('id') }), 'params');
const validateCategoryIdParam = validate(Joi.object({ categoryId: schemas.idParam.extract('id') }), 'params');
const validatePaymentIdParam = validate(Joi.object({ paymentId: schemas.idParam.extract('id') }), 'params');
const validateUserOrdersQuery = validate(schemas.userOrdersQuery, 'query');
const validateOrdersListQuery = validate(schemas.ordersListQuery, 'query');
const validateOrderStatusUpdate = validate(schemas.updateOrderStatus);
const validateAdminWalletTopup = validate(schemas.adminWalletTopup);
const validateAdminWalletSearchQuery = validate(schemas.adminWalletSearchQuery, 'query');
const validateTopupHistoryQuery = validate(schemas.topupHistoryQuery, 'query');
const validateReportsDateQuery = validate(schemas.reportsDateQuery, 'query');
const validateCategoryCreate = validate(schemas.createCategory);
const validateCategoryUpdate = validate(schemas.updateCategory);
const validateSettingsProfile = validate(schemas.updateSettingsProfile);
const validateSettingsPassword = validate(schemas.changePassword);
const validateSettingsEmail = validate(schemas.updateEmail);
const validateCreateAdmin = validate(schemas.createAdmin);
const validatePayment = validate(schemas.processPayment);
const validateTopup = validate(schemas.topupWallet);
const validateSetWalletPin = validate(schemas.setWalletPin);
const validateStockChange = validate(schemas.stockChange);

module.exports = {
  schemas,
  validate,
  validateRegister,
  validateLogin,
  validateMenuItem,
  validateMenuItemUpdate,
  validateCreateOrder,
  validateOrderIdParam,
  validateUserIdParam,
  validateItemIdParam,
  validateCategoryIdParam,
  validatePaymentIdParam,
  validateUserOrdersQuery,
  validateOrdersListQuery,
  validateOrderStatusUpdate,
  validateAdminWalletTopup,
  validateAdminWalletSearchQuery,
  validateTopupHistoryQuery,
  validateReportsDateQuery,
  validateCategoryCreate,
  validateCategoryUpdate,
  validateSettingsProfile,
  validateSettingsPassword,
  validateSettingsEmail,
  validateCreateAdmin,
  validatePayment,
  validateTopup,
  validateSetWalletPin,
  validateStockChange
};
