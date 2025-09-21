const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Admin = require("./model/admin");

const register = async () => {
    try {
        mongoose.connect(process.env.MONGO_URI)
            .then(() => console.log("MongoDB connected"))
            .catch(err => console.error("Connection error:", err));
        const hashedPassword = await bcrypt.hash("admin", 10);
        const newAdmin = new Admin({
            username: "admin",
            password: hashedPassword
        });
        await newAdmin.save();
        console.log("Admin created successfully");
    } catch (error) {
        console.error("Error creating admin user:", error.message);
    }
}
register();