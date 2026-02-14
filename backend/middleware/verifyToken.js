import jwt from "jsonwebtoken";

export const verifyToken = async (req, res, next) => {
    const token = req.cookies.token;

    try {
        if (!token) {
            return res.status(401).json({ message: "Unauthorized - No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ message: "Unauthorized - Invalid token" });
        }
        req.userId = decoded.userId;
        next();
    } catch (error) {
        console.log("Token verification error:", error);
        return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }
};