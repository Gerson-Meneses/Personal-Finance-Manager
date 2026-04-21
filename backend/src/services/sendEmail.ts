import { google } from 'googleapis';
import 'dotenv/config';


export interface MailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string
}
export const sendEmail = async (mailOptions: MailOptions) => {
    const { to, subject, text, html } = mailOptions;

    const oauth2Client = new google.auth.OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        "https://developers.google.com/oauthplayground" 
    );

    oauth2Client.setCredentials({
        refresh_token: process.env.REFRESH_TOKEN
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    console.log('ID cargado:', process.env.CLIENT_ID?.substring(0, 10) + '...');
    console.log('Secret cargado:', process.env.CLIENT_SECRET ? 'SÍ' : 'NO');

    // Construcción del mensaje simplificada para evitar errores de parseo
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
        `From: <${process.env.EMAIL_USER}>`,
        `To: ${to}`,
        'Content-Type: text/html; charset=utf-8',
        'Mime-Version: 1.0',
        `Subject: ${utf8Subject}`,
        '',
        html || text
    ];

    const message = messageParts.join('\n');
    const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    try {
        const res = await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw: encodedMessage },
        });
        console.log('✅ Correo enviado:', res.data.id);
        return res.data;
    } catch (error: any) {
        if (error.response) {
            console.error('❌ Error API:', error.response.data);
        }
        throw error;
    }
};