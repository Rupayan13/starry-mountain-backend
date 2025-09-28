// backend/index.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Booking = require('./model/booking');
const Admin = require("./model/admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const Feedback = require('./model/feedback');
const Contact = require('./model/contact');
const brevo = require("@getbrevo/brevo");

const app = express();
let PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

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


// Routes

// --- Bookings ---
let apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY  // set this in Render env vars
);
app.post("/submitBooking", async (req, res) => {
    try {
        // Save the booking to the database
        const booking = await Booking.create(req.body);

        // // Setup transporter
        // const transporter = nodemailer.createTransport({
        //     host: 'smtp-relay.brevo.com',
        //     port: 587,
        //     secure: false,
        //     auth: {
        //         user: '9807a2001@smtp-brevo.com',
        //         pass: 'ZyAzFXnrDjkS15Qb'
        //     }
        // });

        // // 1. Send booking details to admin
        // let adminMail = await transporter.sendMail({
        //     from: '"Rupayan Dirghangi" <9807a2001@smtp-brevo.com>',
        //     to: 'send2rupayan2002@gmail.com',
        //     subject: "New Booking From " + booking.name,
        //     text: JSON.stringify(req.body, null, 2),
        // });

        // console.log("Admin mail sent: %s", adminMail.messageId);

        // let userMail = null;

        // // 2. Send welcome email ONLY if user provided an email
        // if (booking.email) {
        //     userMail = await transporter.sendMail({
        //         from: '"Starry Mountain" <9807a2001@smtp-brevo.com>',
        //         to: booking.email, // only send if exists
        //         subject: "Welcome to Starry Mountain 🌄",
        //         text: `Hello ${booking.name || "Guest"},\n\nThanks for reaching out! A member of our team will get back to you shortly. In the meantime, if you need anything else, feel free to let us know. You can also contact us directly for any urgent queries.\n\nBest regards,\nStarry Mountain Team\n+917003328637\n+9198312 37696`,
        //     });

        // Send email to admin
        await apiInstance.sendTransacEmail({
            sender: { email: "9807a2001@smtp-brevo.com", name: "Starry Mountain" },
            to: [{ email: "send2rupayan2002@gmail.com" }],
            subject: "New Booking from " + booking.name,
            textContent: JSON.stringify(req.body, null, 2),
        });

        // Send welcome email to user if email is provided
        if (booking.email) {
            await apiInstance.sendTransacEmail({
                sender: { email: "9807a2001@smtp-brevo.com", name: "Starry Mountain" },
                to: [{ email: booking.email }],
                subject: "Welcome to Starry Mountain 🌄",
                textContent: `Hello ${booking.name || "Guest"},\n\nThanks for booking with us!`,
            });
        }

        console.log("User welcome mail sent: %s", userMail.messageId);

        // Send response back
        res.status(200).json({
            booking,
            // adminMail and userMail are not defined because we use apiInstance, so remove these or set to null
            adminMessageId: null,
            userMessageId: null
        });
    } catch (err) {
        console.error("Error saving booking or sending mail:", err);
        res.status(500).json({ error: err.message });
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

// --- Start server ---
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
