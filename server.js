require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const MealRating = require("./models/MealRating");
const Complaint = require("./models/Complaint");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/messconnect";
const ALLOWED_ACCOUNTS = new Set([
  "24ucs023@lnmiit.ac.in",
  "tanmaysharma@lnmiit.ac.in"
]);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
  name: "messconnect.sid",
  secret: process.env.SESSION_SECRET || "development-only-change-this-secret",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGODB_URI }),
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 1000 * 60 * 60 * 4
  }
}));

// The React frontend is built into client/dist (run `npm run build`).
const CLIENT_DIST = path.join(__dirname, "client", "dist");
app.use(express.static(CLIENT_DIST));

function requireLogin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ message: "Please log in first." });
  next();
}

function requireStudent(req, res, next) {
  if (!req.session.user) return res.status(401).json({ message: "Please log in first." });
  if (req.session.user.role !== "Student") {
    return res.status(403).json({ message: "This action is only available to students." });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ message: "Please log in first." });
  if (req.session.user.role !== "Admin") {
    return res.status(403).json({ message: "Admin access is required." });
  }
  next();
}

app.get("/api/me", (req, res) => {
  res.json({ user: req.session.user || null });
});

app.post("/api/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Enter both email and password." });
    }

    if (!ALLOWED_ACCOUNTS.has(email)) {
      return res.status(403).json({ message: "This email address is not allowed to use this prototype." });
    }

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    req.session.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role
    };

    res.json({ message: "Login successful.", user: req.session.user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong while logging in." });
  }
});

app.post("/api/logout", requireLogin, (req, res) => {
  req.session.destroy((error) => {
    if (error) return res.status(500).json({ message: "Could not log out. Please try again." });
    res.clearCookie("messconnect.sid");
    res.json({ message: "You have logged out." });
  });
});

app.post("/api/ratings", requireStudent, async (req, res) => {
  try {
    const mealType = String(req.body.mealType || "");
    const mealDate = String(req.body.mealDate || "");
    const rating = Number(req.body.rating);

    if (!["Breakfast", "Lunch", "Dinner"].includes(mealType)) {
      return res.status(400).json({ message: "Choose a valid meal." });
    }
    if (!mealDate || Number.isNaN(Date.parse(mealDate))) {
      return res.status(400).json({ message: "Choose a valid meal date." });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be a whole number from 1 to 5." });
    }

    await MealRating.create({
      studentId: req.session.user.id,
      studentName: req.session.user.name,
      mealType,
      mealDate: new Date(mealDate + "T12:00:00"),
      rating
    });

    res.status(201).json({ message: "Meal rating submitted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not save the meal rating." });
  }
});

app.post("/api/complaints", requireStudent, async (req, res) => {
  try {
    const category = String(req.body.category || "");
    const description = String(req.body.description || "").trim();

    if (!["Food Quality", "Cleanliness", "Staff Behaviour", "Other"].includes(category)) {
      return res.status(400).json({ message: "Choose a valid complaint category." });
    }
    if (!description) return res.status(400).json({ message: "Please enter a complaint description." });
    if (description.length > 1000) {
      return res.status(400).json({ message: "Description must be 1000 characters or fewer." });
    }

    await Complaint.create({
      studentId: req.session.user.id,
      studentName: req.session.user.name,
      category,
      description,
      status: "Pending"
    });

    res.status(201).json({ message: "Complaint submitted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not save the complaint." });
  }
});

app.get("/api/admin/submissions", requireAdmin, async (req, res) => {
  try {
    const [ratings, complaints] = await Promise.all([
      MealRating.find().sort({ createdAt: -1 }).lean(),
      Complaint.find().sort({ createdAt: -1 }).lean()
    ]);

    res.json({
      ratings: ratings.map((item) => ({
        id: item._id,
        studentName: item.studentName,
        mealType: item.mealType,
        mealDate: item.mealDate,
        rating: item.rating,
        createdAt: item.createdAt
      })),
      complaints: complaints.map((item) => ({
        id: item._id,
        studentName: item.studentName,
        category: item.category,
        description: item.description,
        status: item.status,
        createdAt: item.createdAt
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not load submissions." });
  }
});

// Unknown /api routes return JSON; every other route is handled by React Router.
app.use("/api", (req, res) => res.status(404).json({ message: "Not found." }));
app.get("*", (req, res) => {
  res.sendFile(path.join(CLIENT_DIST, "index.html"), (error) => {
    if (error) res.status(500).send("Frontend not built. Run `npm run build` first.");
  });
});

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB.");
    app.listen(PORT, () => console.log(`MessConnect is running at http://localhost:${PORT}`));
  })
  .catch((error) => {
    console.error("Could not connect to MongoDB:", error.message);
    process.exit(1);
  });