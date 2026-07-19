const mongoose = require("mongoose");
const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.warn("MONGO_URI is not configured. Falling back to in-memory task storage.");
    process.env.USE_MEMORY_STORE = "true";
    return false;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
    process.env.USE_MEMORY_STORE = "false";
    return true;
  } catch (error) {
    console.warn("MongoDB unavailable, falling back to in-memory task storage:", error.message);
    process.env.USE_MEMORY_STORE = "true";
    return false;
  }
};

module.exports = connectDB;