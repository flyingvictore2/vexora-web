const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'flyingvictor2006@gmail.com',
        pass: 'wbmgmlcgbttcfydh',
    },
});

transporter.verify(function (error, success) {
    if (error) {
        console.log("Error de verificación SMTP:");
        console.log(error);
    } else {
        console.log("¡Servidor listo para enviar correos!");
    }
});
