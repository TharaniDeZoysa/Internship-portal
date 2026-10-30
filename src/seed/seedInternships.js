// Run with:  npm run seed
// Adds demo accounts (1 admin, 1 student, 1 company per sample company) and 5
// sample internships owned by those companies. Safe to run more than once:
// existing accounts and internships (same title + company) are skipped.

require("dotenv").config();

const mongoose = require("mongoose");
const Internship = require("../models/Internship");
const User = require("../models/User");

const DEMO_PASSWORD = "Demo1234";

function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

async function ensureUser(data) {
  const existing = await User.findOne({ email: data.email });
  if (existing) return existing;
  const user = await User.create({ password: DEMO_PASSWORD, ...data });
  console.log(`Created ${user.role}: ${user.email}`);
  return user;
}

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

const internships = [
  {
    title: "Frontend Developer Intern",
    company: "BrightByte Technologies",
    description:
      "Build responsive user interfaces with React and work with senior engineers on real product features. You will learn code reviews, Git workflows and component testing.",
    location: "Singapore",
    internshipType: "Hybrid",
    field: "Software Engineering",
    duration: "6 months",
    stipend: 900,
    applicationDeadline: daysFromNow(45),
    applicationUrl: "https://example.com/apply/frontend-intern"
  },
  {
    title: "Data Analyst Intern",
    company: "DataNest Analytics",
    description:
      "Clean datasets, build dashboards and present insights to business teams using Python, SQL and visualisation tools. Ideal for students interested in data science.",
    location: "Remote",
    internshipType: "Remote",
    field: "Data Science",
    duration: "3 months",
    stipend: 700,
    applicationDeadline: daysFromNow(30),
    applicationUrl: "https://example.com/apply/data-analyst-intern"
  },
  {
    title: "QA Automation Intern",
    company: "QualityFirst Labs",
    description:
      "Write manual and automated test cases, report defects and help maintain the regression suite. You will be mentored on Selenium and API testing with Postman.",
    location: "London, UK",
    internshipType: "On-site",
    field: "QA / Testing",
    duration: "4 months",
    stipend: 800,
    applicationDeadline: daysFromNow(38),
    applicationUrl: "https://example.com/apply/qa-intern"
  },
  {
    title: "Cybersecurity Trainee",
    company: "SecureNet Solutions",
    description:
      "Assist the security team with vulnerability scanning, log monitoring and incident documentation. Learn the basics of ethical hacking and network defence.",
    location: "Toronto, Canada",
    internshipType: "Hybrid",
    field: "Cybersecurity",
    duration: "6 months",
    stipend: 1000,
    applicationDeadline: daysFromNow(52),
    applicationUrl: "https://example.com/apply/security-trainee"
  },
  {
    title: "UI/UX Design Intern",
    company: "PixelCraft Studio",
    description:
      "Create wireframes, prototypes and design-system components in Figma. You will run small user-research sessions and present design ideas to the team.",
    location: "Sydney, Australia",
    internshipType: "Remote",
    field: "UI/UX Design",
    duration: "3 months",
    stipend: 600,
    applicationDeadline: daysFromNow(25),
    applicationUrl: "https://example.com/apply/ux-intern"
  }
];

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is missing. Create a .env file from .env.example.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");

    await ensureUser({ name: "Portal Admin", email: "admin@demo.com", role: "admin" });
    await ensureUser({
      name: "Demo Student",
      email: "student@demo.com",
      role: "student",
      studentProfile: {
        university: "Demo University",
        degree: "BSc Computer Science",
        graduationYear: new Date().getFullYear() + 1,
        skills: ["JavaScript", "React", "SQL"]
      }
    });

    const companyUsers = {};
    for (const name of new Set(internships.map((item) => item.company))) {
      companyUsers[name] = await ensureUser({
        name: `${name} HR`,
        email: `hr@${slug(name)}.com`,
        role: "company",
        companyProfile: { companyName: name }
      });
    }

    let added = 0;
    for (const item of internships) {
      const existing = await Internship.findOne({
        title: item.title,
        company: item.company
      });
      if (existing) {
        // Records created before accounts existed get an owner so the demo
        // company can manage them.
        if (!existing.postedByUser) {
          existing.postedByUser = companyUsers[item.company]._id;
          await existing.save();
          console.log(`Linked to company account: ${item.title}`);
        } else {
          console.log(`Skipped (already exists): ${item.title}`);
        }
        continue;
      }
      await Internship.create({
        ...item,
        postedBy: item.company,
        postedByUser: companyUsers[item.company]._id
      });
      console.log(`Added: ${item.title} - ${item.company}`);
      added++;
    }

    console.log(`Done. ${added} internship(s) added.`);
    console.log(`Demo logins (password for all: ${DEMO_PASSWORD}):`);
    console.log("  admin@demo.com | student@demo.com | hr@brightbytetechnologies.com");
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();
