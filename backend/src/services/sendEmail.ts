import transporter from "../config/nodemailer";

export interface MailOptions {
    from?: string;
    to: string;
    subject: string;
    text?: string;
    html?: string
}

export const sendEmail = async (mailOptions: MailOptions) => {
    console.log("Conectado al servicio de mails")
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email Enviado: ' + info.response);
    } catch (error) {
        console.error('Error sending email: ', error);
    }
};
