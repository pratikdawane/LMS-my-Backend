const express = require('express')
const router = express.Router()
const { protect } = require('../middlewares/auth')
const enrollmentController = require('../controllers/enrollmentController')

router.use(protect)

/**
 * @swagger
 * /enrollments/me:
 *   get:
 *     tags: [Enrollments]
 *     summary: Get my enrollments
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of enrollments
 */
router.get('/me', enrollmentController.myEnrollments)

module.exports = router