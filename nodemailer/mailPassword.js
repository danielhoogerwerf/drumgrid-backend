const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const User = require("../models/User");

const generatePassword = () => {
  const randomPassword = Math.random().toString(36).slice(-10);
  const newPassword = bcrypt.hash(randomPassword, 10).then((hash) => {
    return { plain: randomPassword, hash: hash };
  });
  return newPassword;
};

const mailPassword = (userID, email) => {
  const sendMail = generatePassword().then((password) => {
    const mailText = `
  Hey there. You have requested a password reset. As such, here is your new password: ${password.plain}
  
  If you did not request this password reset, then someone has most likely entered your email address by accident to reset their password.
  Only you as owner of the email address will receive this mail.
  `;

    const mailHtml = `
  Hey there. You have requested a password reset. As such, here is your new password: ${password.plain} 
  <br /><br />
  If you did not request this password reset, then someone has most likely entered your email address by accident to reset their password.
  <br />Only you as owner of the email address will receive this mail.
  `;

    const performUpdate = User.updateOne({ _id: userID }, { $set: { password: password.hash } })
      .then(() => {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.GME,
            pass: process.env.GMP,
          },
        });

        const mailOptions = {
          from: process.env.GME,
          to: email,
          subject: "DRUMGRID Password Reset",
          text: mailText,
          html: mailHtml,
        };

        return transporter.sendMail(mailOptions, function (err, info) {
          console.log("sending mail");
          if (err) {
            console.log(err);
            return err;
          } else {
            //console.log(info);
            return info;
          }
        });
      })
      .catch((err) => err);

    return performUpdate;
  });
  return sendMail;
};

module.exports = mailPassword;
