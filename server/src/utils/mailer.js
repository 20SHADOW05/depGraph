import nodemailer from "nodemailer";

let transporter = null;

function getTransporter() {
  	if (transporter) return transporter;

	if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
		throw new Error(
		"Email sending requires SMTP_HOST, SMTP_USER, and SMTP_PASS in .env. " +
		"Example: SMTP_HOST=smtp.gmail.com SMTP_USER=your@gmail.com SMTP_PASS=app-password",
		);
	}

	transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
		secure: process.env.SMTP_SECURE === "true",
		auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
		},
	});

  	return transporter;
}

export async function sendMail({ to, subject, html, text }) {
	const transporter = getTransporter();
	const from = process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@depgraph.local";
	const info = await transporter.sendMail({ from, to, subject, html, text });
	return info;
}

export default sendMail;
