require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/messconnect";

async function seed() {
  await mongoose.connect(MONGODB_URI);

  const demoUsers = [
    {
      name: "Student",
      email: "24ucs023@lnmiit.ac.in",
      password: "Student123!",
      role: "Student"
    },
    {
      name: "Professor Admin",
      email: "tanmaysharma@lnmiit.ac.in",
      password: "Admin123!",
      role: "Admin"
    }
  ];

  for (const demo of demoUsers) {
    const passwordHash = await bcrypt.hash(demo.password, 10);
    await User.findOneAndUpdate(
      { email: demo.email },
      { name: demo.name, email: demo.email, passwordHash, role: demo.role },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  console.log("Allowlisted accounts created/updated:");
  console.log("Student: 24ucs023@lnmiit.ac.in / Student123!");
  console.log("Admin:   tanmaysharma@lnmiit.ac.in / Admin123!");
  console.log("Only these two email addresses are allowed by the login endpoint.");
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});