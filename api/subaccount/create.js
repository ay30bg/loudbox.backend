const axios = require('axios');
require('dotenv').config();

const PAYSTACK_API = 'https://api.paystack.co';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { business_name, bank_code, account_number, percentage_charge } = req.body;

  try {
    const response = await axios.post(
      `${PAYSTACK_API}/subaccount`,
      {
        business_name,
        settlement_bank: bank_code,
        account_number,
        percentage_charge,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    res.status(200).json(response.data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create subaccount' });
  }
};
