import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

const DATABASE_URL = process.env.VITE_DATABASE_URL || process.env.DATABASE_URL;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { email } = req.body || {};

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Por favor, informe um e-mail válido.' });
  }

  // Mensagem neutra por segurança (Prompt 8 - Item 4: Evitar enumeração de e-mails)
  const SECURITY_RESPONSE_MESSAGE = 
    'Se este e-mail estiver cadastrado em nosso sistema, você receberá um link com as instruções para redefinição de senha em instantes. Verifique sua caixa de entrada e a pasta de SPAM.';

  try {
    const sql = neon(DATABASE_URL);

    // 1. Verificar se o nutricionista existe no banco
    const users = await sql`SELECT id, nome, email FROM nutricionistas WHERE LOWER(email) = LOWER(${email})`;

    if (users.length > 0) {
      const user = users[0];

      // 2. Gerar token seguro com expiração de 15 minutos (900s)
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Save token in database
      await sql`
        INSERT INTO password_resets (email, token, expires_at)
        VALUES (${user.email}, ${resetToken}, ${expiresAt.toISOString()});
      `;

      const resetUrl = `${req.headers.origin || 'http://localhost:5173'}?token=${resetToken}&action=reset_password`;

      // 3. Template HTML de E-mail de Recuperação (Prompt 8 - Item 3 & 4)
      const emailHtmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Redefinição de Senha - NutriCris</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #0d0e12; color: #e2e8f0; padding: 40px 20px; margin: 0;">
          <div style="max-width: 500px; margin: 0 auto; background: #16181d; border: 1px solid rgba(236,72,153,0.3); border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #ec4899; margin: 0; font-size: 24px;">NutriCris</h1>
              <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Gestão de Nutrição</p>
            </div>
            <h2 style="color: #ffffff; font-size: 18px; margin-bottom: 16px;">Olá, ${user.nome}!</h2>
            <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">Recebemos uma solicitação para redefinir a senha da sua conta de Nutricionista.</p>
            <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">Para criar uma nova senha, clique no botão abaixo (este link é válido por <strong>15 minutos</strong>):</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                Redefinir Minha Senha
              </a>
            </div>

            <p style="color: #64748b; font-size: 12px; line-height: 1.5;">Se você não solicitou a alteração de senha, ignore este e-mail. Sua senha permanecerá inalterada.</p>
            <hr style="border: 0; border-top: 1px solid #27272a; margin: 24px 0;" />
            <p style="color: #475569; font-size: 11px; text-align: center; margin: 0;">&copy; ${new Date().getFullYear()} NutriCris. Todos os direitos reservados.</p>
          </div>
        </body>
        </html>
      `;

      console.log(`[AUTH LOG] E-mail de redefinição gerado para ${email}. Link: ${resetUrl}`);
      console.log(`[EMAIL TEMPLATE GENERATED]:\n`, emailHtmlTemplate);
    }

    // Sempre retorna a mesma mensagem neutra por segurança
    return res.status(200).json({
      success: true,
      message: SECURITY_RESPONSE_MESSAGE
    });
  } catch (err) {
    console.error('Erro na solicitação de recuperação:', err);
    // Mesmo em erro controlado, manter a mensagem segura
    return res.status(200).json({
      success: true,
      message: SECURITY_RESPONSE_MESSAGE
    });
  }
}
