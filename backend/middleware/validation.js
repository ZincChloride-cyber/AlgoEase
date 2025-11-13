const Joi = require('joi');

// Validation middleware for bounty creation
const validateBounty = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().max(200).required(),
    description: Joi.string().max(5000).required(),
    amount: Joi.number().min(0.001).required(),
    deadline: Joi.date().greater('now').required(),
    clientAddress: Joi.string().pattern(/^[A-Z2-7]{58}$/).optional(),
    verifierAddress: Joi.string().pattern(/^[A-Z2-7]{58}$/).optional(),
    contractId: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
    transactionId: Joi.string().optional(),
    status: Joi.string().valid('open', 'accepted', 'approved', 'claimed', 'refunded', 'rejected').optional(),
    requirements: Joi.array().items(Joi.string().max(500)).optional(),
    tags: Joi.array().items(Joi.string().max(50)).optional()
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

// Validation middleware for work submission
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
