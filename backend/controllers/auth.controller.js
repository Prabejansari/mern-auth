import bcrypt from "bcryptjs";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { sendResetPasswordEmail, sendVerificationEmail, sendWelcomeEmail, sendResetSuccessEmail } from "../mailtrap/email.js";
import { User } from "../models/user.model.js";

export const signup = async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const isUserAlreadyExists = await User.findOne({ email });
        if (isUserAlreadyExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

        const user = new User({
            email,
            password: hashedPassword,
            name,
            verificationToken,
            verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
        });
        await user.save();
        // jwt
        generateTokenAndSetCookie(res, user._id);
        await sendVerificationEmail(user.email, verificationToken);

        res.status(201).json({
            message: "User created successfully", user: {
                ...user._doc,
                password: null,
            }
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const verifyEmail = async (req, res) => {
    const { verificationCode } = req.body;

    try {
        const user = await User.findOne({ verificationToken: verificationCode, verificationTokenExpiresAt: { $gt: Date.now() } });
        if (!user) {
            return res.status(400).json({ message: "Invalid or expired verification code" });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiresAt = undefined;
        await user.save();
        await sendWelcomeEmail(user.email, user.name);
        res.status(200).json({
            message: "Email verified successfully", user: {
                ...user._doc,
                passsword: undefined,
            }
        });
    } catch (error) {
        console.log("Error verifying email:", error);
        res.status(500).json({ message: "Error verifying email" });
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        generateTokenAndSetCookie(res, user._id);
        res.status(200).json({
            message: "Logged in successfully", user: {
                ...user._doc,
                password: undefined,
            }
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User with this email does not exist" });
        }

        const resetToken = crypto.randomBytes(20).toString("hex");
        const resetPasswordExpiresAt = Date.now() + 60 * 60 * 1000; // 1 hour from now

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiresAt = resetPasswordExpiresAt;
        await user.save();

        await sendResetPasswordEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}`);
        res.status(200).json({ message: "Password reset email sent successfully", link: `${process.env.CLIENT_URL}/reset-password/${resetToken}` });
    } catch (error) {
        console.log("Error sending password reset email:", error);
        res.status(500).json({ message: "Error sending password reset email" });
    }
};

export const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ message: "Password is required" });
    }

    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiresAt: { $gt: Date.now() }
        });
        if (!user) {
            return res.status(400).json({ message: "Invalid or expired reset token" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiresAt = undefined;
        await user.save();
        await sendResetSuccessEmail(user.email);
        res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        console.log("Error resetting password:", error);
        res.status(500).json({ message: "Error resetting password" });
    }
};

export const checkAuth = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.log("Error checking auth:", error);
        res.status(500).json({ message: "Error checking auth" });
    }
};

export const logout = async (req, res) => {
    res.clearCookie("token");
    res.status(200).json({ success: true, message: "Logged out successfully" })
}