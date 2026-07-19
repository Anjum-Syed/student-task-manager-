const jwt = require("jsonwebtoken");
const User = require("../models/User");
const memoryStore = require("../config/memoryStore");

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_fallback_key";

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (process.env.USE_MEMORY_STORE === "true") {
      const user = memoryStore.users.find((u) => u._id.toString() === decoded.id);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      req.user = userWithoutPassword;
    } else {
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
};

module.exports = { protect };
