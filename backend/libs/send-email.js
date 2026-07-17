import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"TaskHub" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};
