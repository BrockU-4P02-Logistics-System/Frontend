import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Handles POST requests to /api

const { SITE_URL } = process.env;

export async function POST(request: NextRequest) {
  const username = process.env.NEXT_PUBLIC_EMAIL_USERNAME;
  const password = process.env.NEXT_PUBLIC_EMAIL_PASSWORD;

  const formData = await request.formData();

  const email = formData.get("email") as string;
  if (!email) {
    return NextResponse.json(
      { message: "Email is required" },
      { status: 400 }
    );
  }

  const encrypt = Buffer.from(email).toString("base64");

  // create transporter object
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    tls: {
      ciphers: "SSLv3",
      rejectUnauthorized: false,
    },
    auth: {
      user: username,
      pass: password,
    },
  });

  try {
    await transporter.sendMail({
      from: username,
      to: email,
      replyTo: username,
      subject: `Password Reset from ${username}`,
      html: `
            <p>Message: If you see this, you have received an email from Reroute
            to reset your password </p>
                <a href="${SITE_URL}/auth/reset-password/?id=${encrypt}">Reset password here</a>
            `,
    });

    return NextResponse.json({ message: "Success: email was sent" });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { message: "COULD NOT SEND MESSAGE" },
      { status: 500 }
    );
  }
}