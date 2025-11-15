// backend/index.
// require("dotenv").config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Booking = require('./model/booking');
const Admin = require("./model/admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// const nodemailer = require("nodemailer");
const Feedback = require('./model/feedback');
const Contact = require('./model/contact');
const { Resend } = require('resend');

const app = express();
let PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const resend = new Resend(process.env.RESEND_API_KEY);



// Middleware
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("Connection error:", err));

// mongoose.connect("mongodb://localhost:27017/starry_mountain")
//     .then(() => console.log("MongoDB connected"))
//     .catch(err => console.error("Connection error:", err));



// Routes

// --- Bookings ---

app.post("/submitBooking", async (req, res) => {
    try {
        const booking = await Booking.create(req.body);

        await resend.emails.send({
            from: "Starry Mountain <booking@starrymountain.in>",
            to: 'starrymountain2024@gmail.com',
            subject: `New Booking From ${booking.name}`,
            text: JSON.stringify(req.body, null, 2)
        });

        if (booking.email) {
            await resend.emails.send({
                from: "Starry Mountain <booking@starrymountain.in>",
                to: booking.email,
                subject: "Welcome to Starry Mountain",
                text: `Hello ${booking.name || "Guest"},\n\nThanks for reaching out! A member of our team will get back to you shortly. In the meantime, if you need anything else, feel free to let us know. You can also contact us directly for any urgent queries.\n\nBest regards,\nStarry Mountain Team\n+917003328637\n+9198312 37696`,
            });
        }

        return res.status(200).json({ booking });

    } catch (err) {
        console.log("MAIL ERROR:", JSON.stringify(err, null, 2));
        return res.status(500).json({ error: err });
    }
});


app.get("/getBookings", async (req, res) => {
    try {
        const bookings = await Booking.find();
        res.status(200).json(bookings);
    } catch (err) {
        console.error("Error fetching bookings:", err);
        res.status(500).json(err);
    }
});

app.delete("/deleteBooking/:id", (req, res) => {
    const id = req.params.id;
    Booking.findByIdAndDelete({ _id: id })
        .then(booking => res.json(booking))
        .catch(err => res.json(err));
});

app.get("/totalBookings", async (req, res) => {
    try {
        const count = await Booking.countDocuments();
        res.status(200).json(count);
    } catch (err) {
        console.error("Error counting bookings:", err);
        res.status(500).json(err);
    }
});

// --- Admin Login ---
app.post("/adminLogin", async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ username });
        if (!admin) {
            return res.status(401).json({ success: false, message: "Admin not found" });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: admin._id }, JWT_SECRET, { expiresIn: '2d' });
        return res.status(200).json({ success: true, message: "Login successful", token, admin: { id: admin._id, username: admin.username } });
    } catch (error) {
        console.error("Login error:", error.message);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});

//Add Feedback
app.post("/submitFeedback", async (req, res) => {
    try {
        const feedback = await Feedback.create(req.body);
        res.status(200).json(feedback);
    } catch (err) {
        console.error("Error saving feedback:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get("/totalFeedbacks", async (req, res) => {
    try {
        const count = await Feedback.countDocuments();
        res.status(200).json(count);
    } catch (err) {
        console.error("Error counting feedback:", err);
        res.status(500).json(err);
    }
});

app.get("/getFeedbacks", async (req, res) => {
    try {
        const feedbacks = await Feedback.find();
        res.status(200).json(feedbacks);
    } catch (err) {
        console.error("Error fetching feedbacks:", err);
        res.status(500).json(err);
    }
});

app.get("/getFeedback/:id", async (req, res) => {
    const id = req.params.id;
    try {
        const feedback = await Feedback.findById(id);
        res.status(200).json(feedback);
    } catch (err) {
        console.error("Error fetching feedback:", err);
        res.status(500).json(err);
    }
});

app.put("/updateFeedback/:id", async (req, res) => {
    const id = req.params.id;
    try {
        const feedback = await Feedback.findById(id);
        if (!feedback) {
            return res.status(404).json({ error: "Feedback not found" });
        }
        const updatedFeedback = await Feedback.findByIdAndUpdate({ _id: id },
            {
                name: req.body.name,
                email: req.body.email,
                feedback: req.body.feedback
            });
        res.json(updatedFeedback);
    } catch (err) {
        res.status(500).json(err);
    }
});

app.put("/approveFeedback/:id", async (req, res) => {
    const id = req.params.id;
    try {
        const feedback = await Feedback.findById(id);
        if (!feedback) {
            return res.status(404).json({ error: "Feedback not found" });
        }
        const updatedFeedback = await Feedback.findByIdAndUpdate(
            id,
            { flag: !feedback.flag },
            { new: true }
        );
        res.json(updatedFeedback);
    } catch (err) {
        res.status(500).json(err);
    }
});

app.delete("/deleteFeedback/:id", (req, res) => {
    const id = req.params.id;
    Feedback.findByIdAndDelete({ _id: id })
        .then(feedback => res.json(feedback))
        .catch(err => res.json(err));
});

//Contact form
app.post("/submitContact", async (req, res) => {
    try {
        const contact = await Contact.create(req.body);
        res.status(200).json(contact);
    } catch (err) {
        console.error("Error saving contact:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get("/getContacts", async (req, res) => {
    try {
        const contacts = await Contact.find();
        res.status(200).json(contacts);
    } catch (err) {
        console.error("Error fetching contacts:", err);
        res.status(500).json(err);
    }
});

app.delete("/deleteContact/:id", (req, res) => {
    const id = req.params.id;
    Contact.findByIdAndDelete({ _id: id })
        .then(contact => res.json(contact))
        .catch(err => res.json(err));
});

// --- Admin Forgot Password ---
app.post("/adminForgotPassword", async (req, res) => {
    try {
        const admin = await Admin.findOne({ username: "admin" });
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        admin.otp = otp;
        admin.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
        await admin.save();

        await resend.emails.send({
            from: "Starry Mountain <booking@starrymountain.in>",
            to: "starrymountain2024@gmail.com",
            subject: "Admin Password Reset OTP",
            text: `Your OTP for resetting admin password is: ${otp}. It expires in 5 minutes.`
        });

        res.status(200).json({ message: "OTP sent to admin email" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});

app.post("/adminVerifyOtp", async (req, res) => {
    try {
        const { otp } = req.body;

        const admin = await Admin.findOne({ username: "admin" });

        if (!admin || admin.otp !== otp) {
            return res.status(401).json({ message: "Invalid OTP" });
        }

        if (admin.otpExpires < Date.now()) {
            return res.status(400).json({ message: "OTP expired" });
        }

        return res.status(200).json({ message: "OTP verified successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});


app.post("/adminResetPassword", async (req, res) => {
    try {
        const { password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        const admin = await Admin.findOne({ username: "admin" });

        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        // Encrypt password
        const hashedPassword = await bcrypt.hash(password, 10);

        admin.password = hashedPassword;
        admin.otp = null;            // clear OTP
        admin.otpExpires = null;     // clear expiry

        await admin.save();

        res.status(200).json({ message: "Password updated successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});

// --- Start server ---
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
