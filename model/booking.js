const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String},
    mobile: {type: String, required: true},
    checkin: {type: Date, required: true},
    checkout: {type: Date, required: true},
    adults: {type: Number, required: true},
    children: {type: Number, required: true},
    duration: {type: String, required: true},
    requests: {type: String}
});

const Booking = mongoose.model('bookings', bookingSchema);
module.exports = Booking;