const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    mobileNo: {
      type: String,
      required: function() {
        return this.role === 'student';
      },
      match: [/^\d{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: function() {
        return this.role === 'student';
      },
    },
    role: {
      type: String,
      enum: ['student', 'instructor', 'admin'],
      default: 'student',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: function() {
        return this.role === 'instructor' ? 'pending' : 'approved';
      },
    },
    profileImage: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    education: {
      qualification: String,
      specialization: String,
      institution: String,
      yearOfCompletion: Number,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFirstLogin: {
      type: Boolean,
      default: function() {
        return this.role === 'instructor';
      },
    },
    requiresPasswordChange: {
      type: Boolean,
      default: function() {
        return this.role === 'instructor';
      },
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function(inputPassword) {
  return await bcrypt.compare(inputPassword, this.password);
};

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
