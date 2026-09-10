import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendVerificationEmail = async (to, name, verificationLink) => {
  const mailOptions = {
    from: `"HiFileShare" <${process.env.MAIL_USER}>`,
    to,
    subject: 'Verify Your HiFileShare Account',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Verify Email - HiFileShare</title>
        </head>
        <body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
                  <tr>
                    <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px 40px 30px;text-align:center;">
                      <div style="font-size:36px;margin-bottom:8px;">📁</div>
                      <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">HiFileShare</h1>
                      <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Secure File Sharing, Simplified</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:40px;">
                      <h2 style="margin:0 0 16px;color:#f1f5f9;font-size:22px;font-weight:600;">Hey ${name}! 👋</h2>
                      <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
                        Welcome to HiFileShare! You're just one step away from sharing files with friends and colleagues. Click the button below to verify your email address and activate your account.
                      </p>
                      <div style="text-align:center;margin:32px 0;">
                        <a href="${verificationLink}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 40px;border-radius:10px;font-size:16px;font-weight:600;letter-spacing:0.3px;">
                          ✅ Verify My Email
                        </a>
                      </div>
                      <p style="margin:0 0 8px;color:#64748b;font-size:13px;text-align:center;">
                        This link expires in <strong style="color:#94a3b8;">24 hours</strong>
                      </p>
                      <p style="margin:24px 0 0;color:#475569;font-size:13px;line-height:1.5;">
                        If you didn't create an account with HiFileShare, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px 40px;border-top:1px solid #334155;text-align:center;">
                      <p style="margin:0;color:#475569;font-size:12px;">© 2024 HiFileShare. Made with ❤️</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendDeletionEmail = async (to, name) => {
  const mailOptions = {
    from: `"HiFileShare" <${process.env.MAIL_USER}>`,
    to,
    subject: 'Account Deleted - HiFileShare',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Account Deleted - HiFileShare</title>
        </head>
        <body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
                  <tr>
                    <td style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:40px 40px 30px;text-align:center;">
                      <div style="font-size:36px;margin-bottom:8px;">📁</div>
                      <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">HiFileShare</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:40px;">
                      <h2 style="margin:0 0 16px;color:#f1f5f9;font-size:22px;font-weight:600;">We feel sorry to see you go, ${name}.</h2>
                      <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
                        Your account has been successfully deleted. All of your data and associated files have been permanently removed from our servers according to your request.
                      </p>
                      <p style="margin:24px 0 0;color:#475569;font-size:13px;line-height:1.5;">
                        If this was a mistake, you can always create a new account in the future.
                      </p>
                      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #334155;text-align:center;">
                        <p style="margin:0 0 16px;color:#cbd5e1;font-size:14px;">Could you take a moment to tell us why you left?</p>
                        <a href="https://forms.gle/dummy-feedback-form-link" style="display:inline-block;background:rgba(255,255,255,0.1);color:#f8fafc;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;border:1px solid rgba(255,255,255,0.2);">
                          Share Feedback
                        </a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px 40px;border-top:1px solid #334155;text-align:center;">
                      <p style="margin:0;color:#475569;font-size:12px;">© 2024 HiFileShare. Made with ❤️</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export default transporter;
