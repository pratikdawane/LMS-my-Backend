const Razorpay = require('razorpay')

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
})

exports.getKey = async (req, res) => {
  try {
    res.status(200).json({ success: true, data: { key: process.env.RAZORPAY_KEY_ID || '' }, error: null })
  } catch (e) {
    res.status(500).json({ success: false, data: null, error: e.message })
  }
}