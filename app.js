const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const nodemailer = require("nodemailer");
const aws = require("aws-sdk");
const dotenv = require("dotenv");
const { body, validationResult } = require("express-validator");
const bodyParser = require("body-parser");
// Load environment variables from .env file
dotenv.config();

const app = express();

async function fetchData(url, populate = "populate=*") {
  try {
    const response = await fetch(
      process.env.STRAPI_API_URL + url + `?${populate}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.STRAPI_TOKEN}`,
        },
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
  }
}

// Set view engine to EJS
app.set("view engine", "ejs");

// Serve assets from public folder and use body parser middleware
app.use(express.static("./public"));
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.get("/", async (req, res) => {
  let homeData = await fetchData("home", "populate=about_image");
  let educations = await fetchData(
    "home",
    "populate[0]=educations&populate[1]=educations.details&populate[2]=educations.details.icon"
  );
  let hard_skills = await fetchData(
    "home",
    "populate[0]=hard_skills&populate[1]=hard_skills.skill_name"
  );
  let soft_skills = await fetchData(
    "home",
    "populate[0]=soft_skills&populate[1]=soft_skills.skill_name"
  );
  let software = await fetchData(
    "home",
    "populate[0]=softwares&populate[1]=software.software_details&populate[2]=software.software_details.icon"
  );
  let seo = await fetchData(
    "home",
    "populate[0]=seo&populate[1]=seo.open_graph_image"
  );
  let workexp = await fetchData(
    "home",
    "populate[0]=work_exps&populate[1]=work_exps.details"
  );
  let works = await fetchData(
    "home",
    "populate[0]=works&populate[1]=works.skill_used&populate[2]=works.display_image"
  );
  let contact = await fetchData("contact");

  const data = {
    homeData: homeData.data.attributes,
    educations: educations.data.attributes.educations.data,
    hard_skills: hard_skills.data.attributes.hard_skills.data,
    soft_skills: soft_skills.data.attributes.soft_skills.data,
    software: software.data.attributes.software.data,
    seo: seo.data.attributes.seo,
    workexp: workexp.data.attributes.work_exps.data,
    works: works.data.attributes.works.data,
    pageURL: process.env.BASE_URL + req.url,
    strapiURL: process.env.STRAPI_URL,
    contact: contact.data.attributes,
  };
  res.render("home", { data: data });
});
app.get("/works", async (req, res) => {
  let workpage = await fetchData(
    "workpage",
    "populate[0]=seo&populate[1]=seo.open_graph_image"
  );
  let works = await fetchData(
    "works",
    "populate[0]=software_used&populate[1]=skill_used&populate[2]=display_image"
  );
  let contact = await fetchData("contact");
  const data = {
    seo: workpage.data.attributes.seo,
    works: works.data,
    pageURL: process.env.BASE_URL + req.url,
    strapiURL: process.env.STRAPI_URL,
    contact: contact.data.attributes,
  };

  res.render("works", {data:data});
});
app.get("/works/:slug", async (req, res) => {
    const slug = req.params.slug;
    
    const works = await fetchData(
    `works`,`filters[slug]=${slug}&populate=software_used,skill_used,project_images,seo,seo.open_graph_image`
  );
  let contact = await fetchData("contact");
  if (works.data.length > 0) {
    const data = {
      seo: works.data[0].attributes.seo,
      work: works.data[0].attributes,
      pageURL: process.env.BASE_URL + req.url,
      strapiURL: process.env.STRAPI_URL,
      contact: contact.data.attributes,
    };
    res.render("work", {data:data});
  } else {
    res.status(404).send("Work not found");
  }
});

app.post(
  "/contact",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Invalid email"),
    body("message").notEmpty().withMessage("Message is required"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach((error) => {
        req.flash("error", error.msg);
      });
      res.redirect("/");
    } else {
      const { name, email, message } = req.body;
      const params = {
        Destination: {
          ToAddresses: [process.env.TO_EMAIL],
        },
        Message: {
          Body: {
            Html: {
              Charset: "UTF-8",
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
                        `,
            },
          },
          Subject: {
            Charset: "UTF-8",
            Data: "New contact form submission",
          },
        },
        Source: process.env.FROM_EMAIL,
      };
      transporter.sendMail(params, (err, data) => {
        if (err) {
          console.log(err);
          req.flash("error", "An error occurred while sending the email");
        } else {
          console.log(data);
          req.flash("success", "Your message has been sent");
        }
        res.redirect("/");
      });
    }
  }
);
// Set up express-session and connect-flash for flash messages
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 },
  })
);
app.use(flash());

// Set up AWS SES for nodemailer
aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
const transporter = nodemailer.createTransport({
  SES: new aws.SES({ apiVersion: "2010-12-01" }),
});

// Routes
app.get("/", (req, res) => {
  let homeData = fetchData("home");
  res.render("home");
});
app.get("/works", (req, res) => {
  res.render("works");
});
app.get("/work", (req, res) => {
  res.render("work");
});

app.post(
  "/contact",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Invalid email"),
    body("message").notEmpty().withMessage("Message is required"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach((error) => {
        req.flash("error", error.msg);
      });
      res.redirect("/");
    } else {
      const { name, email, message } = req.body;
      const params = {
        Destination: {
          ToAddresses: [process.env.TO_EMAIL],
        },
        Message: {
          Body: {
            Html: {
              Charset: "UTF-8",
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
                        `,
            },
          },
          Subject: {
            Charset: "UTF-8",
            Data: "New contact form submission",
          },
        },
        Source: process.env.FROM_EMAIL,
      };
      transporter.sendMail(params, (err, data) => {
        if (err) {
          console.log(err);
          req.flash("error", "An error occurred while sending the email");
        } else {
          console.log(data);
          req.flash("success", "Your message has been sent");
        }
        res.redirect("/");
      });
    }
  }
);

// Start server
app.listen(process.env.PORT, () => {
  console.log("Go to http://localhost:" + process.env.PORT);
});
