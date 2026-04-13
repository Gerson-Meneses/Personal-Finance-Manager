
export const templateHtmlVerifyAccount = (name: string) => {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifica tu cuenta - Finnace Manager</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; color: #f8fafc;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);">
        <!-- Header -->
        <tr>
            <td align="center" style="padding: 40px 0; background-color: #1e293b;">
                <h1 style="margin: 0; color: #38bdf8; font-size: 28px; letter-spacing: 1px;">FINNACE <span style="color: #ffffff;">MANAGER</span></h1>
            </td>
        </tr>

        <!-- Body -->
        <tr>
            <td style="padding: 0 40px 40px 40px;">
                <h2 style="margin: 0 0 20px 0; font-size: 22px; text-align: center;">¡Hola ${name}! Estás a un paso de empezar</h2>
                <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #94a3b8; text-align: center;">
                    Gracias ${name} por unirte a Finnace Manager. Para asegurar tu cuenta y comenzar a gestionar tus finanzas con precisión, por favor confirma tu dirección de correo electrónico haciendo clic en el botón de abajo.
                </p>
                
                <!-- Botón -->
                <table align="center" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                        <td align="center" bgcolor="#38bdf8" style="border-radius: 6px;">
                            <a href="https://personal-finance-manager-lilac.vercel.app/verify-email" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: bold; color: #0f172a; text-decoration: none; border-radius: 6px;">
                                Verificar mi cuenta
                            </a>
                        </td>
                    </tr>
                </table>

                <p style="margin: 30px 0 0 0; font-size: 14px; color: #64748b; text-align: center;">
                    Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                    <a href="#" style="color: #38bdf8; text-decoration: none; word-break: break-all;">https://personal-finance-manager-lilac.vercel.app/verify-email</a>
                </p>
            </td>
        </tr>

        <!-- Footer -->
        <tr>
            <td style="padding: 30px; background-color: #0f172a; border-top: 1px solid #334155; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #475569;">
                    Este correo fue enviado porque te registraste en Finnace Manager.<br>
                    Si no fuiste tú, puedes ignorar este mensaje de forma segura.
                </p>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #475569;">
                    © 2024 Finnace Manager Inc. Todos los derechos reservados.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
`
}