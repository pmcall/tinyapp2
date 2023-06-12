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

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
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
    // username: req.cookies["username"],
    user: users[req.cookies.user_id]
   };
  //  console.log(req.cookies.user_id)
  //  console.log(templateVars.user)
  res.render("urls_index", templateVars);
});

// Get and POST for handling new URLs added by the user
app.get("/urls/new", (req, res) => {
  const templateVars = { 
    user: users[req.cookies.user_id]
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
    user: users[req.cookies.user_id]
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
  const userId = users[req.cookies.user_id]
  res.cookie("user_id", userId);
  res.redirect(`/urls`);
});

// Logout function
app.post("/logout", (req, res) => {
  res.clearCookie("user_id")
  res.redirect(`/urls`);
})

// Registration function
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies.user_id]
  }
  res.render("register", templateVars);
})
app.post("/register", (req, res) => {
  let inputEmail = req.body.email;
  let userId = generateRandomString(5);
  if (req.body.email === "" || req.body.password === "") {
    return;
  } else if (userLookup(inputEmail, users) !== null) {
    res.status(400).send("400 Error: This email is already registered");
    return;
  }
  users[userId] = {};
  users[userId].id = userId;
  users[userId].email = req.body.email;
  users[userId].password = req.body.password;
  res.cookie("user_id", userId);
  res.redirect('/urls');
  console.log(users);
  console.log(req.cookies)
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

// User Lookup helper 
const userLookup = function(userEmail, userRecords) {
  for (const user in userRecords) {
    if (userRecords[user].email === userEmail) {
      return userRecords[user].email;
    }
  }
  return null;
};