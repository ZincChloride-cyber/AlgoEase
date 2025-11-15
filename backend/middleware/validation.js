const Joi = require('joi');

/**
 * Validation middleware for bounty creation
 */
const validateBounty = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().max(200).required(),
    description: Joi.string().max(5000).required(),
    amount: Joi.number().min(0.001).required(),
    // New contract doesn't use deadline - make it optional for backward compatibility
    deadline: Joi.date().optional().allow(null, '').custom((value, helpers) => {
      if (!value) return value; // Allow null/empty
      const deadlineDate = new Date(value);
      const now = new Date();
      const minDeadline = new Date(now.getTime() - 5 * 60 * 1000); // Allow 5 minutes in the past
      if (deadlineDate <= minDeadline) {
        return helpers.error('date.greater', { limit: minDeadline });
      }
      return value;
    }, 'Deadline validation'),
    clientAddress: Joi.string().pattern(/^[A-Z2-7]{58}$/).optional().allow(null, ''),
    // New contract doesn't use verifier - make it optional for backward compatibility
    verifierAddress: Joi.string().pattern(/^[A-Z2-7]{58}$/).optional().allow(null, ''),
    contractId: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.valid(null)).optional().allow(null, ''),
    transactionId: Joi.string().optional().allow(null, ''),
    // Updated status values to match contract: 0=OPEN, 1=ACCEPTED, 2=SUBMITTED, 3=APPROVED, 4=CLAIMED, 5=REJECTED, 6=REFUNDED
    status: Joi.string().valid('open', 'accepted', 'submitted', 'approved', 'claimed', 'rejected', 'refunded').optional(),
    requirements: Joi.array().items(Joi.string().max(500)).optional().allow(null),
    tags: Joi.array().items(Joi.string().max(50)).optional().allow(null)
  }).options({ stripUnknown: true, abortEarly: false });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }))
    });
  }

  // Replace req.body with validated and sanitized value
  req.body = value;
  next();
};

/**
 * Validation middleware for work submission
 */
const validateSubmission = (req, res, next) => {
  const schema = Joi.object({
    description: Joi.string().max(2000).required(),
    links: Joi.array().items(
      Joi.string().uri().required()
    ).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: error.details.map(d => d.message) 
    });
  }

  next();
};

module.exports = {
  validateBounty,
  validateSubmission
};
