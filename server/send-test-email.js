const nodemailer = require('nodemailer');

async function sendTestEmail() {
  // Crear cuenta de prueba en Ethereal
  const testAccount = await nodemailer.createTestAccount();

  // Configurar transporter con Ethereal SMTP
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // use STARTTLS
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  // Enviar email
  const info = await transporter.sendMail({
    from: '"MiniBio.ar" <no-reply@minibio.ar>',
    to: 'salinas.ariel02@gmail.com',
    subject: 'Hola desde MiniBio.ar',
    text: 'Hola Ariel,\n\nSoy Kael, enviando este email de prueba desde el backend de MiniBio.ar.\n\n¡Todo funciona!\n\n— Kael ⚡',
    html: `
      <h1>Hola Ariel 👋</h1>
      <p>Soy <strong>Kael</strong>, enviando este email de prueba desde el backend de MiniBio.ar.</p>
      <p>Todo funciona correctamente.</p>
      <p style="color: #666; font-size: 0.9em;">— Kael ⚡</p>
    `,
  });

  console.log('✅ Email enviado. Message ID:', info.messageId);
  console.log('📬 Vista previa en Ethereal:', nodemailer.getTestMessageUrl(info));
}

sendTestEmail().catch(console.error);