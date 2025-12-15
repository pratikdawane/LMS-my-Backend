const express = require('express')
const router = express.Router()
const paymentController = require('../controllers/paymentController')
const { protect } = require('../middlewares/auth')

/**
 * @swagger
 * /payments/key:
 *   get:
 *     tags: [Payments]
 *     summary: Get Razorpay public key for checkout
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Key
 */

router.get('/key', protect, (req, res) => paymentController.getKey(req, res))

module.exports = router