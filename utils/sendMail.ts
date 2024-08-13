import nodemailer, { Transporter } from "nodemailer";
import ejs from "ejs";
import path from "path";

interface EmailOptions {
  email: string;
  subject: string;
  template: string;
  data: { [key: string]: any };
}

const sendMail = async (options: EmailOptions): Promise<void> => {
  try {
    const transporter: Transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "576"),
      secure: false, // true for 465, false for other ports
      service: process.env.SMTP_SERVICE,
      auth: {
        user: process.env.SMTP_MAIL, // generated ethereal user
        pass: process.env.SMTP_PASSWORD, // generated ethereal password
      },
    });

    const { email, subject, template, data } = options;

    // Path to mail template file
    const templatePath: string = path.join(__dirname, "../mails", template);

    // Render mail template
    const html: string = await ejs.renderFile(templatePath, { data });

    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to: email,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
  } catch (err: any) {
    console.log(err.message);
  }
};

export default sendMail;
