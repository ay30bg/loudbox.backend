const express = require('express');
const Paystack = require('paystack-api');
const router = express.Router();

const paystack = Paystack(process.env.PAYSTACK_SECRET_KEY);

router.get('/:reference', async (req, res) => {
  const { reference } = req.params;
  console.log(`Verifying transaction with reference: ${reference}`);

  try {
    if (!reference) {
      console.log('Validation failed: Reference missing');
      return res.status(400).json({
        status: 'error',
        message: 'Transaction reference is required',
      });
    }

    const response = await paystack.transaction.verify({ reference });
    console.log('Paystack verification response:', response);

    res.json({
      status: 'success',
      data: response.data,
    });
  } catch (error) {
    console.error('Transaction verification error:', {
      message: error.message,
      stack: error.stack,
      paystackResponse: error.response?.data,
    });
    res.status(error.response?.status || 500).json({
      status: 'error',
      message: 'Failed to verify transaction',
      details: error.response?.data?.message || error.message,
    });
  }
});

module.exports = router;
