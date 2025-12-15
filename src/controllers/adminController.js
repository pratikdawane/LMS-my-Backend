const User = require('../models/User');
const OTP = require('../models/OTP');

exports.getAllUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (status) filter.status = status;
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        total: users.length,
        users,
      },
      error: null,
    });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' });
    }

    res.status(200).json({ success: true, data: user, error: null });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting admin users
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, data: null, error: 'Cannot delete admin account' });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      data: { message: 'User deleted successfully' },
      error: null,
    });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, data: null, error: 'Invalid status' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: { message: 'User status updated', user },
      error: null,
    });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
};

exports.deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === 'admin') {
      return res.status(400).json({ success: false, data: null, error: 'Cannot deactivate admin account' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: { message: 'User deactivated', user },
      error: null,
    });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
};

exports.activateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: { message: 'User activated', user },
      error: null,
    });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalInstructors = await User.countDocuments({ role: 'instructor' });
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalInstructors,
        activeUsers,
        inactiveUsers,
        totalUsers: totalStudents + totalInstructors,
      },
      error: null,
    });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ['firstName', 'lastName', 'email', 'role'];
    const payload = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        payload[key] = req.body[key];
      }
    }
    const user = await User.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' });
    }
    res.status(200).json({ success: true, data: { message: 'User updated', user }, error: null });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
};

exports.getOtps = async (req, res) => {
  try {
    const { email } = req.query;
    const filter = {};
    if (email) filter.email = email.toLowerCase();
    const otps = await OTP.find(filter).sort({ createdAt: -1 }).limit(50);
    const masked = otps.map(doc => ({
      id: doc._id,
      email: doc.email,
      otpMasked: doc.otp ? `${doc.otp.slice(0, 2)}****` : null,
      expiresAt: doc.expiresAt,
      isUsed: doc.isUsed,
      attempts: doc.attempts,
      createdAt: doc.createdAt,
    }));
    res.status(200).json({ success: true, data: { otps: masked }, error: null });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: error.message });
  }
};
