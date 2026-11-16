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
const StatusHistory = require("./models/StatusHistory");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/messconnect";
const ALLOWED_ACCOUNTS = new Set([
  "24ucs023@lnmiit.ac.in",
  "tanmaysharma@lnmiit.ac.in"
]);
const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner"];
const COMPLAINT_STATUSES = ["Pending", "In Progress", "Resolved"];

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

    if (!MEAL_TYPES.includes(mealType)) {
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
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not load submissions." });
  }
});

// UC-004: a student sees only their own ratings and complaints (FR-008, FR-009, BR-002).
app.get("/api/my/history", requireStudent, async (req, res) => {
  try {
    const studentId = req.session.user.id;
    const [ratings, complaints] = await Promise.all([
      MealRating.find({ studentId }).sort({ createdAt: -1 }).lean(),
      Complaint.find({ studentId }).sort({ createdAt: -1 }).lean()
    ]);

    res.json({
      ratings: ratings.map((item) => ({
        id: item._id,
        mealType: item.mealType,
        mealDate: item.mealDate,
        rating: item.rating,
        createdAt: item.createdAt
      })),
      complaints: complaints.map((item) => ({
        id: item._id,
        category: item.category,
        description: item.description,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not load your history." });
  }
});

// UC-006 step 4: complaint details with its status history.
app.get("/api/admin/complaints/:id", requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "This complaint no longer exists." });
    }
    const complaint = await Complaint.findById(req.params.id).lean();
    if (!complaint) return res.status(404).json({ message: "This complaint no longer exists." });

    const history = await StatusHistory.find({ complaintId: complaint._id }).sort({ changedAt: 1 }).lean();

    res.json({
      complaint: {
        id: complaint._id,
        studentName: complaint.studentName,
        category: complaint.category,
        description: complaint.description,
        status: complaint.status,
        createdAt: complaint.createdAt,
        updatedAt: complaint.updatedAt
      },
      history: history.map((item) => ({
        id: item._id,
        oldStatus: item.oldStatus,
        newStatus: item.newStatus,
        adminName: item.adminName,
        changedAt: item.changedAt
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not load the complaint." });
  }
});

// UC-006: change a complaint's status and record who changed it and when (FR-011, FR-012, NFR-011).
app.patch("/api/admin/complaints/:id/status", requireAdmin, async (req, res) => {
  try {
    const newStatus = String(req.body.status || "");
    if (!COMPLAINT_STATUSES.includes(newStatus)) {
      return res.status(400).json({ message: "Choose Pending, In Progress or Resolved." });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "This complaint no longer exists." });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "This complaint no longer exists." });

    const oldStatus = complaint.status;
    if (oldStatus === newStatus) {
      return res.status(400).json({ message: `Status is already ${oldStatus}. No change saved.` });
    }

    // Only update if the status is still what we read, so two admins saving at once
    // cannot both succeed. A standalone MongoDB has no transactions, so if the history
    // entry fails to save the status is put back to keep both records consistent.
    const changedAt = new Date();
    const updated = await Complaint.findOneAndUpdate(
      { _id: complaint._id, status: oldStatus },
      { status: newStatus, updatedAt: changedAt },
      { new: true, timestamps: false }
    );
    if (!updated) {
      return res.status(409).json({ message: "This complaint was updated by another admin. Please reload." });
    }

    let entry;
    try {
      entry = await StatusHistory.create({
        complaintId: complaint._id,
        oldStatus,
        newStatus,
        adminId: req.session.user.id,
        adminName: req.session.user.name,
        changedAt
      });
    } catch (error) {
      await Complaint.updateOne(
        { _id: complaint._id, status: newStatus },
        { status: oldStatus, updatedAt: complaint.updatedAt },
        { timestamps: false }
      );
      throw error;
    }

    res.json({
      message: `Status changed to ${newStatus}.`,
      change: {
        id: entry._id,
        oldStatus,
        newStatus,
        adminName: entry.adminName,
        changedAt
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not save. Please try again." });
  }
});

// UC-007: derived summary of average rating per meal and complaint counts by status (FR-013, FR-014).
app.get("/api/admin/summary", requireAdmin, async (req, res) => {
  try {
    const [mealAverages, statusCounts] = await Promise.all([
      MealRating.aggregate([{ $group: { _id: "$mealType", average: { $avg: "$rating" }, count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
    ]);

    const averageByMeal = {};
    for (const meal of MEAL_TYPES) {
      const found = mealAverages.find((item) => item._id === meal);
      averageByMeal[meal] = {
        average: found ? Math.round(found.average * 10) / 10 : null,
        count: found ? found.count : 0
      };
    }

    const complaintCounts = { total: 0 };
    for (const status of COMPLAINT_STATUSES) {
      const found = statusCounts.find((item) => item._id === status);
      complaintCounts[status] = found ? found.count : 0;
      complaintCounts.total += complaintCounts[status];
    }

    res.json({ averageByMeal, complaintCounts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not load the summary." });
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