const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const nodemailer = require('nodemailer');
const aws = require('aws-sdk');
const dotenv = require('dotenv');
const { body, validationResult } = require('express-validator');
const bodyParser = require('body-parser');
// Load environment variables from .env file
dotenv.config();

const app = express();

// Set view engine to EJS
app.set('view engine', 'ejs');

// Serve assets from public folder and use body parser middleware
app.use(express.static('./public'));
app.use(bodyParser.urlencoded({ extended: true }));
// Set up express-session and connect-flash for flash messages
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
}));
app.use(flash());

// Set up AWS SES for nodemailer
aws.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});
const transporter = nodemailer.createTransport({
    SES: new aws.SES({ apiVersion: '2010-12-01' })
});

// Routes
app.get('/', (req, res) => {
    res.render('home');
});
app.get('/works', (req, res) => {
    res.render('works');
})
app.post('/contact', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email'),
    body('message').notEmpty().withMessage('Message is required')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        errors.array().forEach(error => {
            req.flash('error', error.msg);
        });
        res.redirect('/');
    } else {
        const { name, email, message } = req.body;
        const params = {
            Destination: {
                ToAddresses: [process.env.TO_EMAIL]
            },
            Message: {
                Body: {
                    Html: {
                        Charset: 'UTF-8',
                        Data: `
                            <table>
                                <tr>
                                    <td>Name:</td>
                                    <td>${name}</td>
                                </tr>
                                <tr>
                                    <td>Email:</td>
                                    <td>${email}</td>
                                </tr>
                                <tr>
                                    <td>Message:</td>
                                    <td>${message}</td>
                                </tr>
                            </table>
                        `
                    }
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: 'New contact form submission'
                }
            },
            Source: process.env.FROM_EMAIL
        };
        transporter.sendMail(params, (err, data) => {
            if (err) {
                console.log(err);
                req.flash('error', 'An error occurred while sending the email');
            } else {
                console.log(data);
                req.flash('success', 'Your message has been sent');
            }
            res.redirect('/');
        });
    }
});

// Start server
app.listen( process.env.PORT, () => {
    console.log('Go to http://localhost:'+process.env.PORT);
});
