const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const resumeSchema = new mongoose.Schema(
  {
    filename: String, // stored (random) file name on disk
    originalName: String,
    mimetype: String,
    size: Number,
    uploadedAt: Date
  },
  { _id: false }
);

const studentProfileSchema = new mongoose.Schema(
  {
    phone: { type: String, trim: true, maxlength: 30, default: "" },
    university: { type: String, trim: true, maxlength: 120, default: "" },
    degree: { type: String, trim: true, maxlength: 120, default: "" },
    graduationYear: {
      type: Number,
      min: [1990, "Enter a valid graduation year"],
      max: [2100, "Enter a valid graduation year"]
    },
    location: { type: String, trim: true, maxlength: 100, default: "" },
    skills: { type: [String], default: [] },
    bio: { type: String, trim: true, maxlength: 800, default: "" },
    linkedin: { type: String, trim: true, default: "" },
    github: { type: String, trim: true, default: "" },
    portfolio: { type: String, trim: true, default: "" },
    resume: { type: resumeSchema, default: undefined }
  },
  { _id: false }
);

const companyProfileSchema = new mongoose.Schema(
  {
    companyName: { type: String, trim: true, maxlength: 100, default: "" },
    industry: { type: String, trim: true, maxlength: 100, default: "" },
    website: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, maxlength: 100, default: "" },
    size: {
      type: String,
      enum: ["", "1-10", "11-50", "51-200", "201-1000", "1000+"],
      default: ""
    },
    description: { type: String, trim: true, maxlength: 1000, default: "" }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must contain at least 2 characters"],
      maxlength: [80, "Name cannot exceed 80 characters"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address"]
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false
    },
    role: {
      type: String,
      enum: ["student", "company", "admin"],
      default: "student"
    },
    isActive: { type: Boolean, default: true },
    studentProfile: { type: studentProfileSchema, default: () => ({}) },
    companyProfile: { type: companyProfileSchema, default: () => ({}) },
    savedInternships: [{ type: mongoose.Schema.Types.ObjectId, ref: "Internship" }]
  },
  { timestamps: true }
);

// Hash the password whenever it is set or changed.
userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

// Shape sent to the client: never include the password hash or the other
// role's empty profile, and never expose the server-side resume file name.
userSchema.methods.toClient = function toClient() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  if (obj.role !== "student") delete obj.studentProfile;
  if (obj.role !== "company") delete obj.companyProfile;
  if (obj.studentProfile && obj.studentProfile.resume) {
    delete obj.studentProfile.resume.filename;
  }
  return obj;
};

module.exports = mongoose.model("User", userSchema);
