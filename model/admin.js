const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  otp: { type: String, default: null },
  otpExpires: { type: Date, default: null }
});
const Admin = mongoose.model("Admin", adminSchema);
module.exports = Admin;