const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  mobile: { type: String, required: true },
  message: { type: String, required: true }
}); 
const Contacts = mongoose.model("Contact", contactSchema);
module.exports = Contacts;