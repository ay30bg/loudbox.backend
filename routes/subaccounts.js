const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/create-subaccount', async (req, res) => {
  const { business_name, bank_code, account_number, percentage } = req.body;
  try {
    const response = await axios.post(
      'https://api.paystack.co/subaccount',
      {
        business_name,
        bank_code, // e.g., "057" for Zenith Bank
        account_number,
        percentage_charge: percentage, // e.g., 0.8 for 80%
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    res.json(response.data.data); // Returns subaccount_code
  } catch (error) {
    console.error('Error creating subaccount:', error.response?.data);
    res.status(500).json({ error: 'Failed to create subaccount' });
  }
});

module.exports = router;
