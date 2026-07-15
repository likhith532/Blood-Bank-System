const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * ==============================
 * Authentication Middleware
 * ==============================
 */

const authenticateToken = async (req, res, next) => {
    try {

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not configured");
        }

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authorization token missing"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id)
            .select("-password")
            .lean();

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User does not exist"
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Account is deactivated"
            });
        }

        // Optional Feature
        // Uncomment if email verification exists

        /*
        if (!user.isVerified) {
            return res.status(403).json({
                success:false,
                message:"Please verify your email first."
            });
        }
        */

        req.user = user;
        req.token = token;
        req.requestTime = new Date();

        next();

    } catch (err) {

        if (err.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "JWT Token expired"
            });
        }

        if (err.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid JWT Token"
            });
        }

        console.error(err);

        return res.status(500).json({
            success: false,
            message: "Authentication failed"
        });
    }
};


/**
 * ==============================
 * Authorization Middleware
 * ==============================
 */

const authorize = (...roles) => {

    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        if (!roles.includes(req.user.role)) {

            return res.status(403).json({
                success: false,
                message: `Access denied. Allowed Roles: ${roles.join(", ")}`
            });

        }

        next();

    };

};


/**
 * ==============================
 * Role Helpers
 * ==============================
 */

const requireAdmin = authorize("admin");

const requireDonor = authorize("donor");

const requireRecipient = authorize("recipient");

const requireDonorOrAdmin = authorize(
    "donor",
    "admin"
);

const requireRecipientOrAdmin = authorize(
    "recipient",
    "admin"
);


/**
 * ==============================
 * Optional Authentication
 * ==============================
 */

const optionalAuth = async (req, res, next) => {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return next();
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.id)
            .select("-password")
            .lean();

        if (user && user.isActive) {

            req.user = user;

        }

    } catch (err) {

        console.log("Optional Auth:", err.message);

    }

    next();

};


/**
 * ==============================
 * Ownership Middleware
 * ==============================
 */

const requireOwnershipOrAdmin = (field = "user") => {

    return (req, res, next) => {

        if (!req.user) {

            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });

        }

        if (req.user.role === "admin") {

            return next();

        }

        const ownerId =
            req.params.userId ||
            req.body[field] ||
            req.query.userId;

        if (!ownerId) {

            return res.status(400).json({
                success: false,
                message: "Owner ID not provided"
            });

        }

        if (ownerId.toString() !== req.user._id.toString()) {

            return res.status(403).json({
                success: false,
                message: "Unauthorized resource access"
            });

        }

        next();

    };

};


/**
 * ==============================
 * Simple Request Logger
 * ==============================
 */

const requestLogger = (req, res, next) => {

    console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`
    );

    next();

};


/**
 * ==============================
 * Rate Limit Placeholder
 * ==============================
 */

const sensitiveOperationLimit = (req, res, next) => {

    // Replace with express-rate-limit or Redis

    next();

};


/**
 * ==============================
 * Exports
 * ==============================
 */

module.exports = {

    authenticateToken,

    authorize,

    requireAdmin,

    requireDonor,

    requireRecipient,

    requireDonorOrAdmin,

    requireRecipientOrAdmin,

    optionalAuth,

    requireOwnershipOrAdmin,

    requestLogger,

    sensitiveOperationLimit

};
