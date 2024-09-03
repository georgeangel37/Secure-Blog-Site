import bodyParser from "body-parser";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import https from "https";
import fs from "fs";
import rateLimit from "express-rate-limit";
import csrf from "csurf";
import { sanitizeInput } from "./utilities/sanitize.js";
import { loginUser, verifyMFALogin } from "./scripts/login.js";
import { signupUser } from "./scripts/signup.js";
import {
  addNewPost,
  getFeed,
  getMyPosts,
  getSinglePostFeed,
  removePost,
  editPost,
  getSearchFeed,
} from "./scripts/posts.js";
import { SessionManagement } from "./scripts/session.js";
import { isEmpty } from "./utilities/validation.js";
import { getNewSecret } from "./utilities/mfa-app.js";
import querystring from "querystring";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sessionManagement = new SessionManagement();

// allows 7 requests every 15 mins from the same IP address
const loginRateLimiter = rateLimit({ max: 7, windowMS: 1000 * 60 * 15 });
// allows 50 requests every 5 mins from the same IP address
const commonRateLimiter = rateLimit({ max: 50, windowMS: 1000 * 60 * 5 });

const maxNumberOfFailedLogins = 5;
const timeWindowForFailedLogins = 15;
const csrfProtection = csrf({ cookie: true, secure: true, httpOnly: true, sameSite: "strict" });

const httpsOptions = {
  pfx: fs.readFileSync("./certificate.pfx"),
  passphrase: "112233",
};

const app = express();
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/../public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

function errorHandler(err, req, res, next) {
  // Log the error to the console
  console.error(err);
  if (err.code === "EBADCSRFTOKEN") {
    // Handle csurf token errors here
    sessionManagement.logoutUser(req.cookies.session_id);
    res.clearCookie("session_id");
    res.redirect("/error");
  } else {
    res.status(500).send("An unexpected error occurred");
  }
}

function getRandomInt(low, high) {
  low = Math.ceil(low);
  high = Math.floor(high);
  return Math.floor(Math.random() * (low-high) + low);}

const isValidSession = function (req, res) {
  const sessionResult = sessionManagement.checkSession(
    req.cookies.session_id,
    req.headers["user-agent"],
    req.headers["x-forwarded-for"] || req.socket.remoteAddress
  );
  if (!sessionResult.validSession) {
    res.clearCookie("session_id");
  }
  return sessionResult;
};

function verifyRecaptcha(recaptchaResponse, remoteIpAddress, callback) {
  const postData = querystring.stringify({
    secret: "6LcI9eklAAAAAO4MJZWefLoQiHk4zNqrbkF3mpE8",
    response: recaptchaResponse,
    remoteip: remoteIpAddress,
  });
  const options = {
    hostname: "www.google.com",
    path: "/recaptcha/api/siteverify",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(postData),
    },
  };
  const req = https.request(options, (res) => {
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });
    res.on("end", () => {
      const result = JSON.parse(data);
      const success = result.success;
      callback(success);
    });
  });

  req.on("error", (err) => {
    console.error(`reCAPTCHA verification failed: ${err}`);
    callback(false);
  });

  req.write(postData);
  req.end();
}

app.get("/", csrfProtection, loginRateLimiter, function (req, res) {
  if (isValidSession(req, res).validSession) {
    console.log("LOG: login: Login success through session cookie");
    res.redirect("/feed");
  } else {
    res.render(__dirname + "/views/login.ejs", {
      status: undefined,
      csrfToken: req.csrfToken(),
    });
  }
});

app.post(
  "/mfa-verify",
  csrfProtection,
  loginRateLimiter,
  async function (req, res) {
    const mfaResult = await verifyMFALogin(
      req.body.email,
      req.body.otp,
      timeWindowForFailedLogins,
      maxNumberOfFailedLogins
    );
    if (mfaResult.successful) {
      const sessionId = sessionManagement.createNewSession(
        mfaResult.userId,
        req.headers["user-agent"],
        req.headers["x-forwarded-for"] || req.socket.remoteAddress
      );

      res.cookie("session_id", sessionId, {
        httpOnly: true,
        maxAge: 30 * 60000,
        sameSite: "strict",
      });

      console.log("LOG: login: Login success");
      res.redirect("/feed");
    }
    res.render(__dirname + "/views/mfaVerify.ejs", {
      status: mfaResult.status,
      email: sanitizeInput(req.body.email),
      csrfToken: req.csrfToken(),
    });
  }
);

app.post("/login", csrfProtection, loginRateLimiter, async function (req, res) {
  try {
    const loginResult = await loginUser(
      req.body.email,
      req.body.password,
      timeWindowForFailedLogins,
      maxNumberOfFailedLogins
    );
    if (loginResult.successful) {
      if (loginResult.mfaRequired) {
        setTimeout(function () {
          console.log("LOG: login: MFA Required");
          res.render(__dirname + "/views/mfaVerify.ejs", {
            status: 200,
            email: sanitizeInput(req.body.email),
            csrfToken: req.csrfToken(),
          });
        }, getRandomInt(500,1000));
      } else {
        const sessionId = sessionManagement.createNewSession(
          loginResult.userId,
          req.headers["user-agent"],
          req.headers["x-forwarded-for"] || req.socket.remoteAddress
        );

        res.cookie("session_id", sessionId, {
          httpOnly: true,
          maxAge: 30 * 60000,
          sameSite: "strict",
        });

        setTimeout(function () {
          console.log("LOG: login: Login success");
          res.redirect("/feed");
        }, getRandomInt(500,1000));
      }
    } else {
      setTimeout(function () {
        console.log("ERROR: login: Login failed");
        if (loginResult.err === "Too many attempts") {
          setTimeout(function () {
            res.render(__dirname + "/views/login.ejs", {
              status: 429,
              email: req.body.email,
              csrfToken: req.csrfToken(),
            });
          }, getRandomInt(500,1000));
        } else {
          res.render(__dirname + "/views/login.ejs", {
            status: 401,
            email: req.body.email,
            csrfToken: req.csrfToken(),
          });
        }
      }, getRandomInt(500,1000));
    }
  } catch (err) {
    setTimeout(function () {
      console.log("ERROR: login: Something went wrong ", err);
      res.redirect("/error/loggedOut");
    }, getRandomInt(500,1000));
  }
});

app.get(
  "/signup",
  csrfProtection,
  commonRateLimiter,
  async function (req, res) {
    const newSecret = await getNewSecret();
    res.render(__dirname + "/views/signup.ejs", {
      status: "",
      firstname: "",
      lastname: "",
      email: "",
      password: "",
      username: "",
      errMessage: "",
      qr: newSecret.qr,
      secret: newSecret.secret,
      csrfToken: req.csrfToken(),
    });
  }
);

app.post(
  "/signup",
  csrfProtection,
  commonRateLimiter,
  async function (req, res) {
    const recaptchaResponse = req.body["g-recaptcha-response"];
    const signup_res = await signupUser(req.body, recaptchaResponse);

    const remoteIpAddress = req.connection.remoteAddress;

    verifyRecaptcha(recaptchaResponse, remoteIpAddress, (success) => {
      if (success) {
        res.send("Captcha verification successful");
      } else {
        req.body.errMessage = "Captcha error";
      }
    });
    if (signup_res === "success") {
      res.redirect("/");
      return;
    } else if (signup_res === "unique_username") {
      req.body.errMessage = "The username you entered is already in use.";
    } else if (signup_res === "unique_email") {
      req.body.errMessage = "The email you entered is already in use.";
    } else if (signup_res === "error") {
      req.body.errMessage = "There was an unlnown error try again";
    } else if (signup_res === "invalid_email") {
      req.body.errMessage = "You entered an invalid email";
    } else if (signup_res === "incorrect_passcode") {
      req.body.errMessage =
        "Incorrect pass code entered, please scan QR Code again";
    } else if (signup_res === "invalid_password") {
      req.body.errMessage =
        "Password needs to be between 8 and 15 characters long and not be guessable";
    } else if (signup_res === "no_captcha") {
      req.body.errMessage = "Captcha required";
    }
    req.body.password = "";
    // const newSecret = await getNewSecret();
    req.body.qr = req.body.qr_url;
    // req.body.secret = newSecret.secret;
    req.body.csrfToken = req.csrfToken();
    req.body.status = 400;
    res.render(__dirname + "/views/signup.ejs", req.body);
  }
);

app.get("/feed", csrfProtection, commonRateLimiter, async function (req, res) {
  let currSession = isValidSession(req, res);
  if (!currSession.validSession) {
    console.error("ERROR: Feed: Invalid session");
    res.redirect("/");
    return;
  }

  let result = await getFeed(currSession.userId);
  if (result.success) {
    result.displayAuthor = true;
    result.pageTitle = "My Feed";

    result.isDelete = false;
    res.render(__dirname + "/views/feed.ejs", result);
  } else {
    console.error("ERROR: Feed: Failed to get posts\n", result.err);
  }
});

app.get(
  "/myPosts",
  csrfProtection,
  commonRateLimiter,
  async function (req, res) {
    let currSession = isValidSession(req, res);
    if (!currSession.validSession) {
      console.error("ERROR: My Posts: Invalid session");
      res.redirect("/");
      return;
    }

    let result = await getMyPosts(currSession.userId);
    if (result.success) {
      result.displayAuthor = false;
      result.pageTitle = "My Posts";
      result.csrfToken = req.csrfToken();
      result.isDelete = false;
      res.render(__dirname + "/views/feed.ejs", result);
    } else {
      console.log("ERROR: Feed: Failed to get posts\n", result.err);
      res.redirect("/error");
    }
  }
);

app.get("/addPost", csrfProtection, commonRateLimiter, function (req, res) {
  if (!isValidSession(req, res).validSession) {
    console.error("ERROR Add Post: Invalid session");
    res.redirect("/");
    return;
  }
  res.render(__dirname + "/views/addPost.ejs", {
    status: undefined,
    csrfToken: req.csrfToken(),
  });
});

app.post(
  "/addPost",
  csrfProtection,
  commonRateLimiter,
  async function (req, res) {
    let currSession = isValidSession(req, res);
    if (!currSession.validSession) {
      console.error("ERROR: AddPost: Invalid session");
      res.redirect("/");
      return;
    }

    let result = await addNewPost(
      currSession.userId,
      req.body.title,
      req.body.content
    );

    if (result.success) {
      console.log("LOG: addPost: Added Post Sucessfully");
      res.redirect("myPosts");
    } else {
      console.log("ERROR: addPost: Add post failed");
      res.render(__dirname + "/views/addPost.ejs", {
        status: 401,
        title: req.body.title,
        content: req.body.content,
        csrfToken: req.csrfToken(),
      });
    }
  }
);

app.get(
  "/editPost/:postId",
  csrfProtection,
  commonRateLimiter,
  async function (req, res) {
    let currSession = isValidSession(req, res);
    if (!currSession.validSession) {
      console.error("ERROR: Edit Post: Invalid session");
      res.redirect("/");
      return;
    }
    const result = await getSinglePostFeed(
      currSession.userId,
      req.params.postId
    );
    if (result.success) {
      res.render(__dirname + "/views/editPost.ejs", {
        post: result.posts[0],
        status: result.status,
        csrfToken: req.csrfToken(),
      });
    } else {
      console.error("ERROR: Feed: Failed to get posts\n", result.err);
      res.redirect("/error");
    }
  }
);

app.post(
  "/editPost/:postId",
  csrfProtection,
  commonRateLimiter,
  async function (req, res) {
    let currSession = isValidSession(req, res);
    if (!currSession.validSession) {
      console.error("ERROR: Edit Post: Invalid session");
      res.redirect("/");
      return;
    }
    const result = await editPost(
      currSession.userId,
      req.params.postId,
      req.body.title,
      req.body.content
    );
    if (result.success) {
      res.redirect("/posts/" + req.params.postId);
    } else if (result.status === 401) {
      const result_redirect = await getSinglePostFeed(
        currSession.userId,
        req.params.postId
      );
      if (result_redirect.success) {
        res.render(__dirname + "/views/editPost.ejs", {
          post: result_redirect.posts[0],
          status: result.status,
          csrfToken: req.csrfToken(),
        });
      } else {
        console.error(
          "ERROR: Feed: Failed to get posts\n",
          result_redirect.err
        );
        res.redirect("/error");
      }
    } else {
      console.error("ERROR: Feed: Failed to get posts\n", result.err);
      res.redirect("/error");
    }
  }
);

app.get(
  "/posts/:postId",
  csrfProtection,
  commonRateLimiter,
  async function (req, res) {
    let currSession = isValidSession(req, res);
    if (!currSession.validSession) {
      console.error("ERROR: View Post: Invalid session");
      res.redirect("/");
      return;
    }
    const result = await getSinglePostFeed(
      currSession.userId,
      req.params.postId
    );
    if (result.success) {
      result.displayAuthor = true;
      result.pageTitle = "";
      result.csrfToken = req.csrfToken();

      result.isDelete = false;
      res.render(__dirname + "/views/feed.ejs", result);
    } else {
      console.error("ERROR: Feed: Failed to get posts\n", result.err);
      res.redirect("/error");
    }
  }
);

app.get(
  "/delete/:postId",
  csrfProtection,
  commonRateLimiter,
  async function (req, res) {
    let currSession = isValidSession(req, res);
    if (!currSession.validSession) {
      console.error("ERROR: My Posts: Invalid session");
      res.redirect("/");
      return;
    }

    let result = await getSinglePostFeed(currSession.userId, req.params.postId);
    if (result.success) {
      result.displayAuthor = false;
      result.pageTitle = "Delete Post";
      result.csrfToken = req.csrfToken();
      result.isDelete = true;
      res.render(__dirname + "/views/feed.ejs", result);
    } else {
      console.log("ERROR: Feed: Failed to get posts\n", result.err);
      res.redirect("/error");
    }
  }
);

app.post(
  "/delete/:postId",
  csrfProtection,
  commonRateLimiter,
  async function (req, res) {
    let currSession = isValidSession(req, res);
    if (!currSession.validSession) {
      console.error("ERROR: Delete Post: Invalid session");
      res.redirect("/");
      return;
    }
    const result = await removePost(currSession.userId, req.params.postId);
    if (result.success) {
      res.redirect("/myPosts");
    } else {
      console.error("ERROR: Feed: Failed to get posts\n", result.err);
      res.redirect("/error");
    }
  }
);

app.post("/logout", function (req, res) {
  sessionManagement.logoutUser(req.cookies.session_id);
  res.clearCookie("session_id");
  res.render(__dirname + "/views/logout.ejs");
});

app.post("/search", commonRateLimiter, async function (req, res) {
  let currSession = isValidSession(req, res);
  if (!currSession.validSession) {
    console.error("ERROR: Search: Invalid session");
    res.redirect("/");
    return;
  }

  if (isEmpty(req.body.searchBar)) {
    res.redirect("/feed");
    return;
  }

  const result = await getSearchFeed(currSession.userId, req.body.searchBar);
  if (result.success) {
    result.displayAuthor = true;
    result.pageTitle = "My Search: " + sanitizeInput(req.body.searchBar);
    result.isDelete = false;
    res.render(__dirname + "/views/feed.ejs", result);
  } else {
    console.error("ERROR: Feed: Failed to get posts\n", result.err);
    res.redirect("/error");
  }
});

app.get("/error", async function (req, res) {
  if (!isValidSession(req, res).validSession) {
    console.error("ERROR: Error: Invalid session");
    res.redirect("/error/loggedOut");
    return;
  }
  res.render(__dirname + "/views/error.ejs");
});

app.get("/error/loggedOut", async function (req, res) {
  res.render(__dirname + "/views/error_logged_out.ejs");
});

const server = https.createServer(httpsOptions, app);
server.listen(3000, function () {
  console.log("LOG: Listening to requests on port 3000");
  console.log("View Website: ", "https://localhost:3000/");
});

app.use(errorHandler);
