const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

// Set EJS as the templating engine
app.set("view engine", "ejs");

//middlewear to parse the body
app.use(express.urlencoded({ extended: true }));

//cookie parser
const cookieParser = require('cookie-parser');
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send(`Hello! Check out the main page <a href="http://localhost:8080/urls">here</a>`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// Display contents of the urlDatabase
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Return a friendly greeting to the user :)
app.get("/hello", (req, res) => {
  const templateVars = { greeting: "Hello World!" };
  res.render("hello_world", templateVars);
});

// Main page to display index of URLs
app.get("/urls", (req, res) => {
  const templateVars = { 
    urls: urlDatabase,
    username: req.cookies["username"]
   };
  res.render("urls_index", templateVars);
});

// Get and POST for handling new URLs added by the user
app.get("/urls/new", (req, res) => {
  const templateVars = { 
    username: req.cookies["username"]
   };
  res.render("urls_new", templateVars);
});
app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  let urlKey = generateRandomString(5);
  urlDatabase[urlKey] = req.body.longURL;
  res.redirect(`/urls/${urlKey}`);
});

// Detailed page for individual URL
app.get("/urls/:id", (req, res) => {
  const templateVars = { 
    id: req.params.id, 
    longURL: urlDatabase[req.params.id],
    username: req.cookies["username"]
 };
  res.render("urls_show", templateVars);
});
// Update the longURL of a URL
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  urlDatabase[id] = req.body.updateURL;
  res.redirect("/urls");
});

// Redirect users to the associated longURL when they go to the shortURL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

// Delete URL
app.post("/urls/:id/delete", (req, res) => {
  console.log(`Deleting URL ${urlDatabase[req.params.id]}`);
  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
});

// Login function
app.post("/login", (req, res) => {
  const username = req.body.username;
  res.cookie("username", username);
  res.redirect(`/urls`);
});

// Logout function
app.post("/logout", (req, res) => {
  res.clearCookie("username")
  res.redirect(`/urls`);
})

// Function to generate a random string for ID purposes
const generateRandomString = function(len) {
  let idString = "";
  const alphaNum = '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const idLength = alphaNum.length;
  for (let i = 0; i <= len; i++) {
    idString += alphaNum.charAt(Math.floor(Math.random() * idLength));
  }
  return idString;
};