import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: false,
  },
  contactNumber: {
    type: String,
    required: false,
  },
  role: {
    type: String,
    enum: ["customer", "restaurant owner"],
    default: "customer"
  },
  profileImage: { 
    type: String,
    required: false,
    default: null
  },
  lineUserId: {
    type: String,
    unique: true,
    sparse: true,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  strict: true // Ensure strict mode is enabled
});

// Debug middleware
userSchema.pre('save', function(next) {
  console.log('Pre-save hook:', {
    id: this._id,
    email: this.email,
    profileImage: this.profileImage
  });
  next();
});

userSchema.pre('updateOne', function() {
  console.log('Update operation:', this.getUpdate());
});

// Ensure profileImage is properly handled in JSON
userSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.profileImage = ret.profileImage || null;
    return ret;
  }
});

// Ensure model is only compiled once
const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
