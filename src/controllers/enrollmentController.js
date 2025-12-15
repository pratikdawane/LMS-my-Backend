const Enrollment = require('../models/Enrollment')

exports.myEnrollments = async (req, res) => {
  try {
    const data = await Enrollment.find({ user: req.user.id })
    res.status(200).json({ success: true, data, error: null })
  } catch (e) {
    res.status(500).json({ success: false, data: null, error: e.message })
  }
}