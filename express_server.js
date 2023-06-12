const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

// Import helper
const userIdLookup = require('./helpers').userIdLookup;

// Set EJS as the templating engine
app.set("view engine", "ejs");

//middlewear to parse the body
app.use(express.urlencoded({ extended: true }));

//cookie session
const cookieSession = require('cookie-session')
app.use(cookieSession({
  name: 'session',
  keys: ["key1"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

// Password handing with bcypt
const bcrypt = require("bcryptjs");

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
  qfR2o1: {
    longURL: "https://www.example.com",
    userID: "o5r63n",
  },
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
  o5r63n: {
    id: "o5r63n",
    email: "paul@chat.com",
    password: "$2a$10$u9BLDtzER0Ffq1TerM4Ot.7PKZH5D/0yrMypmgkGkDt5EA7G94lWW",
  },
};

app.get("/", (req, res) => {
  res.send(`Hello! Check out the main page <a href="http://localhost:8080/urls">here</a>`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// Display contents of the urlDatabase & userlist
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
app.get("/users.json", (req, res) => {
  res.json(users);
});


// Return a friendly greeting to the user :)
app.get("/hello", (req, res) => {
  const templateVars = { greeting: "Hello World!" };
  res.render("hello_world", templateVars);
});

// Main page to display index of URLs
app.get("/urls", (req, res) => {
  const user_id = req.session.user_id;
  filteredDatabase = urlsForUser(user_id);
  console.log(filteredDatabase)
  const templateVars = {
    urls: filteredDatabase,
    user: users[req.session.user_id]
  };
  if (!req.session.user_id) {
    res.status(400).send(`User must be logged in to view the URL list. Please log in <a href="http://localhost:8080/login">here</a>`);
  }
  res.render("urls_index", templateVars);
});

// Get and POST for handling new URLs added by the user
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  if (req.session.user_id) {
    res.render("urls_new", templateVars);
  } else {
    res.render("login", templateVars);
  }
});
app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.status(400).send("User must be logged in to generate shortened URLs");
  } else {
    console.log(req.session.user_id); // Log the POST request body to the console
    let urlKey = generateRandomString(5);
    urlDatabase[urlKey] = {};
    urlDatabase[urlKey].longURL = req.body.longURL;
    urlDatabase[urlKey].userID = req.session.user_id;
    res.redirect(`/urls/${urlKey}`);
  }
});

// Detailed page for individual URL
app.get("/urls/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.status(400).send("This shortened URL does not exist!");
  } else {
    const id = req.params.id;
    if (!req.session.user_id) {
      res.status(400).send(`User must be logged in to view the URL list. Please log in <a href="http://localhost:8080/login">here</a>`);
    }
    if (req.session.user_id !== urlDatabase[id].userID) {
      res.status(400).send(`You cannot access URLs which you have not registered yourself. Return to your URL list <a href="http://localhost:8080/urls">here</a>`);
    }
    const templateVars = {
      id: req.params.id,
      longURL: urlDatabase[id].longURL,
      user: users[req.session.user_id]
    };
    res.render("urls_show", templateVars);
  }
});
// Update the longURL of a URL
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  urlDatabase[id].longURL = req.body.updateURL;
  res.redirect("/urls");
});

// Redirect users to the associated longURL when they go to the shortURL
app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  if (!urlDatabase[id]) {
    res.status(400).send("This shortened URL does not exist! (or you forgot to add https!)");
  } else {
    const longURL = urlDatabase[id].longURL;
    res.redirect(longURL);
  }
});

// Delete URL
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  if (!urlDatabase[req.params.id]) {
    res.status(400).send("That shortened URL does not exist!");
  }
  if (!req.session.user_id) {
    res.status(400).send("User must be logged in to delete URLs");
  }
  if (req.session.user_id !== urlDatabase[id].userID) {
    res.status(400).send(`You cannot access URLs which you have not registered yourself.`);
  } else {
  console.log(`Deleting URL ${urlDatabase[id].longURL}`);
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
  }
});

// Login function
app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  // res.render("login", templateVars);
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.render("login", templateVars);
  }
});
app.post("/login", (req, res) => {
  let tryEmail = req.body.email;
  const user = Object.values(users).find(user => user.email === tryEmail);
  if (!user) {
    res.status(403).send(`User does not have an account. Please <a href="http://localhost:8080/register">register</a>. Thanks!`);
  }
  const password = req.body.password; // found in the req.body object
  const hashedPassword = user.password;
  if (bcrypt.compareSync(password, hashedPassword) === false) {
    res.status(403).send("Password is incorrect");
  }
  const userEmail = req.body.email;
  const selectedUser = userIdLookup(userEmail, users);
  const userId = selectedUser['id'];
  console.log(`Signed in as ${selectedUser['email']}`)
  req.session.user_id = userId;
  res.redirect("/urls");
});

// Logout function
app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/login");
});

// Registration function
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.render("register", templateVars);
  }
});
app.post("/register", (req, res) => {
  let inputEmail = req.body.email;
  let userId = generateRandomString(5);
  if (req.body.email === "" || req.body.password === "") {
    return;
  } else if (userLookup(inputEmail, users) !== null) {
    res.status(400).send("400 Error: This email is already registered");
    return;
  }
  let hashedPassword = bcrypt.hashSync(req.body.password, 10);
  users[userId] = {};
  users[userId].id = userId;
  users[userId].email = req.body.email;
  users[userId].password = hashedPassword;
  req.session.user_id = userId;
  res.redirect('/urls');
});

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

// Filters the URL list which the user is allowed access to (only shown their own assigned URLs)
const urlsForUser = function(id) {
  const filteredUrlList = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      filteredUrlList[url] = urlDatabase[url];
    }
  }
  return filteredUrlList;
};

module.exports = urlDatabase;