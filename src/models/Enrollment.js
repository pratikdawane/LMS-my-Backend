const mongoose = require('mongoose')

const progressItemSchema = new mongoose.Schema(
  {
    lessonId: { type: mongoose.Schema.Types.ObjectId, required: true },
    watchedSec: { type: Number, default: 0 },
    completed: { type: Boolean, default: false }
  },
  { _id: false }
)

const enrollmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    progress: { type: [progressItemSchema], default: [] },
    purchasedAt: { type: Date, default: Date.now },
    orderId: { type: String, required: true },
    paymentId: { type: String, default: null },
    status: { type: String, enum: ['active', 'cancelled'], default: 'active' }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Enrollment', enrollmentSchema)