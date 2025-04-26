// const express = require('express');
// const Paystack = require('paystack-api');
// const router = express.Router();

// const paystack = Paystack(process.env.PAYSTACK_SECRET_KEY);

// // POST /api/initialize-transaction
// router.post('/', async (req, res) => {
//   const { email, amount, subaccount_code, firstName, lastName, phoneNumber, eventTitle, ticketQuantity } = req.body;

//   try {
//     // Validate input
//     if (!email || !amount || !subaccount_code) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Email, amount, and subaccount code are required',
//       });
//     }

//     // Check if subaccount_code is valid
//     if (subaccount_code === 'null') {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Invalid subaccount code',
//       });
//     }

//     const transactionData = {
//       email: email || 'guest@example.com',
//       amount: amount * 100, // Convert to kobo
//       callback_url: process.env.PAYSTACK_CALLBACK_URL || 'http://localhost:3000/order-summary',
//       metadata: {
//         firstName,
//         lastName,
//         phoneNumber,
//         eventTitle,
//         ticketQuantity,
//       },
//     };

//     // Add subaccount if valid
//     if (subaccount_code) {
//       transactionData.subaccount = subaccount_code;
//       transactionData.bearer = 'subaccount'; // Subaccount bears fees
//       transactionData.transaction_charge = amount * 100 * 0.1; // Example: 10% to subaccount
//     }

//     const response = await paystack.transaction.initialize(transactionData);

//     res.json({
//       status: 'success',
//       data: response.data,
//     });
//   } catch (error) {
//     console.error('Transaction initialization error:', error);
//     res.status(500).json({
//       status: 'error',
//       message: 'Failed to initialize transaction',
//       details: error.message,
//     });
//   }
// });

// module.exports = router;

const express = require('express');
const Paystack = require('paystack-api');
const router = express.Router();

const paystack = Paystack(process.env.PAYSTACK_SECRET_KEY);

// Handle GET requests
router.get('/', (req, res) => {
  res.status(405).json({
    status: 'error',
    message: 'Method Not Allowed. Use POST to initialize a transaction.',
  });
});

router.post('/', async (req, res) => {
  console.log('Received request to /api/initialize-transaction:', req.body);
  const { email, amount, subaccount_code, firstName, lastName, phoneNumber, eventTitle, ticketQuantity } = req.body;

  try {
    if (!email || !amount) {
      console.log('Validation failed: Email or amount missing');
      return res.status(400).json({
        status: 'error',
        message: 'Email and amount are required',
      });
    }

    const transactionData = {
      email: email || 'guest@example.com',
      amount: amount * 100,
      callback_url: process.env.PAYSTACK_CALLBACK_URL || 'https://loudbox.vercel.app/order-summary',
      metadata: {
        firstName,
        lastName,
        phoneNumber,
        eventTitle,
        ticketQuantity,
      },
    };

    if (subaccount_code && subaccount_code !== 'null') {
      console.log('Using subaccount:', subaccount_code);
      transactionData.subaccount = subaccount_code;
      transactionData.bearer = 'subaccount';
      transactionData.transaction_charge = amount * 100 * 0.1;
    } else {
      console.log('No valid subaccount provided, proceeding without subaccount');
    }

    console.log('Initializing Paystack transaction with data:', transactionData);
    const response = await paystack.transaction.initialize(transactionData);
    console.log('Paystack response:', response);

    res.json({
      status: 'success',
      data: response.data,
    });
  } catch (error) {
    console.error('Transaction initialization error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
    });
    res.status(500).json({
      status: 'error',
      message: 'Failed to initialize transaction',
      details: error.message,
    });
  }
});

module.exports = router;
