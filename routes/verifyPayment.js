const express = require('express');
const Paystack = require('paystack-api');
const router = express.Router();

const paystack = Paystack(process.env.PAYSTACK_SECRET_KEY);

// GET /api/verify-transaction/:reference
router.get('/:reference', async (req, res) => {
  const { reference } = req.params;

  try {
    if (!reference) {
      return res.status(400).json({
        status: 'error',
        message: 'Transaction reference is required',
      });
    }

    const response = await paystack.transaction.verify({ reference });

    res.json({
      status: 'success',
      data: response.data,
    });
  } catch (error) {
    console.error('Transaction verification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to verify transaction',
      details: error.message,
    });
  }
});

module.exports = router;
