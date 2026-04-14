import { google } from 'googleapis';
import 'dotenv/config';
import transporter from "../config/nodemailer";

export interface MailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string
}

/* export const sendEmail = async (mailOptions: MailOptions) => {
    console.log("Conectado al servicio de mails")
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email Enviado: ' + info.response);
    } catch (error) {
        console.error('Error sending email: ', error);
    }
};
 */

/**
 * Función para enviar correo usando la API de Gmail (HTTP)
 * Esto evita el bloqueo de puertos de Render
 */
export const sendEmail = async (mailOptions: MailOptions) => {

    const {to, subject, text, html} = mailOptions

    const oauth2Client = new google.auth.OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        "https://google.com"
    );

    oauth2Client.setCredentials({
        refresh_token: process.env.REFRESH_TOKEN
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Crear el cuerpo del correo en formato RFC 2822
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
        `From: <${process.env.EMAIL_USER}>`,
        `To: ${to}`,
        'Content-Type: text/html; charset=utf-8',
        'Mime-Version: 1.0',
        `Subject: ${utf8Subject}`,
        '',
        text,
        html
    ];
    const message = messageParts.join('\n');

    // Codificar en Base64 para la API de Google
    const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    try {
        const res = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
            },
        });
        console.log('Correo enviado con éxito:', res.data.id);
        return res.data;
    } catch (error) {
        console.error('Error enviando por Gmail API:', error);
        throw error;
    }
};

