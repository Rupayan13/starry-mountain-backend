const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String},
    feedback: {type: String},
    flag: {type: Boolean, default: false}
});

const Feedback = mongoose.model('feedbacks', feedbackSchema);
module.exports = Feedback;