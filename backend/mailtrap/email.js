import { PASSWORD_RESET_REQUEST_TEMPLATE, PASSWORD_RESET_SUCCESS_TEMPLATE, VERIFICATION_EMAIL_TEMPLATE } from "./emailTemplates.js"
import { mailtrapClient, sender } from "./mailtrap.config.js"


export const sendVerificationEmail = async (email, verificationToken) => {
    const recipientEmail = [{ email }]

    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipientEmail,
            subject: "Verify Your Email",
            html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
            category: "Email Verification",
        });

        console.log("Verification email sent successfully:", response);
    } catch (error) {
        console.log("Error sending verification email:", error);
    }

}

export const sendWelcomeEmail = async (email, name) => {
    const recipientEmail = [{ email }]
    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipientEmail,
            template_uuid: "d968ede9-07c0-4a9f-8040-5d9a4a0ede65",
            template_variables: {
                "company_info_name": "Auth Company",
                "name": name
            }
        })
        console.log("Welcome email sent successfully", response);
    } catch (error) {
        console.log("Error sending welcome email:", error);
    }
}

export const sendResetPasswordEmail = async (email, resetUrl) => {
    const recipientEmail = [{ email }];

    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipientEmail,
            subject: "Reset Your Password",
            html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetUrl}", resetUrl),
            category: "Password Reset",
        })

        console.log("Password reset email sent successfully:", response);
    } catch (error) {
        console.log("Error sending password reset email:", error);
    }
}

export const sendResetSuccessEmail = async (email) => {
    const recipientEmail = [{ email }];
    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipientEmail,
            subject: "Password Reset Successful",
            html: PASSWORD_RESET_SUCCESS_TEMPLATE,
            category: "Password Reset Success",
        })
        console.log("Password reset success email sent successfully:", response);
    } catch (error) {
        console.log("Error sending password reset success email:", error);
    }
}