const mongoose = require("mongoose");

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
        console.error("❌ MONGO_URI is not set in environment variables.");
        return;
    }

    if (mongoose.connection.readyState === 1) {
        console.log("✅ MongoDB already connected");
        return;
    }

    try {
        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("❌ Database Connection Failed");
        console.error(error.message);
        console.log("🔁 Retrying MongoDB connection in 5 seconds...");
        setTimeout(() => {
            connectDB();
        }, 5000);
    }
};

module.exports = connectDB;