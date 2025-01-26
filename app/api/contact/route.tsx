import { NextResponse, NextRequest } from 'next/server'
import nodemailer from 'nodemailer';

// Handles POST requests to /api


export async function POST(request: { formData: () => any; }) {

    const username = process.env.NEXT_PUBLIC_EMAIL_USERNAME;
    const password = process.env.NEXT_PUBLIC_EMAIL_PASSWORD;
    //const myEmail = process.env.NEXT_PUBLIC_PERSONAL_EMAIL;


    console.log("dealing with request")
    const formData = await request.formData()
  
    const email = formData.get('email')
    const encrypt = Buffer.from(email).toString("base64")


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
            pass: password
        }
    });

    try {

        const mail = await transporter.sendMail({
            from: username,
            to: email,
            replyTo:  username,
            subject: `Password Reset from ${username}`,
            html: `
            <p>Message: If you see this, you have received an email from Reroute
            to reset your password </p>
                <a href="http://localhost:3000/reset-password/?id=${encrypt}">Reset password here</a>
            `,
        })

        return NextResponse.json({ message: "Success: email was sent" })

    } catch (error) {
        console.log(error)
        return NextResponse.json({ message: "COULD NOT SEND MESSAGE" })
    }


}