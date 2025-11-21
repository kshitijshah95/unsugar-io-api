const { ValidationError } = require('./errorHandler');

/**
 * Validation middleware to validate request body, params, and query
 */
const validate = (schema) => {
  return (req, res, next) => {
    const validationErrors = [];

    // Validate body
    if (schema.body) {
      const bodyErrors = validateObject(req.body, schema.body, 'body');
      validationErrors.push(...bodyErrors);
    }

    // Validate params
    if (schema.params) {
      const paramErrors = validateObject(req.params, schema.params, 'params');
      validationErrors.push(...paramErrors);
    }

    // Validate query
    if (schema.query) {
      const queryErrors = validateObject(req.query, schema.query, 'query');
      validationErrors.push(...queryErrors);
    }

    if (validationErrors.length > 0) {
      throw new ValidationError('Validation failed', validationErrors);
    }

    next();
  };
};

/**
 * Validate an object against a schema
 */
const validateObject = (obj, schema, location) => {
  const errors = [];

  for (const [key, rules] of Object.entries(schema)) {
    const value = obj[key];

    // Required check
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: key,
        message: `${key} is required`,
        location,
      });
      continue;
    }

    // Skip validation if field is not required and not present
    if (!rules.required && (value === undefined || value === null)) {
      continue;
    }

    // Type validation
    if (rules.type && typeof value !== rules.type) {
      errors.push({
        field: key,
        message: `${key} must be a ${rules.type}`,
        location,
      });
      continue;
    }

    // Email validation
    if (rules.isEmail && !isValidEmail(value)) {
      errors.push({
        field: key,
        message: `${key} must be a valid email`,
        location,
      });
    }

    // Min length validation
    if (rules.minLength && value.length < rules.minLength) {
      errors.push({
        field: key,
        message: `${key} must be at least ${rules.minLength} characters`,
        location,
      });
    }

    // Max length validation
    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push({
        field: key,
        message: `${key} must not exceed ${rules.maxLength} characters`,
        location,
      });
    }

    // Min value validation (for numbers)
    if (rules.min !== undefined && value < rules.min) {
      errors.push({
        field: key,
        message: `${key} must be at least ${rules.min}`,
        location,
      });
    }

    // Max value validation (for numbers)
    if (rules.max !== undefined && value > rules.max) {
      errors.push({
        field: key,
        message: `${key} must not exceed ${rules.max}`,
        location,
      });
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push({
        field: key,
        message: rules.patternMessage || `${key} has invalid format`,
        location,
      });
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push({
        field: key,
        message: `${key} must be one of: ${rules.enum.join(', ')}`,
        location,
      });
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value, obj);
      if (customError) {
        errors.push({
          field: key,
          message: customError,
          location,
        });
      }
    }
  }

  return errors;
};

/**
 * Email validation helper
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Common validation schemas
 */
const schemas = {
  // Auth validation schemas
  register: {
    body: {
      email: {
        required: true,
        type: 'string',
        isEmail: true,
      },
      password: {
        required: true,
        type: 'string',
        minLength: 6,
        maxLength: 100,
      },
      name: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 50,
      },
    },
  },

  login: {
    body: {
      email: {
        required: true,
        type: 'string',
        isEmail: true,
      },
      password: {
        required: true,
        type: 'string',
      },
    },
  },

  updateProfile: {
    body: {
      name: {
        required: false,
        type: 'string',
        minLength: 2,
        maxLength: 50,
      },
      avatar: {
        required: false,
        type: 'string',
      },
    },
  },

  // Blog validation schemas
  mongoId: {
    params: {
      id: {
        required: true,
        type: 'string',
        pattern: /^[0-9a-fA-F]{24}$/,
        patternMessage: 'Invalid ID format',
      },
    },
  },

  pagination: {
    query: {
      page: {
        required: false,
        type: 'string',
        custom: (value) => {
          const num = parseInt(value);
          if (isNaN(num) || num < 1) {
            return 'Page must be a positive number';
          }
        },
      },
      limit: {
        required: false,
        type: 'string',
        custom: (value) => {
          const num = parseInt(value);
          if (isNaN(num) || num < 1 || num > 100) {
            return 'Limit must be between 1 and 100';
          }
        },
      },
    },
  },
};

module.exports = {
  validate,
  schemas,
};
