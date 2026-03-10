const Joi = require('joi');
const { AppError } = require('../utils/errorHandler');

// Joi Schemas
const schemas = {
  register: Joi.object({
    email: Joi.string().email({ tlds: false }).required(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
    password: Joi.string().min(8).required(),
    fullName: Joi.string().min(3).required()
  }),

  login: Joi.object({
    email: Joi.string().email({ tlds: false }).required(),
    password: Joi.string().required()
  }),

  createMenuItem: Joi.object({
    categoryId: Joi.number().positive().required(),
    name: Joi.string().min(3).required(),
    description: Joi.string().required(),
    price: Joi.number().positive().required(),
    isVegetarian: Joi.boolean().default(false),
    prepTime: Joi.number().positive().default(15)
  }),

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
    paymentMethod: Joi.string().valid('WALLET', 'CARD', 'CASH').required(),
    amount: Joi.number().positive().required()
  }),

  topupWallet: Joi.object({
    amount: Joi.number().positive().required()
  }),

  stockChange: Joi.object({
    quantity: Joi.number().integer().positive().required(),
    reason: Joi.string().allow('')
  })
};

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      throw new AppError(JSON.stringify(details), 400);
    }

    req.validatedBody = value;
    next();
  };
};

// Named validators for routes
const validateRegister = validate(schemas.register);
const validateLogin = validate(schemas.login);
const validateMenuItem = validate(schemas.createMenuItem);
const validateCreateOrder = validate(schemas.createOrder);
const validatePayment = validate(schemas.processPayment);
const validateTopup = validate(schemas.topupWallet);
const validateStockChange = validate(schemas.stockChange);

module.exports = {
  schemas,
  validate,
  validateRegister,
  validateLogin,
  validateMenuItem,
  validateCreateOrder,
  validatePayment,
  validateTopup,
  validateStockChange
};
