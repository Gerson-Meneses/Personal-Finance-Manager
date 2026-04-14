import nodemailer, { Transporter } from 'nodemailer';
import 'dotenv/config'

/* const transporter: Transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASSWORD,
    },
}); */

const transporter = nodemailer.createTransport({
    host: '://gmail.com',
    port: 465,
    secure: true, // Forzamos el uso de SSL
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
    },
    // Añadimos esto para ignorar problemas de red local en Render
    tls: {
        rejectUnauthorized: false
    }
} as any);



export default transporter;
