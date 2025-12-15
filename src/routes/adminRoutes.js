const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, isAdmin } = require('../middlewares/auth');

router.use(protect, isAdmin);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get all users with filters
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [student, instructor]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           description: Search by name or email
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Admin access required
 */
router.get('/users', adminController.getAllUsers);

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get user by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get('/users/:id', adminController.getUserById);

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Delete user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
router.delete('/users/:id', adminController.deleteUser);

/**
 * @swagger
 * /admin/users/{id}/status:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Update user status
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected]
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid status
 */
router.patch('/users/:id/status', adminController.updateUserStatus);

/**
 * @swagger
 * /admin/users/{id}/deactivate:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Deactivate user account
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deactivated
 *       404:
 *         description: User not found
 */
router.patch('/users/:id/deactivate', adminController.deactivateUser);

/**
 * @swagger
 * /admin/users/{id}/activate:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Activate user account
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User activated
 *       404:
 *         description: User not found
 */
router.patch('/users/:id/activate', adminController.activateUser);

/**
 * @swagger
 * /admin/dashboard/stats:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get dashboard statistics
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get('/dashboard/stats', adminController.getDashboardStats);

router.patch('/users/:id', adminController.updateUser);
router.get('/otps', adminController.getOtps);

module.exports = router;
