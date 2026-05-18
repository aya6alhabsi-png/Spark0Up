import express from "express";// Framework to create API
import http from "http";//for sokit -->live update 
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
dotenv.config();


//IMPORT MODELS
import User from "./models/User.js";
import Admin from "./models/Admin.js";
import ReviewerInvite from "./models/ReviewerInvite.js";
import Idea from "./models/Idea.js";
import Evaluation from "./models/Evaluation.js";
import Event from "./models/Event.js";
import Feedback from "./models/Feedback.js";
import Notification from "./models/Notification.js";
import FundingProgram from "./models/FundingProgram.js";
import Contract from "./models/Contract.js";
import Certificate from "./models/Certificate.js";
import ActivityLog from "./models/ActivityLog.js";
import Activity from "./models/Activity.js";
import ForumPost from "./models/ForumPost.js";
import { sendEmail } from "./utils/sendEmail.js";


//SERVER SETUP
const app = express();
const server = http.createServer(app);

//UPLOAD DIRECTORY SETUP

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });


// GLOBAL MIDDLEWARE
const allowedOrigins = [
  "http://localhost:3000",
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",").map((url) => url.trim()).filter(Boolean) : []),
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(uploadsDir));


// SOCKET-->REAL-TIME SETUP
const io = new Server(server, {
  cors: corsOptions,
});
app.set("io", io);

io.on("connection", () => {
  console.log("Live client connected");
});


//FILE UPLOAD CONFIGURATION
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype?.startsWith("image/") && !file.mimetype?.includes("pdf")) {
      return cb(new Error("Only image and PDF files are allowed"));
    }
    cb(null, true);
  },
});


//DATABASE CONNECTION

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("Mongo Error:", err.message));


// SHARED CONSTANTS

const JWT_SECRET = process.env.JWT_SECRET || "changeme";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const IDEA_STATUSES = Idea.allowedStatuses;
const CONTRACT_STATUSES = Contract.allowedStatuses;
const PUBLIC_IDEA_FLOW = [
  "Submit Idea",
  "Admin Review",
  "Reviewer Review",
  "Present to Funders",
  "Funder Decision",
  "Contract",
  "Completed",
];
function isBlank(value) {
  return !value || !String(value).trim();
}
function isPositiveMoney(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}
function isPastDate(value) {
  const d = new Date(value);
  return !Number.isNaN(d.getTime()) && d < new Date();
}
async function logActivity(req, action, targetType, targetId, message = "", metadata = {}) {
  try {
    if (!req?.auth?.id) return;
    await ActivityLog.create({ actorId: req.auth.id, actorRole: req.auth.role, action, targetType, targetId, message, metadata });
  } catch (e) {
    console.error("Activity log error", e.message);
  }
}

function buildActivityResponse(activity) {
  if (!activity) return null;
  return {
    _id: activity._id,
    actorId: activity.actorId ? String(activity.actorId) : "",
    type: activity.type,
    title: activity.title,
    message: activity.message,
    actorName: activity.actorName,
    actorRole: activity.actorRole,
    targetId: activity.targetId,
    targetModel: activity.targetModel,
    audienceRoles: activity.audienceRoles || [],
    audienceUsers: (activity.audienceUsers || []).map((id) => String(id)),
    meta: activity.meta || {},
    createdAt: activity.createdAt,
  };
}

async function createActivity({
  type,
  title,
  message,
  actorId,
  actorName,
  actorRole,
  targetId,
  targetModel,
  audienceRoles = ["admin"],
  audienceUsers = [],
  meta = {},
}) {
  try {
    const activity = await Activity.create({
      type,
      title,
      message,
      actorId: actorId || undefined,
      actorModel: actorRole === "admin" ? "Admin" : "User",
      actorName: actorName || actorRole || "System",
      actorRole: actorRole || "system",
      targetId: targetId || undefined,
      targetModel: targetModel || "",
      audienceRoles,
      audienceUsers: Array.from(new Set((audienceUsers || []).filter(Boolean).map((id) => String(id)))),
      meta,
    });

    io.emit("activity:new", buildActivityResponse(activity));
    return activity;
  } catch (e) {
    console.error("Activity error", e.message);
    return null;
  }
}

async function requireApprovedFunderAccount(req, res, next) {
  try {
    if (req.auth?.role !== "funder") return next();
    const funder = await User.findOne({ _id: req.auth.id, role: "funder", status: "active" });
    if (!funder) return res.status(403).json({ success: false, msg: "Only approved funders can access funding ideas." });
    next();
  } catch (e) {
    return res.status(500).json({ success: false, msg: "Server error checking funder approval" });
  }
}

//code for password reset
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
// Hash (used for reviewer invite tokens)
function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}
// Create JWT token for authenticated user
function signToken({ id, role }) {
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: "7d" });
}
function fullUploadUrl(url) {
  return url || "";
}

function getPublicFrontendUrl(req) {
  const envUrl = process.env.FRONTEND_URL;
  if (envUrl && !envUrl.includes("localhost")) return envUrl.replace(/\/$/, "");

  const origin = req.get("origin") || req.get("referer") || "";
  if (origin) {
    try {
      const parsed = new URL(origin);
      if (parsed.hostname.includes("onrender.com") || parsed.hostname.includes("localhost")) {
        return parsed.origin.replace(/\/$/, "");
      }
    } catch {}
  }

  return (envUrl || "http://localhost:3000").replace(/\/$/, "");
}

//user
function buildUserResponse(u) {
  if (!u) return null;
  return {
    _id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    phone: u.phone || "",
    birthday: u.birthday || "",
    gender: u.gender || "",
    fieldOfInterest: u.fieldOfInterest || "",
    bio: u.bio || "",
    imageUrl: fullUploadUrl(u.imageUrl),
    specialization: u.specialization || "",
    organization: u.organization || "",
    experienceYears: u.experienceYears || 0,
    linkedin: u.linkedin || "",
    createdAt: u.createdAt,
  };
}
//admin
function buildAdminResponse(a) {
  if (!a) return null;
  return {
    _id: a._id,
    name: a.name,
    email: a.email,
    role: "admin",
    status: "active",
    phone: a.phone || "",
    birthday: a.birthday || "",
    bio: a.bio || "",
    imageUrl: fullUploadUrl(a.imageUrl),
    createdAt: a.createdAt,
  };
}
// Format idea data with related user/reviewer/evaluation info
function buildIdeaResponse(idea) {
  if (!idea) return null;
  return {
    _id: idea._id,
    title: idea.title,
    description: idea.description,
    ipFormUrl: idea.ipFormUrl || "",
    status: idea.status,
    innovatorId: idea.innovatorId?._id || idea.innovatorId,
    innovatorName: idea.innovatorId?.name || idea.innovatorName || "",
    innovatorEmail: idea.innovatorId?.email || "",
    innovatorPhone: idea.innovatorId?.phone || "",
    innovatorImageUrl: fullUploadUrl(idea.innovatorId?.imageUrl || idea.innovatorImageUrl || ""),
    adminComments: idea.adminComments || [],
    assignedReviewerIds: (idea.assignedReviewerIds || []).map((r) => r?._id || r),
    assignedReviewers: (idea.assignedReviewerIds || []).map((r) =>
      typeof r === "object"
        ? { _id: r._id, name: r.name, email: r.email, specialization: r.specialization }
        : { _id: r }
    ),
    evaluations:
      (idea.evaluationIds || []).map((e) =>
        typeof e === "object"
          ? {
              _id: e._id,
              score: e.score,
              decision: e.decision || "accepted",
              comments: e.comments,
              reviewerId: e.reviewerId?._id || e.reviewerId,
              reviewerName: e.reviewerId?.name || "",
              createdAt: e.createdAt,
            }
          : e
      ) || [],
    selectedFunderIds: (idea.selectedFunderIds || []).map((f) => f?._id || f),
    selectedFunders: (idea.selectedFunderIds || []).map((f) =>
      typeof f === "object"
        ? { _id: f._id, name: f.name, email: f.email, organization: f.organization }
        : { _id: f }
    ),
    funderDecisions: (idea.funderDecisions || []).map((d) => ({
      funderId: d.funderId?._id || d.funderId,
      funderName: d.funderId?.name || "",
      decision: d.decision,
      comment: d.comment || "",
      createdAt: d.createdAt,
    })),
    messages: (idea.messages || []).map((m) => ({
      senderId: m.senderId,
      senderRole: m.senderRole,
      message: m.message,
      createdAt: m.createdAt,
    })),
    fundingAgreement: idea.fundingAgreement || {},
    contract: typeof idea.contractId === "object" ? idea.contractId : null,
    contractId: idea.contractId?._id || idea.contractId || null,
    createdAt: idea.createdAt,
    updatedAt: idea.updatedAt,
    flow: PUBLIC_IDEA_FLOW,
  };
}

//live idea updates
async function emitIdeaUpdate(ideaId) {
  try {
    const populated = await Idea.findById(ideaId)
      .populate("innovatorId", "name email phone imageUrl")
      .populate({ path: "evaluationIds", populate: { path: "reviewerId", select: "name email" } })
      .populate("assignedReviewerIds", "name email specialization")
      .populate("selectedFunderIds", "name email organization")
      .populate("funderDecisions.funderId", "name email organization")
      .populate("contractId");
    if (populated) io.emit("idea:updated", buildIdeaResponse(populated));
  } catch (e) {
    console.error("socket emit idea error", e.message);
  }
}

// event
async function moveFinishedEventsToArchive() {
  const now = new Date();
  await Event.updateMany(
    { endDate: { $lte: now }, status: { $in: ['active', 'disabled', 'draft'] } },
    { $set: { status: 'archived' } }
  );
}

// Backward-compatible helper name used by older routes. Finished events now go to Archive, not Draft.
async function moveFinishedEventsToDraft() {
  return moveFinishedEventsToArchive();
}

function ensureEventQrTokens(event) {
  if (!event.qrCheckInToken) event.qrCheckInToken = crypto.randomBytes(24).toString("hex");
  if (!event.qrCheckOutToken) event.qrCheckOutToken = crypto.randomBytes(24).toString("hex");
}

async function issueEventCertificateIfEligible(event, registration) {
  if (!event || !registration) return null;

  // Certificate is released only after attendance scan + event evaluation submission.
  if (registration.attendanceStatus !== "completed") return null;

  const exists = await Certificate.findOne({
    userId: registration.userId,
    eventId: event._id,
    type: "EVENT_PARTICIPATION",
  });
  if (exists) {
    registration.certificateIssued = true;
    return exists;
  }

  const participant = await User.findById(registration.userId).select("name email role");
  registration.certificateIssued = true;

  return Certificate.create({
    userId: registration.userId,
    eventId: event._id,
    type: "EVENT_PARTICIPATION",
    platformName: "SparkUp Platform",
    userName: participant?.name || "Participant",
    eventName: event.title,
    organizationName: event.organizationName || "SparkUp",
    eventDate: event.startDate,
    thankYouMessage:
      "Thank you for attending this SparkUp event. Your participation supports innovation, creativity, and future ideas.",
  });
}


function calculateAgeFromBirthday(birthday) {
  if (!birthday) return null;
  const birthDate = new Date(birthday);
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age -= 1;
  return age >= 0 && age <= 120 ? age : null;
}

function buildDemographicAnalytics(users) {
  const genderBreakdown = { female: 0, male: 0 };
  const fieldBreakdown = {};
  const ageBreakdown = { under18: 0, age18to24: 0, age25to34: 0, age35plus: 0, unspecified: 0 };

  users.forEach((user) => {
    const gender = user.gender;
    if (gender === "female" || gender === "male") genderBreakdown[gender] += 1;

    const field = (user.fieldOfInterest || user.specialization || "Unspecified").trim() || "Unspecified";
    fieldBreakdown[field] = (fieldBreakdown[field] || 0) + 1;

    const age = calculateAgeFromBirthday(user.birthday);
    if (age === null) ageBreakdown.unspecified += 1;
    else if (age < 18) ageBreakdown.under18 += 1;
    else if (age <= 24) ageBreakdown.age18to24 += 1;
    else if (age <= 34) ageBreakdown.age25to34 += 1;
    else ageBreakdown.age35plus += 1;
  });

  return { genderBreakdown, ageBreakdown, fieldBreakdown };
}

function buildEventEvaluationSummary(events, feedback) {
  const eventFeedback = feedback.filter((f) => f.category === 'EVENT_EVALUATION' && f.eventId);
  const now = new Date();
  return events
    .filter((event) => {
      const eventId = String(event._id);
      const hasEvaluations = eventFeedback.some((f) => String(f.eventId?._id || f.eventId) === eventId);
      const eventFinished = event.endDate && new Date(event.endDate) <= now;
      return eventFinished || event.status === 'archived' || hasEvaluations;
    })
    .map((event) => {
      const eventId = String(event._id);
      const evaluations = eventFeedback.filter((f) => String(f.eventId?._id || f.eventId) === eventId);
      const ratings = evaluations.map((f) => Number(f.rating || 0)).filter((n) => n > 0);
      const averageRating = ratings.length ? ratings.reduce((sum, n) => sum + n, 0) / ratings.length : 0;
      const completedRegistrations = (event.registrations || []).filter((r) => r.attendanceStatus === 'completed').length;
      const checkedInRegistrations = (event.registrations || []).filter((r) => ['checked_in', 'completed'].includes(r.attendanceStatus)).length;
      const certificatesIssued = (event.registrations || []).filter((r) => r.certificateIssued).length;
      return {
        eventId,
        title: event.title,
        organizationName: event.organizationName || 'SparkUp',
        startDate: event.startDate,
        endDate: event.endDate,
        status: event.status,
        registeredParticipants: (event.registrations || []).length,
        checkedInParticipants: checkedInRegistrations,
        completedParticipants: completedRegistrations,
        certificatesIssued,
        evaluationCount: evaluations.length,
        averageRating: Number(averageRating.toFixed(2)),
        evaluationGenderBreakdown: {
          female: evaluations.filter((f) => f.gender === 'female').length,
          male: evaluations.filter((f) => f.gender === 'male').length,
        },
        evaluationAgeBreakdown: {
          under18: evaluations.filter((f) => f.ageRange === 'under18').length,
          age18to24: evaluations.filter((f) => f.ageRange === '18-24').length,
          age25to34: evaluations.filter((f) => f.ageRange === '25-34').length,
          age35plus: evaluations.filter((f) => f.ageRange === '35plus').length,
        },
        latestComments: evaluations.slice(0, 5).map((f) => ({
          _id: f._id,
          rating: f.rating,
          message: f.message,
          role: f.role,
          gender: f.gender,
          ageRange: f.ageRange,
          user: f.userId,
          createdAt: f.createdAt,
        })),
      };
    })
    .sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
}

function buildEventResponse(event) {
  if (!event) return null;
  return {
    _id: event._id,
    title: event.title,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    location: event.location,
    organizationName: event.organizationName || "SparkUp",
    imageUrl: fullUploadUrl(event.imageUrl),
    capacity: event.capacity,
    createdByAdminId: event.createdByAdminId,
    registrations: event.registrations || [],
    status: event.status || "active",
    isPast: event.endDate ? new Date(event.endDate) < new Date() : false,
    registrationCount: event.registrations?.length || 0,
    createdAt: event.createdAt,
  };
}

// Create one notification record for a user
async function createNotification(userId, type, message, meta = {}) {
  if (!userId) return;
  try {
    await Notification.create({
      userId,
      type,
      message,
      meta,
      read: false,
    });
  } catch (e) {
    console.error("Notification error", e.message);
  }
}

// ===============================
// NOTIFICATION ROUTES
// Real unread count for each logged-in user
// ===============================

// GET REAL UNREAD NOTIFICATION COUNT
app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.id || req.auth._id;

    const count = await Notification.countDocuments({
      userId,
      read: false,
    });

    return res.json({
      success: true,
      count,
    });
  } catch (error) {
    console.log("Unread notification count error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

// GET ALL USER NOTIFICATIONS
app.get("/api/notifications", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.id || req.auth._id;

    const notifications = await Notification.find({
      userId,
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.log("Get notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

// MARK ALL NOTIFICATIONS AS READ
app.patch("/api/notifications/read-all", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.id || req.auth._id;

    await Notification.updateMany(
      {
        userId,
        read: false,
      },
      {
        $set: {
          read: true,
        },
      }
    );

    return res.json({
      success: true,
      message: "Notifications marked as read",
    });
  } catch (error) {
    console.log("Read notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});
// Send same notification to all admins


async function sendAutomatedEventReminders() {
  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in1h = new Date(now.getTime() + 60 * 60 * 1000);
    const upcomingEvents = await Event.find({ status: "active", startDate: { $gt: now, $lte: in24h } });

    for (const event of upcomingEvents) {
      let changed = false;
      for (const registration of event.registrations || []) {
        if (!registration.userId || registration.attendanceStatus !== "registered") continue;

        if (!registration.reminder24hSent && event.startDate <= in24h) {
          await createNotification(
            registration.userId,
            "EVENT_REMINDER_24H",
            `Reminder: ${event.title} starts within 24 hours.`,
            { eventId: event._id }
          );
          registration.reminder24hSent = true;
          changed = true;
        }

        if (!registration.reminder1hSent && event.startDate <= in1h) {
          await createNotification(
            registration.userId,
            "EVENT_REMINDER_1H",
            `Reminder: ${event.title} starts within 1 hour.`,
            { eventId: event._id }
          );
          registration.reminder1hSent = true;
          changed = true;
        }
      }
      if (changed) await event.save();
    }
  } catch (e) {
    console.error("Automated event reminder error", e.message);
  }
}

// CAT A M13: automated event reminders run while the backend server is active.
setInterval(sendAutomatedEventReminders, 15 * 60 * 1000);
setTimeout(sendAutomatedEventReminders, 10 * 1000);

async function notifyAllAdmins(type, message, meta = {}) {
  try {
    const admins = await Admin.find({}, "_id");
    await Promise.all(admins.map((admin) => createNotification(admin._id, type, message, meta)));
  } catch (e) {
    console.error("Admin notification error", e.message);
  }
}
// Find account by email 
async function getAccountByEmail(email) {
  let account = await Admin.findOne({ email });
  if (account) return { account, isAdmin: true };
  account = await User.findOne({ email });
  if (account) return { account, isAdmin: false };
  return { account: null, isAdmin: false };
}
// Find logged-in account based on decoded JWT payload
async function getAccountByAuth(auth) {
  if (!auth?.id || !auth?.role) return null;
  if (auth.role === "admin") return Admin.findById(auth.id);
  return User.findById(auth.id);
}
function getAuthObjectId(id) {
  try {
    return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;
  } catch {
    return id;
  }
}


// Middleware: require valid JWT token
function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, msg: "No token" });

    const decoded = jwt.verify(token, JWT_SECRET);

    // Normalize role values so admin tokens are accepted even if the
    // frontend/backend saved the role as Admin/ADMIN by mistake.
    if (decoded?.role) decoded.role = String(decoded.role).toLowerCase().trim();

    req.auth = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, msg: "Invalid token" });
  }
}
// Middleware: require one of allowed roles
function requireRole(...roles) {
  const allowedRoles = roles.map((r) => String(r).toLowerCase().trim());

  return (req, res, next) => {
    const currentRole = String(req.auth?.role || "").toLowerCase().trim();

    if (!currentRole) {
      return res.status(401).json({ success: false, msg: "Unauthorized" });
    }

    if (!allowedRoles.includes(currentRole)) {
      return res.status(403).json({
        success: false,
        msg: "Forbidden: this action is allowed only for " + allowedRoles.join(", "),
      });
    }

    req.auth.role = currentRole;
    next();
  };
}

app.get("/", (req, res) => res.send("SparkUp API running"));

// Real-time activity feed
app.get("/activity", requireAuth, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 60), 100);
    const ownFilter = req.auth.role === "admin"
      ? { audienceRoles: "admin" }
      : {
          $or: [
            { actorId: req.auth.id },
            { audienceUsers: req.auth.id },
          ],
        };
    const activities = await Activity.find(ownFilter)
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.json({ success: true, activities: activities.map(buildActivityResponse) });
  } catch (e) {
    console.error("get activity error", e);
    return res.status(500).json({ success: false, msg: "Server error fetching activity feed" });
  }
});

/* =========================
   COMMUNITY DISCUSSION FORUMS
========================= */
app.post("/api/forum", requireAuth, requireRole("innovator", "reviewer", "funder"), upload.fields([{ name: "image", maxCount: 1 }, { name: "attachment", maxCount: 1 }]), async (req, res) => {
  try {
    const { title, message } = req.body;
    if (isBlank(title) || isBlank(message)) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    const imageFile = req.files?.image?.[0];
    const attachmentFile = req.files?.attachment?.[0];
    const newPost = await ForumPost.create({
      title: String(title).trim(),
      message: String(message).trim(),
      author: req.auth.id,
      imageUrl: imageFile ? `/uploads/${imageFile.filename}` : "",
      attachmentUrl: attachmentFile ? `/uploads/${attachmentFile.filename}` : "",
      attachmentName: attachmentFile?.originalname || "",
    });
    const populatedPost = await ForumPost.findById(newPost._id)
      .populate("author", "name role email imageUrl")
      .populate("comments.user", "name role imageUrl");

    await createActivity({
      type: "FORUM_POST",
      title: "New community discussion",
      message: `${populatedPost.title} was posted in the SparkUp community.`,
      actorId: req.auth.id,
      actorName: req.auth.role,
      actorRole: req.auth.role,
      targetId: populatedPost._id,
      targetModel: "ForumPost",
      audienceRoles: ["admin"],
      audienceUsers: [req.auth.id],
      meta: { postId: populatedPost._id },
    });

    return res.status(201).json({ success: true, message: "Discussion created successfully", post: populatedPost });
  } catch (error) {
    console.log("Create forum post error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});

app.get("/api/forum", requireAuth, async (req, res) => {
  try {
    const posts = await ForumPost.find()
      .populate("author", "name role email imageUrl")
      .populate("comments.user", "name role imageUrl")
      .sort({ createdAt: -1 });
    return res.json({ success: true, posts });
  } catch (error) {
    console.log("Get forum posts error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});

app.get("/api/forum/:id", requireAuth, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id)
      .populate("author", "name role email imageUrl")
      .populate("comments.user", "name role imageUrl");
    if (!post) return res.status(404).json({ success: false, message: "Discussion post not found" });
    return res.json({ success: true, post });
  } catch (error) {
    console.log("Get one forum post error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});
app.patch("/api/forum/:id/like", requireAuth, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const userId = req.auth.id;

    const alreadyLiked = post.likes.some(
      (id) => id.toString() === userId
    );

    if (alreadyLiked) {
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId
      );
    } else {
      post.likes.push(userId);
    }

    await post.save();

    return res.json({
      success: true,
      liked: !alreadyLiked,
      likesCount: post.likes.length,
    });
  } catch (error) {
    console.log("Like post error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

app.post("/api/forum/:id/comment", requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (isBlank(text)) return res.status(400).json({ success: false, message: "Comment is required" });
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Discussion post not found" });
    post.comments.push({ user: req.auth.id, text: String(text).trim() });
    await post.save();
    const updatedPost = await ForumPost.findById(req.params.id)
      .populate("author", "name role email imageUrl")
      .populate("comments.user", "name role imageUrl");

    await createActivity({
      type: "FORUM_COMMENT",
      title: "New forum reply",
      message: `A new reply was added to ${updatedPost.title}.`,
      actorId: req.auth.id,
      actorName: req.auth.role,
      actorRole: req.auth.role,
      targetId: updatedPost._id,
      targetModel: "ForumPost",
      audienceRoles: ["admin"],
      audienceUsers: [req.auth.id, updatedPost.author],
      meta: { postId: updatedPost._id },
    });

    return res.json({ success: true, message: "Comment added successfully", post: updatedPost });
  } catch (error) {
    console.log("Add forum comment error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});

app.delete("/api/forum/:id", requireAuth, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Discussion post not found" });
    const isOwner = String(post.author) === String(req.auth.id);
    const isAdmin = req.auth.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: "You are not allowed to delete this discussion" });
    await ForumPost.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: "Discussion deleted successfully" });
  } catch (error) {
    console.log("Delete forum post error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});




// User registration (innovator/funder )
app.post("/userRegister", async (req, res) => {
  try {
    const { name, email, password, role, phone, birthday, gender, fieldOfInterest } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ msg: "All fields are required" });
    }
    if (!["innovator", "funder"].includes(role)) {
      return res.status(400).json({ msg: "Role must be innovator or funder" });
    }
    const normalizedEmail = email.toLowerCase().trim();
    if (await User.findOne({ email: normalizedEmail }) || await Admin.findOne({ email: normalizedEmail })) {
      return res.status(400).json({ msg: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role,
      status: role === "funder" ? "pending" : "active",
      phone: phone || "",
      birthday: birthday || "",
      gender: gender || "",
      fieldOfInterest: fieldOfInterest || "",
    });
    return res.status(201).json({ msg: "Registration Success", user: buildUserResponse(user) });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ msg: "Server Error" });
  }
});
// Admin registration
app.post("/adminRegister", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ msg: "All fields are required" });
    const normalizedEmail = email.toLowerCase().trim();
    if (await Admin.findOne({ email: normalizedEmail })) return res.status(400).json({ msg: "Admin email already exists" });
    const admin = await Admin.create({ name, email: normalizedEmail, passwordHash: await bcrypt.hash(password, 10) });
    return res.status(201).json({ msg: "Admin created", admin: buildAdminResponse(admin) });
  } catch (err) {
    console.error("Admin register error:", err);
    return res.status(500).json({ msg: "Server Error" });
  }
});
// User/Admin login
app.post("/userLogin", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) return res.json({ serverMsg: "All fields are required", loginStatus: false });

    const normalizedEmail = email.toLowerCase().trim();
    let account = null;
    let isAdmin = false;

    if (role === "admin") {
      account = await Admin.findOne({ email: normalizedEmail });
      isAdmin = true;
    } else if (role) {
      account = await User.findOne({ email: normalizedEmail, role });
    } else {
      const lookup = await getAccountByEmail(normalizedEmail);
      account = lookup.account;
      isAdmin = lookup.isAdmin;
    }

    if (!account) return res.json({ serverMsg: "Account not found", loginStatus: false });
    const ok = await bcrypt.compare(password, account.passwordHash);
    if (!ok) return res.json({ serverMsg: "Incorrect password", loginStatus: false });

    if (!isAdmin) {
      if (["rejected", "blocked"].includes(account.status)) {
        return res.json({ serverMsg: "Account is not allowed to login", loginStatus: false });
      }
      if (account.status === "pending") {
        return res.json({ serverMsg: `${account.role} account pending admin approval`, loginStatus: false });
      }
    }

    const token = signToken({ id: account._id, role: isAdmin ? "admin" : account.role });
    return res.json({
      serverMsg: "Login Success",
      loginStatus: true,
      token,
      user: isAdmin ? buildAdminResponse(account) : buildUserResponse(account),
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.json({ serverMsg: "Server Error", loginStatus: false });
  }
});
//Forgot password + send email code
app.post("/auth/forgot-password", async (req, res) => {
  try {
    const { email, note } = req.body;
    if (!email) return res.status(400).json({ success: false, msg: "Email is required" });
    const { account } = await getAccountByEmail(email.toLowerCase().trim());
    if (!account) return res.json({ success: true, msg: "If this email exists, a confirmation code was sent." });

    account.resetCode = generateCode();
    account.resetCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await account.save();

    try {
      await sendEmail({
        to: account.email,
        subject: "SparkUp Password Reset Code",
        text: `Your code is ${account.resetCode}`,
        html: `<p>Your SparkUp password reset code is:</p><h2>${account.resetCode}</h2>`,
      });
    } catch (e) {
      console.log("Email send skipped/failed:", e.message);
    }
    return res.json({ success: true, msg: "If this email exists, a confirmation code was sent." });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ success: false, msg: "Server error sending code" });
  }
});
// Verify reset code
app.post("/auth/verify-code", async (req, res) => {
  try {
    const { email, code } = req.body;
    const { account } = await getAccountByEmail((email || "").toLowerCase().trim());
    if (!account || !account.resetCode || account.resetCode !== code || account.resetCodeExpiry < new Date()) {
      return res.status(400).json({ success: false, msg: "Invalid or expired code" });
    }
    return res.json({ success: true, msg: "Code verified" });
  } catch (err) {
    console.error("Verify code error:", err);
    return res.status(500).json({ success: false, msg: "Server error verifying code" });
  }
});
//Reset password + verification code
app.post("/auth/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const lookup = await getAccountByEmail((email || "").toLowerCase().trim());
    const account = lookup.account;
    if (!account || !account.resetCode || account.resetCode !== code || account.resetCodeExpiry < new Date()) {
      return res.status(400).json({ success: false, msg: "Invalid or expired code" });
    }
    account.passwordHash = await bcrypt.hash(newPassword, 10);
    account.resetCode = undefined;
    account.resetCodeExpiry = undefined;
    await account.save();
    return res.json({ success: true, msg: "Password has been updated successfully." });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ success: false, msg: "Server error resetting password" });
  }
});

// Change password for logged-in account
app.post("/auth/change-password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, msg: "Current password and new password are required" });
    }
    const account = await getAccountByAuth(req.auth);
    if (!account) return res.status(404).json({ success: false, msg: "Account not found" });
    const ok = await bcrypt.compare(currentPassword, account.passwordHash);
    if (!ok) return res.status(400).json({ success: false, msg: "Current password is incorrect" });
    account.passwordHash = await bcrypt.hash(newPassword, 10);
    await account.save();
    return res.json({ success: true, msg: "Password updated successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).json({ success: false, msg: "Server error changing password" });
  }
});

//reset password+ new password
app.post("/resetPassword", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const { account } = await getAccountByEmail((email || "").toLowerCase().trim());
    if (!account) return res.status(404).json({ success: false, msg: "Account not found" });
    account.passwordHash = await bcrypt.hash(newPassword, 10);
    await account.save();
    return res.json({ success: true, msg: "Password updated" });
  } catch (err) {
    console.error("/resetPassword error:", err);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});

// Get current logged-in profile
app.get("/users/me", requireAuth, async (req, res) => {
  const account = await getAccountByAuth(req.auth);
  if (!account) return res.status(404).json({ success: false, msg: "Account not found" });
  return res.json({ success: true, user: req.auth.role === "admin" ? buildAdminResponse(account) : buildUserResponse(account) });
});

// edit profile and optional image
app.patch("/users/me", requireAuth, upload.single("image"), async (req, res) => {
  try {
    const account = await getAccountByAuth(req.auth);
    if (!account) return res.status(404).json({ success: false, msg: "Account not found" });
    const { name, bio, phone, birthday, gender, fieldOfInterest, specialization, organization, experienceYears, linkedin } = req.body;
    if (typeof name === "string") account.name = name;
    if (typeof bio === "string") account.bio = bio;
    if (typeof phone === "string") account.phone = phone;
    if (typeof birthday === "string") account.birthday = birthday;
    if (req.auth.role !== "admin") {
      if (typeof gender === "string") account.gender = gender;
      if (typeof fieldOfInterest === "string") account.fieldOfInterest = fieldOfInterest;
      if (typeof specialization === "string") account.specialization = specialization;
      if (typeof organization === "string") account.organization = organization;
      if (typeof experienceYears !== "undefined") account.experienceYears = Number(experienceYears || 0);
      if (typeof linkedin === "string") account.linkedin = linkedin;
    }
    if (req.file) account.imageUrl = `/uploads/${req.file.filename}`;
    await account.save();
    return res.json({ success: true, user: req.auth.role === "admin" ? buildAdminResponse(account) : buildUserResponse(account) });
  } catch (e) {
    console.error("update profile error", e);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});




// Admin directory list for user management
app.get("/admin/admins", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const admins = await Admin.find({}).sort({ createdAt: -1 });
    return res.json({ success: true, admins: admins.map(buildAdminResponse) });
  } catch (e) {
    console.error("list admins error", e);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});

// Add new admin
app.post("/admin/create-admin", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, msg: "name, email, password required" });
    const normalizedEmail = email.toLowerCase().trim();
    if (await Admin.findOne({ email: normalizedEmail })) return res.status(400).json({ success: false, msg: "Admin already exists" });
    const admin = await Admin.create({ name, email: normalizedEmail, passwordHash: await bcrypt.hash(password, 10) });
    return res.json({ success: true, msg: "Admin created", admin: buildAdminResponse(admin) });
  } catch (e) {
    console.error("create-admin error", e);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});
// Invite reviewer with clear Accept / Reject invitation UI
app.post("/admin/reviewers/invite", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { email, note } = req.body;
    if (!email) return res.status(400).json({ success: false, msg: "email required" });
    const normalizedEmail = email.toLowerCase().trim();
    if (await User.findOne({ email: normalizedEmail })) return res.status(400).json({ success: false, msg: "This email already has a user account" });

    const existingInvite = await ReviewerInvite.findOne({ email: normalizedEmail, status: "pending", expiresAt: { $gt: new Date() } });
    if (existingInvite) return res.status(400).json({ success: false, msg: "A pending invitation already exists for this email" });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256(rawToken);
    const invite = await ReviewerInvite.create({
      email: normalizedEmail,
      tokenHash,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      status: "pending",
      invitedByAdminId: req.auth.id,
    });

    const inviteLink = `${FRONTEND_URL}/reviewer-invite?token=${rawToken}`;
    const rejectLink = `${FRONTEND_URL}/reviewer-invite?token=${rawToken}&action=reject`;
    const html = `
      <div style="font-family:Arial,sans-serif;background:#f4f8ff;padding:28px;color:#0f2747">
        <div style="max-width:620px;margin:auto;background:white;border-radius:24px;padding:30px;border:1px solid #dbeafe;box-shadow:0 12px 30px rgba(15,39,71,.10)">
          <h2 style="margin:0 0 10px;color:#0f2747">SparkUp Reviewer Invitation</h2>
          <p style="font-size:16px;line-height:1.6">Hello, this is the SparkUp team. We would like you to join our team as a reviewer.</p>
          <p style="font-size:14px;color:#64748b">Please choose one option below. If you accept, you will complete your reviewer profile and specialization.</p>${note ? `<div style="padding:12px;background:#fff7ed;border-radius:12px;margin:12px 0"><b>Admin note:</b><br/>${note}</div>` : ""}
          <div style="margin:26px 0;display:flex;gap:12px;flex-wrap:wrap">
            <a href="${inviteLink}" style="background:#1664d9;color:white;text-decoration:none;padding:13px 22px;border-radius:999px;font-weight:700">Accept Invitation</a>
            <a href="${rejectLink}" style="background:#ef4444;color:white;text-decoration:none;padding:13px 22px;border-radius:999px;font-weight:700">Reject</a>
          </div>
          <p style="font-size:13px;color:#94a3b8">This invitation expires in 48 hours.</p>
        </div>
      </div>`;

    try {
      await sendEmail({
        to: normalizedEmail,
        subject: "SparkUp Reviewer Invitation - Accept or Reject",
        text: `Hello, this is the SparkUp team.\n\n${note ? `Admin note: ${note}\n\n` : ""}Please accept or reject the reviewer invitation here: ${inviteLink}\nReject link: ${rejectLink}`,
        html,
      });
    } catch (e) {
      console.log("Invite email failed:", e.message);
    }
    return res.json({ success: true, msg: "Invitation sent with Accept/Reject options", inviteId: invite._id, inviteLink });
  } catch (e) {
    console.error("invite reviewer error", e);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});

// Admin lists reviewer invitations so user management can show Pending / Accepted / Rejected invitations
app.get("/admin/reviewer-invites", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const invites = await ReviewerInvite.find({}).sort({ createdAt: -1 }).limit(50);
    return res.json({
      success: true,
      invites: invites.map((i) => ({
        _id: i._id,
        email: i.email,
        status: i.status,
        expiresAt: i.expiresAt,
        createdAt: i.createdAt,
        acceptedAt: i.acceptedAt,
        rejectedAt: i.rejectedAt,
      })),
    });
  } catch (e) {
    console.error("list reviewer invites error", e);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});

// Reviewer can reject invitation before registration
app.patch("/reviewers/invite/reject", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, msg: "token required" });
    const invite = await ReviewerInvite.findOne({ tokenHash: sha256(token) });
    if (!invite) return res.status(400).json({ success: false, msg: "Invalid token" });
    if (invite.status !== "pending") return res.status(400).json({ success: false, msg: `Invitation already ${invite.status}` });
    invite.status = "rejected";
    invite.rejectedAt = new Date();
    await invite.save();
    if (invite.invitedByAdminId) {
      await createNotification(invite.invitedByAdminId, "REVIEWER_INVITE_REJECTED", `${invite.email} rejected the reviewer invitation`, { inviteId: invite._id });
    }
    return res.json({ success: true, msg: "Invitation rejected" });
  } catch (e) {
    console.error("reject invite error", e);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});

// Validate reviewer invite token and return invited email
app.get("/reviewers/invite/validate", async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(400).json({ success: false, msg: "token required" });
    const invite = await ReviewerInvite.findOne({ tokenHash: sha256(token) });
    if (!invite) return res.status(400).json({ success: false, msg: "Invalid token" });
    if (invite.status !== "pending") return res.status(400).json({ success: false, msg: "Invite already used" });
    if (invite.expiresAt < new Date()) {
      invite.status = "expired";
      await invite.save();
      return res.status(400).json({ success: false, msg: "Invite expired" });
    }
    return res.json({ success: true, email: invite.email });
  } catch (e) {
    console.error("validate invite error", e);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});
// Reviewer registration using invite
app.post("/reviewers/register", async (req, res) => {
  try {
    const { token, name, password, specialization, organization, experienceYears, linkedin, phone } = req.body;
    if (!token || !name || !password) return res.status(400).json({ success: false, msg: "token, name, password required" });
    const invite = await ReviewerInvite.findOne({ tokenHash: sha256(token) });
    if (!invite) return res.status(400).json({ success: false, msg: "Invalid token" });
    if (invite.status !== "pending") return res.status(400).json({ success: false, msg: "Invite already used" });
    if (invite.expiresAt < new Date()) return res.status(400).json({ success: false, msg: "Invite expired" });
    const reviewer = await User.create({
      name,
      email: invite.email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "reviewer",
      status: "pending",
      specialization: specialization || "",
      organization: organization || "",
      experienceYears: Number(experienceYears || 0),
      linkedin: linkedin || "",
      phone: phone || "",
    });
    invite.status = "accepted";
    invite.acceptedAt = new Date();
    await invite.save();
    await createNotification(invite.invitedByAdminId, "REVIEWER_APPLICATION", `New reviewer application: ${reviewer.name}`, { reviewerId: reviewer._id });
    return res.json({ success: true, msg: "Reviewer registered. Waiting admin approval.", reviewer: buildUserResponse(reviewer) });
  } catch (e) {
    console.error("reviewer register error", e);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});
// Admin approves/rejects reviewer
app.get("/admin/reviewers/pending", requireAuth, requireRole("admin"), async (req, res) => {
  const reviewers = await User.find({ role: "reviewer", status: "pending" }).sort({ createdAt: -1 });
  return res.json({ success: true, reviewers: reviewers.map(buildUserResponse) });
});
app.patch("/admin/reviewers/:id/status", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'rejected', 'blocked'].includes(status)) return res.status(400).json({ success: false, msg: 'Invalid status' });
    const reviewer = await User.findOne({ _id: req.params.id, role: 'reviewer' });
    if (!reviewer) return res.status(404).json({ success: false, msg: 'Reviewer not found' });
    reviewer.status = status;
    await reviewer.save();
    await createNotification(reviewer._id, 'ACCOUNT_STATUS', `Your reviewer account status is now: ${status}`, { status });
    return res.json({ success: true, msg: 'Reviewer updated', reviewer: buildUserResponse(reviewer) });
  } catch (e) {
    console.error('update reviewer status error', e);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// Admin gets approves/rejects funders
app.get('/admin/funders/pending', requireAuth, requireRole('admin'), async (req, res) => {
  const funders = await User.find({ role: 'funder', status: 'pending' }).sort({ createdAt: -1 });
  return res.json({ success: true, funders: funders.map(buildUserResponse) });
});

app.get('/admin/funders/active', requireAuth, requireRole('admin'), async (req, res) => {
  const funders = await User.find({ role: 'funder', status: 'active' }).sort({ name: 1 });
  return res.json({ success: true, funders: funders.map(buildUserResponse) });
});

app.patch('/admin/funders/:id/status', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'rejected', 'blocked'].includes(status)) return res.status(400).json({ success: false, msg: 'Invalid status' });
    const funder = await User.findOne({ _id: req.params.id, role: 'funder' });
    if (!funder) return res.status(404).json({ success: false, msg: 'Funder not found' });
    funder.status = status;
    await funder.save();
    await createNotification(funder._id, 'ACCOUNT_STATUS', `Your funder account status is now: ${status}`, { status });
    return res.json({ success: true, msg: 'Funder updated', funder: buildUserResponse(funder) });
  } catch (e) {
    console.error('update funder status error', e);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// Admin lists users with optional role/status filters
app.get('/admin/users', requireAuth, requireRole('admin'), async (req, res) => {
  const { role, status } = req.query;
  const filter = {};
  if (role && role !== 'all') filter.role = role;
  if (status && status !== 'all') filter.status = status;
  const users = await User.find(filter).sort({ createdAt: -1 });
  return res.json({ success: true, users: users.map(buildUserResponse) });
});


//IDEA 
// Innovator submits new idea 
app.post('/ideas', requireAuth, requireRole('innovator'), upload.single('ipForm'), async (req, res) => {
  try {
    const { title, description } = req.body;
    if (isBlank(title) || isBlank(description)) return res.status(400).json({ success: false, msg: 'title and description are required' });
    if (!req.file) return res.status(400).json({ success: false, msg: 'IP form file is required' });
    const idea = await Idea.create({
      innovatorId: req.auth.id,
      title,
      description,
      ipFormUrl: req.file ? `/uploads/${req.file.filename}` : '',
      status: 'submitted',
    });
    await notifyAllAdmins('IDEA_SUBMITTED', `A new idea was submitted: ${idea.title}`, { ideaId: idea._id });
    await logActivity(req, 'IDEA_SUBMITTED', 'idea', idea._id, `Idea submitted: ${idea.title}`);
    await createActivity({ type: 'IDEA_SUBMITTED', title: 'New idea submitted', message: `${idea.title} was submitted for admin review.`, actorId: req.auth.id, actorName: 'Innovator', actorRole: req.auth.role, targetId: idea._id, targetModel: 'Idea', audienceRoles: ['admin'], audienceUsers: [idea.innovatorId], meta: { ideaId: idea._id } });
    await emitIdeaUpdate(idea._id);
    return res.status(201).json({ success: true, idea: buildIdeaResponse(idea) });
  } catch (e) {
    console.error('create idea error', e);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// Innovator gets only their own ideas
app.get('/ideas/my', requireAuth, requireRole('innovator'), async (req, res) => {
  const ideas = await Idea.find({ innovatorId: req.auth.id }).sort({ createdAt: -1 }).populate('evaluationIds').populate('assignedReviewerIds', 'name email specialization')
      .populate('selectedFunderIds', 'name email organization')
      .populate('funderDecisions.funderId', 'name email organization');
  return res.json({ success: true, ideas: ideas.map(buildIdeaResponse) });
});


// Get ideas , search, and status filter
app.get('/ideas', requireAuth, async (req, res) => {
  try {
    const q = req.query.q?.trim();
    const status = req.query.status?.trim();
    const reviewerObjectId = getAuthObjectId(req.auth.id);

    const baseFilter = {};
    if (q) {
      baseFilter.$or = [{ title: new RegExp(q, 'i') }, { description: new RegExp(q, 'i') }];
    }

    if (req.auth.role === 'funder') {
      const approvedFunder = await User.findOne({ _id: req.auth.id, role: 'funder', status: 'active' });
      if (!approvedFunder) return res.status(403).json({ success: false, msg: 'Only approved funders can view ideas.' });
      baseFilter.selectedFunderIds = reviewerObjectId;
      baseFilter.status = { $in: ['presented_to_funders', 'funding_pending', 'contract_drafted', 'contract_signed', 'in_progress', 'resolved'] };
    } else if (status && status !== 'all') {
      baseFilter.status = status;
    }

    if (req.auth.role === 'innovator') {
      baseFilter.innovatorId = req.auth.id;
    } else if (req.auth.role === 'reviewer') {
      baseFilter.assignedReviewerIds = reviewerObjectId;
      if (status && status !== 'all') {
        baseFilter.status = status;
      }
    }

    const ideas = await Idea.find(baseFilter)
      .sort({ updatedAt: -1, createdAt: -1 })
      .populate('innovatorId', 'name email phone imageUrl')
      .populate({ path: 'evaluationIds', populate: { path: 'reviewerId', select: 'name email' } })
      .populate('assignedReviewerIds', 'name email specialization')
      .populate('selectedFunderIds', 'name email organization')
      .populate('funderDecisions.funderId', 'name email organization')
      .populate('contractId')
    .populate('selectedFunderIds', 'name email organization')
      .populate('funderDecisions.funderId', 'name email organization');

    return res.json({ success: true, ideas: ideas.map(buildIdeaResponse) });
  } catch (e) {
    console.error('get ideas error', e);
    return res.status(500).json({ success: false, msg: 'Server error fetching ideas' });
  }
});

// Get one idea with  details
app.get('/ideas/:id', requireAuth, async (req, res) => {
  const idea = await Idea.findById(req.params.id)
    .populate('innovatorId', 'name email phone imageUrl')
    .populate({ path: 'evaluationIds', populate: { path: 'reviewerId', select: 'name email' } })
    .populate('assignedReviewerIds', 'name email specialization')
      .populate('selectedFunderIds', 'name email organization')
    .populate('funderDecisions.funderId', 'name email organization')
    .populate('contractId')
    .populate('selectedFunderIds', 'name email organization')
      .populate('funderDecisions.funderId', 'name email organization');
  if (!idea) return res.status(404).json({ success: false, msg: 'Idea not found' });
  return res.json({ success: true, idea: buildIdeaResponse(idea) });
});

// Innovator resubmits idea 
app.patch('/ideas/:id/resubmit', requireAuth, requireRole('innovator'), upload.single('ipForm'), async (req, res) => {
  try {
    const idea = await Idea.findOne({ _id: req.params.id, innovatorId: req.auth.id });
    if (!idea) return res.status(404).json({ success: false, msg: 'Idea not found' });
    if (!['admin_changes_requested', 'reviewer_changes_requested', 'rejected'].includes(idea.status)) {
      return res.status(400).json({ success: false, msg: 'This idea is not waiting for changes' });
    }
    if (typeof req.body.title !== 'undefined') idea.title = req.body.title;
    if (typeof req.body.description !== 'undefined') idea.description = req.body.description;
    if (req.file) idea.ipFormUrl = `/uploads/${req.file.filename}`;
    idea.status = 'submitted';
    await idea.save();
    await notifyAllAdmins('IDEA_RESUBMITTED', `Idea resubmitted by innovator: ${idea.title}`, { ideaId: idea._id });
    await createActivity({ type: 'IDEA_RESUBMITTED', title: 'Idea resubmitted', message: `${idea.title} was updated and sent back for review.`, actorId: req.auth.id, actorName: 'Innovator', actorRole: req.auth.role, targetId: idea._id, targetModel: 'Idea', audienceRoles: ['admin'], audienceUsers: [idea.innovatorId], meta: { ideaId: idea._id } });
    const populated = await Idea.findById(idea._id).populate('innovatorId', 'name email phone imageUrl').populate({ path: 'evaluationIds', populate: { path: 'reviewerId', select: 'name email' } }).populate('assignedReviewerIds', 'name email specialization')
      .populate('selectedFunderIds', 'name email organization')
      .populate('funderDecisions.funderId', 'name email organization');
    await emitIdeaUpdate(idea._id);
    return res.json({ success: true, idea: buildIdeaResponse(populated), contract });
  } catch (e) {
    console.error('idea resubmit error', e);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// Admin reviews idea adds comment + changes status
app.patch('/ideas/:id/admin-review', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { comment, status, sendBackToInnovator } = req.body;
    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ success: false, msg: 'Idea not found' });

    const trimmedComment = (comment || '').trim();
    if ((sendBackToInnovator || ['admin_changes_requested', 'rejected'].includes(status)) && !trimmedComment) {
      return res.status(400).json({ success: false, msg: 'Comment is required before requesting changes or rejecting an idea' });
    }
    if (trimmedComment) {
      idea.adminComments.push({ adminId: req.auth.id, comment: trimmedComment });
    }

    const allowed = [
      'submitted',
      'admin_changes_requested',
      'with_reviewer',
      'reviewer_changes_requested',
      'rejected',
      'under_review',
    ];

    if (sendBackToInnovator || (trimmedComment && status === 'admin_changes_requested')) {
      idea.status = 'admin_changes_requested';
    } else if (status) {
      if (!allowed.includes(status)) {
        return res.status(400).json({ success: false, msg: 'Invalid admin status. Admin cannot skip the reviewer/funder workflow.' });
      }
      idea.status = status;
    } else if (trimmedComment) {
      idea.status = 'admin_changes_requested';
    }

    await idea.save();
    await logActivity(req, 'ADMIN_REVIEW', 'idea', idea._id, `Admin set idea status to ${idea.status}`, { status: idea.status });
    await createActivity({ type: 'ADMIN_REVIEW', title: 'Admin reviewed an idea', message: `${idea.title} status is now ${idea.status}.`, actorId: req.auth.id, actorName: 'Admin', actorRole: req.auth.role, targetId: idea._id, targetModel: 'Idea', audienceRoles: ['admin'], audienceUsers: [idea.innovatorId, ...(idea.assignedReviewerIds || [])], meta: { ideaId: idea._id, status: idea.status } });

    if (idea.status === 'admin_changes_requested') {
      await createNotification(idea.innovatorId, 'IDEA_CHANGES_REQUESTED', `Admin asked for updates on your idea: ${idea.title}`, { ideaId: idea._id, status: idea.status });
    } else {
      await createNotification(idea.innovatorId, 'IDEA_STATUS', `Your idea "${idea.title}" is now ${idea.status}`, { ideaId: idea._id, status: idea.status });
    }

    const populated = await Idea.findById(idea._id).populate('innovatorId', 'name email phone imageUrl').populate({ path: 'evaluationIds', populate: { path: 'reviewerId', select: 'name email' } }).populate('assignedReviewerIds', 'name email specialization')
      .populate('selectedFunderIds', 'name email organization')
      .populate('funderDecisions.funderId', 'name email organization');
    await emitIdeaUpdate(idea._id);
    return res.json({ success: true, idea: buildIdeaResponse(populated) });
  } catch (e) {
    console.error('admin review error', e);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// Admin assigns reviewirs to idea
app.patch('/ideas/:id/assign-reviewers', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const rawReviewerIds = Array.isArray(req.body?.reviewerIds) ? req.body.reviewerIds : [];
    const reviewerIds = [...new Set(rawReviewerIds.filter(Boolean))];

    if (reviewerIds.length === 0) {
      return res.status(400).json({ success: false, msg: 'reviewerIds array is required' });
    }

    const validReviewers = await User.find({
      _id: { $in: reviewerIds.map(getAuthObjectId) },
      role: 'reviewer',
      status: 'active',
    });

    if (validReviewers.length === 0) {
      return res.status(400).json({ success: false, msg: 'No active reviewers were found for the selected IDs' });
    }

    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ success: false, msg: 'Idea not found' });

    idea.assignedReviewerIds = validReviewers.map((r) => r._id);
    idea.status = 'with_reviewer';
    await idea.save();
    await createActivity({ type: 'REVIEWER_ASSIGNED', title: 'Reviewers assigned', message: `${validReviewers.length} reviewer(s) assigned to ${idea.title}.`, actorId: req.auth.id, actorName: 'Admin', actorRole: req.auth.role, targetId: idea._id, targetModel: 'Idea', audienceRoles: ['admin'], audienceUsers: [idea.innovatorId, ...validReviewers.map((r) => r._id)], meta: { ideaId: idea._id, reviewerCount: validReviewers.length } });

    for (const r of validReviewers) {
      await createNotification(r._id, 'IDEA_ASSIGNED', `A new idea was assigned to you: ${idea.title}`, { ideaId: idea._id });
    }

    const populated = await Idea.findById(idea._id)
      .populate('innovatorId', 'name email phone imageUrl')
      .populate({ path: 'evaluationIds', populate: { path: 'reviewerId', select: 'name email' } })
      .populate('assignedReviewerIds', 'name email specialization')
      .populate('selectedFunderIds', 'name email organization')
      .populate('funderDecisions.funderId', 'name email organization');

    await emitIdeaUpdate(idea._id);
    return res.json({ success: true, idea: buildIdeaResponse(populated) });
  } catch (e) {
    console.error('assign reviewers error', e);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// Admin presents approved idea to selected funders
app.patch('/ideas/:id/present', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const rawFunderIds = Array.isArray(req.body?.funderIds) ? req.body.funderIds.filter(Boolean) : [];
    const idea = await Idea.findById(req.params.id).populate('innovatorId', 'name email phone imageUrl');
    if (!idea) return res.status(404).json({ success: false, msg: 'Idea not found' });

    if (!rawFunderIds.length) return res.status(400).json({ success: false, msg: 'Select at least one approved active funder. Do not send to all funders.' });
    const funderFilter = { role: 'funder', status: 'active', _id: { $in: rawFunderIds.map(getAuthObjectId) } };
    const funders = await User.find(funderFilter, '_id name email organization');
    if (!funders.length) return res.status(400).json({ success: false, msg: 'No approved funders were found for the selected IDs' });

    // CAT A workflow guard:
    // The admin must send the idea to a reviewer first, and the reviewer must approve it
    // before the idea can be presented to any funder.
    if (idea.status !== 'reviewer_approved') {
      return res.status(400).json({
        success: false,
        msg: 'This idea must be reviewed and approved by a reviewer before it can be presented to funders.',
      });
    }

    const approvedEvaluationExists = await Evaluation.exists({
      ideaId: idea._id,
      decision: 'accepted',
    });

    if (!approvedEvaluationExists) {
      return res.status(400).json({
        success: false,
        msg: 'Reviewer approval record is required before presenting this idea to funders.',
      });
    }

    idea.selectedFunderIds = funders.map((f) => f._id);
    idea.funderDecisions = funders.map((f) => ({ funderId: f._id, decision: 'pending', comment: '' }));
    idea.status = 'presented_to_funders';
    await idea.save();

    await logActivity(req, 'PRESENT_TO_FUNDERS', 'idea', idea._id, `Presented idea to ${funders.length} approved funder(s)`, { funderIds: funders.map(f => f._id) });
    await createActivity({ type: 'IDEA_PRESENTED', title: 'Idea presented to funders', message: `${idea.title} is now available for funder decision.`, actorId: req.auth.id, actorName: 'Admin', actorRole: req.auth.role, targetId: idea._id, targetModel: 'Idea', audienceRoles: ['admin'], audienceUsers: [idea.innovatorId, ...(idea.selectedFunderIds || [])], meta: { ideaId: idea._id } });
    await Promise.all(funders.map((f) => createNotification(f._id, 'IDEA_PRESENTED', `SparkUp Manager presented a new idea for your funding review: ${idea.title}`, { ideaId: idea._id })));
    await createNotification(idea.innovatorId, 'IDEA_PRESENTED_TO_FUNDERS', `Your idea was presented to selected funders: ${idea.title}`, { ideaId: idea._id });

    const populated = await Idea.findById(idea._id)
      .populate('innovatorId', 'name email phone imageUrl')
      .populate({ path: 'evaluationIds', populate: { path: 'reviewerId', select: 'name email' } })
      .populate('assignedReviewerIds', 'name email specialization')
      .populate('selectedFunderIds', 'name email organization')
      .populate('funderDecisions.funderId', 'name email organization');
    await emitIdeaUpdate(idea._id);
    return res.json({ success: true, idea: buildIdeaResponse(populated) });
  } catch (e) {
    console.error('present idea error', e);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
});



//REVIEWER 
// Reviewer gets assigned ideas
app.get('/reviewer/ideas', requireAuth, requireRole('reviewer'), async (req, res) => {
  try {
    const reviewerObjectId = getAuthObjectId(req.auth.id);
    // If an idea has a reviewer assigned, the reviewer must be able to manage it
    // even if the old saved status is still "submitted" from a previous version.
    await Idea.updateMany(
      { assignedReviewerIds: reviewerObjectId, status: { $in: ['submitted', 'under_review'] } },
      { $set: { status: 'with_reviewer' } }
    );

    const ideas = await Idea.find({
      assignedReviewerIds: reviewerObjectId,
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .populate('innovatorId', 'name email phone imageUrl')
      .populate({ path: 'evaluationIds', populate: { path: 'reviewerId', select: 'name email' } })
      .populate('assignedReviewerIds', 'name email specialization')
      .populate('selectedFunderIds', 'name email organization')
      .populate('funderDecisions.funderId', 'name email organization');

    return res.json({ success: true, ideas: ideas.map(buildIdeaResponse) });
  } catch (e) {
    console.error('reviewer ideas error', e);
    return res.status(500).json({ success: false, msg: 'Server error fetching reviewer ideas' });
  }
});

// Reviewer submits/updates evaluation for assigned idea
app.post('/reviewer/ideas/:id/evaluation', requireAuth, requireRole('reviewer'), async (req, res) => {
  try {
    const { score, comments, decision } = req.body;
    if (typeof score === 'undefined') return res.status(400).json({ success: false, msg: 'score is required' });

    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ success: false, msg: 'Idea not found' });

    const assigned = idea.assignedReviewerIds.some((id) => String(id) === String(req.auth.id));
    if (!assigned) return res.status(403).json({ success: false, msg: 'Idea not assigned to you' });

    // Assigned reviewers are allowed to review immediately.
    // This also repairs older records where admin assigned a reviewer but the status stayed submitted.
    if (['submitted', 'under_review'].includes(idea.status)) {
      idea.status = 'with_reviewer';
    }

    const normalizedDecision =
      decision === 'changes_requested'
        ? 'changes_requested'
        : decision === 'rejected'
        ? 'rejected'
        : 'accepted';
    if (['changes_requested', 'rejected'].includes(normalizedDecision) && isBlank(comments)) {
      return res.status(400).json({ success: false, msg: 'Reviewer comment is required before requesting changes or rejecting' });
    }

    let evaluation = await Evaluation.findOne({ ideaId: idea._id, reviewerId: req.auth.id });
    if (evaluation) {
      evaluation.score = Number(score);
      evaluation.decision = normalizedDecision;
      evaluation.comments = comments || '';
      await evaluation.save();
    } else {
      evaluation = await Evaluation.create({
        ideaId: idea._id,
        reviewerId: req.auth.id,
        score: Number(score),
        decision: normalizedDecision,
        comments: comments || '',
      });
      if (!idea.evaluationIds.some((id) => String(id) === String(evaluation._id))) {
        idea.evaluationIds.push(evaluation._id);
      }
    }

    await logActivity(req, 'REVIEWER_EVALUATION', 'idea', idea._id, `Reviewer decision: ${normalizedDecision}`, { decision: normalizedDecision, score });
    await createActivity({ type: 'REVIEWER_EVALUATION', title: 'Reviewer submitted evaluation', message: `${idea.title} decision: ${normalizedDecision}.`, actorId: req.auth.id, actorName: 'Reviewer', actorRole: req.auth.role, targetId: idea._id, targetModel: 'Idea', audienceRoles: ['admin'], audienceUsers: [idea.innovatorId, ...(idea.assignedReviewerIds || [])], meta: { ideaId: idea._id, decision: normalizedDecision } });

    if (normalizedDecision === 'changes_requested') {
      idea.status = 'reviewer_changes_requested';
    } else if (normalizedDecision === 'rejected') {
      idea.status = 'rejected';
    } else {
      idea.status = 'reviewer_approved';
    }

    await idea.save();

    await notifyAllAdmins(
      normalizedDecision === 'changes_requested'
        ? 'REVIEWER_CHANGES_REQUESTED'
        : normalizedDecision === 'rejected'
        ? 'REVIEWER_REJECTED'
        : 'REVIEWER_ACCEPTED',
      normalizedDecision === 'changes_requested'
        ? `Reviewer requested changes for idea: ${idea.title}`
        : normalizedDecision === 'rejected'
        ? `Reviewer rejected idea: ${idea.title}`
        : `Reviewer accepted idea: ${idea.title}`,
      { ideaId: idea._id, reviewerId: req.auth.id, decision: normalizedDecision }
    );

    await createNotification(
      idea.innovatorId,
      normalizedDecision === 'changes_requested'
        ? 'REVIEWER_CHANGES_REQUESTED'
        : normalizedDecision === 'rejected'
        ? 'IDEA_REJECTED'
        : 'REVIEWER_APPROVED',
      normalizedDecision === 'changes_requested'
        ? `Reviewer requested changes for your idea: ${idea.title}`
        : normalizedDecision === 'rejected'
        ? `Your idea was rejected by the reviewer: ${idea.title}`
        : `Your idea was approved by the reviewer: ${idea.title}`,
      { ideaId: idea._id, reviewerId: req.auth.id, decision: normalizedDecision }
    );

    const populated = await Idea.findById(idea._id)
      .populate('innovatorId', 'name email phone imageUrl')
      .populate({ path: 'evaluationIds', populate: { path: 'reviewerId', select: 'name email' } })
      .populate('assignedReviewerIds', 'name email specialization')
      .populate('selectedFunderIds', 'name email organization')
      .populate('funderDecisions.funderId', 'name email organization');

    await emitIdeaUpdate(idea._id);
    return res.json({ success: true, idea: buildIdeaResponse(populated), evaluation });
  } catch (e) {
    console.error('submit evaluation error', e);
    return res.status(500).json({
      success: false,
      msg: e.code === 11000 ? 'You already reviewed this idea' : 'Server error',
    });
  }
});


//FUNDER ROUTES
// Funder sees ideas available for funding workflow
app.get('/funder/ideas', requireAuth, requireRole('funder'), requireApprovedFunderAccount, async (req, res) => {
  const ideas = await Idea.find({ selectedFunderIds: getAuthObjectId(req.auth.id), status: { $in: ['presented_to_funders', 'funding_pending', 'contract_drafted', 'contract_signed', 'in_progress', 'resolved'] } })
    .sort({ createdAt: -1 })
    .populate('innovatorId', 'name email phone imageUrl')
    .populate({ path: 'evaluationIds', populate: { path: 'reviewerId', select: 'name email' } })
    .populate('assignedReviewerIds', 'name email specialization')
      .populate('selectedFunderIds', 'name email organization')
    .populate('funderDecisions.funderId', 'name email organization')
    .populate('contractId')
    .populate('selectedFunderIds', 'name email organization')
      .populate('funderDecisions.funderId', 'name email organization');
  return res.json({ success: true, ideas: ideas.map(buildIdeaResponse) });
});


// Funder accepts/rejects idea and records decision report
app.patch('/funder/ideas/:id/decision', requireAuth, requireRole('funder'), requireApprovedFunderAccount, async (req, res) => {
  try {
    const { decision, comment } = req.body;
    if (!['accepted', 'rejected'].includes(decision)) return res.status(400).json({ success: false, msg: 'Decision must be accepted or rejected' });
    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ success: false, msg: 'Idea not found' });
    const selected = (idea.selectedFunderIds || []).some((id) => String(id) === String(req.auth.id));
    if (!selected) return res.status(403).json({ success: false, msg: 'This idea was not presented to your account' });

    const existing = (idea.funderDecisions || []).find((d) => String(d.funderId) === String(req.auth.id));
    if (existing) {
      existing.decision = decision;
      existing.comment = comment || '';
      existing.createdAt = new Date();
    } else {
      idea.funderDecisions.push({ funderId: req.auth.id, decision, comment: comment || '' });
    }
    idea.lastUpdatedByFunderId = req.auth.id;
    if (decision === 'accepted') {
      idea.status = 'funding_pending';
      idea.messages.push({
        senderId: req.auth.id,
        senderRole: 'funder',
        message: comment?.trim()
          ? `Funding accepted. Initial note: ${comment.trim()}`
          : 'Funding accepted. Please use this room to discuss budget, conditions, documents, deadlines, and milestones.',
      });
    } else {
      const stillAccepted = (idea.funderDecisions || []).some((d) => d.decision === 'accepted');
      idea.status = stillAccepted ? 'funding_pending' : 'presented_to_funders';
    }
    await idea.save();

    await notifyAllAdmins('FUNDER_DECISION', `A funder ${decision} idea: ${idea.title}`, { ideaId: idea._id, funderId: req.auth.id, decision });
    await createNotification(idea.innovatorId, 'FUNDER_DECISION', `A funder ${decision} your idea: ${idea.title}`, { ideaId: idea._id, decision });

    const populated = await Idea.findById(idea._id)
      .populate('innovatorId', 'name email phone imageUrl')
      .populate({ path: 'evaluationIds', populate: { path: 'reviewerId', select: 'name email' } })
      .populate('assignedReviewerIds', 'name email specialization')
      .populate('selectedFunderIds', 'name email organization')
      .populate('funderDecisions.funderId', 'name email organization')
      .populate('contractId');
    await emitIdeaUpdate(idea._id);
    return res.json({ success: true, idea: buildIdeaResponse(populated) });
  } catch (e) {
    console.error('funder decision error', e);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// Get funding communication thread. Innovator, selected funder, admin, and assigned reviewer can read it.
// The room opens only after at least one funder accepts the idea.
app.get('/ideas/:id/messages', requireAuth, requireRole('admin', 'funder', 'innovator', 'reviewer'), async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id)
      .populate('innovatorId', 'name email phone imageUrl')
      .populate({ path: 'evaluationIds', populate: { path: 'reviewerId', select: 'name email' } })
      .populate('assignedReviewerIds', 'name email specialization')
      .populate('selectedFunderIds', 'name email organization')
      .populate('funderDecisions.funderId', 'name email organization')
      .populate('contractId');
    if (!idea) return res.status(404).json({ success: false, msg: 'Idea not found' });

    const fundingChatStatuses = ['funding_pending', 'contract_drafted', 'contract_signed', 'in_progress', 'resolved'];
    if (!fundingChatStatuses.includes(idea.status)) {
      return res.status(400).json({ success: false, msg: 'Funding communication opens only after a funder accepts the idea.' });
    }

    const isOwner = String(idea.innovatorId?._id || idea.innovatorId) === String(req.auth.id);
    const isAssignedReviewer = (idea.assignedReviewerIds || []).some((id) => String(id?._id || id) === String(req.auth.id));
    const isSelectedFunder = (idea.selectedFunderIds || []).some((id) => String(id?._id || id) === String(req.auth.id));
    if (req.auth.role !== 'admin' && !isOwner && !isAssignedReviewer && !isSelectedFunder) {
      return res.status(403).json({ success: false, msg: 'Only the idea innovator, selected funder, assigned reviewer, or admin can open this room.' });
    }

    return res.json({
      success: true,
      messages: idea.messages || [],
      fundingAgreement: idea.fundingAgreement || {},
      idea: buildIdeaResponse(idea),
    });
  } catch (e) {
    console.error('get idea messages error', e);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// Admin records the agreement details after funder acceptance
app.patch('/ideas/:id/funding-agreement', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ success: false, msg: 'Idea not found' });
    if (!['funding_pending', 'contract_drafted', 'contract_signed', 'in_progress', 'resolved'].includes(idea.status)) {
      return res.status(400).json({ success: false, msg: 'Funding agreement can be edited only after a funder accepts the idea' });
    }
    const milestones = Array.isArray(req.body.milestones)
      ? req.body.milestones.filter(Boolean)
      : String(req.body.milestones || '').split('\\n').map((m) => m.trim()).filter(Boolean);
    idea.fundingAgreement = {
      finalBudget: Number(req.body.finalBudget || 0),
      deadline: req.body.deadline || null,
      conditions: req.body.conditions || '',
      requiredDocuments: req.body.requiredDocuments || '',
      milestones,
      lastUpdatedBy: req.auth.id,
      updatedAt: new Date(),
    };

    // IMPORTANT FLOW FIX:
    // When the admin saves Agreement Details from the communication room,
    // create/update the Contract automatically so it appears in Funding & Contracts.
    const acceptedDecision = (idea.funderDecisions || []).find((d) => d.decision === 'accepted');
    const contractFunderId = acceptedDecision?.funderId || idea.selectedFunderIds?.[0];

    if (!contractFunderId) {
      return res.status(400).json({
        success: false,
        msg: 'Cannot create contract because no accepted/selected funder was found for this idea',
      });
    }

    let contract = null;
    if (idea.contractId) {
      contract = await Contract.findById(idea.contractId);
    }

    const contractPayload = {
      ideaId: idea._id,
      funderId: contractFunderId,
      issuedByAdminId: req.auth.id,
      finalBudget: Number(req.body.finalBudget || 0),
      deadline: req.body.deadline || null,
      conditions: req.body.conditions || '',
      milestones,
      status: contract?.status || 'Drafted',
    };

    if (contract) {
      Object.assign(contract, contractPayload);
      await contract.save();
    } else {
      contract = await Contract.create(contractPayload);
      idea.contractId = contract._id;
    }

    if (idea.status === 'funding_pending') idea.status = 'contract_drafted';
    idea.messages.push({ senderId: req.auth.id, senderRole: req.auth.role, message: 'Funding agreement details were saved and the contract draft was created.' });
    await idea.save();
    await logActivity(req, 'CONTRACT_AUTO_CREATED', 'contract', contract._id, `Contract draft created from agreement details for idea ${idea.title}`, { ideaId: idea._id, funderId: contractFunderId });
    await createNotification(idea.innovatorId, 'FUNDING_AGREEMENT', `Funding agreement details were updated for: ${idea.title}`, { ideaId: idea._id });
    await emitIdeaUpdate(idea._id);
    const populated = await Idea.findById(idea._id)
      .populate('innovatorId', 'name email phone imageUrl')
      .populate({ path: 'evaluationIds', populate: { path: 'reviewerId', select: 'name email' } })
      .populate('assignedReviewerIds', 'name email specialization')
      .populate('selectedFunderIds', 'name email organization')
      .populate('funderDecisions.funderId', 'name email organization')
      .populate('contractId');
    return res.json({ success: true, idea: buildIdeaResponse(populated), contract });
  } catch (e) {
    console.error('funding agreement error', e);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// Role-based funding communication thread for one idea
// After funder acceptance, BOTH innovator and funder can send messages.
// Admin can also send/monitor for transparency. Reviewers are read-only for funding chat.
app.post('/ideas/:id/messages', requireAuth, requireRole('admin', 'funder', 'innovator'), async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, msg: 'message is required' });
    }

    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ success: false, msg: 'Idea not found' });

    const fundingChatStatuses = ['funding_pending', 'contract_drafted', 'contract_signed', 'in_progress', 'resolved'];
    if (!fundingChatStatuses.includes(idea.status)) {
      return res.status(400).json({
        success: false,
        msg: 'Funding discussion opens only after a funder accepts the idea.',
      });
    }

    const isOwnerInnovator = String(idea.innovatorId?._id || idea.innovatorId) === String(req.auth.id);
    const isSelectedFunder = (idea.selectedFunderIds || []).some((id) => String(id?._id || id) === String(req.auth.id));
    const canSend = req.auth.role === 'admin' || isOwnerInnovator || isSelectedFunder;

    if (!canSend) {
      return res.status(403).json({
        success: false,
        msg: 'Only the idea innovator, selected funders, or admin can send funding messages.',
      });
    }

    idea.messages.push({
      senderId: req.auth.id,
      senderRole: req.auth.role,
      message: message.trim(),
      createdAt: new Date(),
    });

    await idea.save();

    const notifyTargets = [String(idea.innovatorId), ...(idea.selectedFunderIds || []).map(String)];
    for (const target of [...new Set(notifyTargets)]) {
      if (target !== String(req.auth.id)) {
        await createNotification(target, 'IDEA_MESSAGE', `New funding discussion message for: ${idea.title}`, { ideaId: idea._id });
      }
    }

    if (req.auth.role !== 'admin') {
      await notifyAllAdmins('IDEA_MESSAGE', `New funding discussion message for: ${idea.title}`, { ideaId: idea._id });
    }

    await emitIdeaUpdate(idea._id);
    const populated = await Idea.findById(idea._id)
      .populate('innovatorId', 'name email phone imageUrl')
      .populate({ path: 'evaluationIds', populate: { path: 'reviewerId', select: 'name email' } })
      .populate('assignedReviewerIds', 'name email specialization')
      .populate('selectedFunderIds', 'name email organization')
      .populate('funderDecisions.funderId', 'name email organization')
      .populate('contractId');
    return res.json({ success: true, messages: populated.messages, idea: buildIdeaResponse(populated) });
  } catch (e) {
    console.error('message idea error', e);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// Funder updates funding status 
app.patch('/funder/ideas/:id/status', requireAuth, requireRole('funder'), requireApprovedFunderAccount, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['funding_pending', 'contract_drafted', 'contract_signed', 'in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, msg: 'Invalid funder status' });
    }
    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ success: false, msg: 'Idea not found' });
    const isSelectedFunder = (idea.selectedFunderIds || []).some((id) => String(id?._id || id) === String(req.auth.id));
    if (!isSelectedFunder) return res.status(403).json({ success: false, msg: 'This idea was not presented to your account' });
    const acceptedByThisFunder = (idea.funderDecisions || []).some((d) => String(d.funderId?._id || d.funderId) === String(req.auth.id) && d.decision === 'accepted');
    if (!acceptedByThisFunder && idea.status === 'presented_to_funders') {
      return res.status(400).json({ success: false, msg: 'Accept the idea first before updating funding status or opening communication.' });
    }
    idea.status = status;
    idea.lastUpdatedByFunderId = req.auth.id;
    await idea.save();
    await createNotification(idea.innovatorId, 'FUNDING_STATUS', `Funding status updated for \"${idea.title}\": ${status}`, { ideaId: idea._id, status });
    await createActivity({ type: 'FUNDING_STATUS', title: 'Funding status updated', message: `${idea.title} funding status changed to ${status}.`, actorId: req.auth.id, actorName: 'Funder', actorRole: req.auth.role, targetId: idea._id, targetModel: 'Idea', audienceRoles: ['admin'], audienceUsers: [idea.innovatorId, ...(idea.selectedFunderIds || []), req.auth.id], meta: { ideaId: idea._id, status } });
    if (status === 'resolved') {
      const exists = await Certificate.findOne({ userId: idea.innovatorId, ideaId: idea._id, type: 'IDEA_COMPLETION' });
      if (!exists) await Certificate.create({ userId: idea.innovatorId, ideaId: idea._id, type: 'IDEA_COMPLETION' });
    }
    const populated = await Idea.findById(idea._id).populate('innovatorId', 'name email phone imageUrl').populate({ path: 'evaluationIds', populate: { path: 'reviewerId', select: 'name email' } }).populate('assignedReviewerIds', 'name email specialization')
      .populate('selectedFunderIds', 'name email organization').populate('contractId')
    .populate('selectedFunderIds', 'name email organization')
      .populate('funderDecisions.funderId', 'name email organization');
    await emitIdeaUpdate(idea._id);
    return res.json({ success: true, idea: buildIdeaResponse(populated) });
  } catch (e) {
    console.error('funder update status error', e);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
});


//EVENT 
// Admin creates event
app.post('/events', requireAuth, requireRole('admin'), upload.single('image'), async (req, res) => {
  try {
    const { title, description, startDate, endDate, location, capacity, organizationName } = req.body;
    if (isBlank(title) || !startDate || !endDate) return res.status(400).json({ success: false, msg: 'title, startDate, endDate are required' });
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return res.status(400).json({ success: false, msg: 'Invalid event dates' });
    if (start < new Date()) return res.status(400).json({ success: false, msg: 'Event start date cannot be in the past' });
    if (end <= start) return res.status(400).json({ success: false, msg: 'Event end date must be after start date' });
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
    const event = await Event.create({ title, description, startDate: start, endDate: end, location, organizationName: organizationName?.trim() || 'SparkUp', imageUrl, capacity: Number(capacity || 0), qrCheckInToken: crypto.randomBytes(24).toString('hex'), qrCheckOutToken: crypto.randomBytes(24).toString('hex'), status: 'active', createdByAdminId: req.auth.id });
    const users = await User.find({ role: { $in: ['innovator', 'funder', 'reviewer'] }, status: 'active' }, '_id');
    await Promise.all(users.map((u) => createNotification(u._id, 'NEW_EVENT', `New SparkUp event: ${event.title}`, { eventId: event._id })));
    await createActivity({ type: 'EVENT_CREATED', title: 'New event posted', message: `${event.title} was added to the events page.`, actorId: req.auth.id, actorName: 'Admin', actorRole: req.auth.role, targetId: event._id, targetModel: 'Event', audienceRoles: ['admin'], meta: { eventId: event._id } });
    return res.status(201).json({ success: true, event: buildEventResponse(event) });
  } catch (e) {
    console.error('create event error', e);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// list/filter/sort events
app.get('/events', async (req, res) => {
  try {
    await moveFinishedEventsToDraft();
    const { q = '', year = 'all', month = 'all', sort = 'date_asc', showPast = 'false' } = req.query;
    const filter = {};
    let requesterRole = 'guest';
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        requesterRole = decoded?.role || 'guest';
        if (requesterRole !== 'admin') filter.status = 'active';
      } catch {}
    } else {
      filter.status = 'active';
    }
    // Admin can see finished/draft/archived events for attendance, certificates, reports, and records.
    // Normal users only see active non-finished events.
    if (requesterRole !== 'admin' || showPast !== 'true') filter.endDate = { $gte: new Date() };
    let events = await Event.find(filter).sort({ startDate: 1 });
    if (q) {
      const regex = new RegExp(q, 'i');
      events = events.filter((e) => regex.test(e.title) || regex.test(e.description) || regex.test(e.location));
    }
    if (year !== 'all') events = events.filter((e) => new Date(e.startDate).getFullYear() === Number(year));
    if (month !== 'all') events = events.filter((e) => new Date(e.startDate).getMonth() + 1 === Number(month));
    if (sort === 'title_asc') events.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'title_desc') events.sort((a, b) => b.title.localeCompare(a.title));
    if (sort === 'date_desc') events.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    return res.json({ success: true, events: events.map(buildEventResponse) });
  } catch (e) {
    console.error('get events error', e);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
});

//updates event 
app.patch('/events/:id', requireAuth, requireRole('admin'), upload.single('image'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, msg: 'Event not found' });
    ['title', 'description', 'startDate', 'endDate', 'location', 'organizationName', 'capacity', 'status'].forEach((field) => {
      if (typeof req.body[field] !== 'undefined') event[field] = field === 'capacity' ? Number(req.body[field] || 0) : req.body[field];
    });
    if (req.file) event.imageUrl = `/uploads/${req.file.filename}`;
    ensureEventQrTokens(event);
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const now = new Date();
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return res.status(400).json({ success: false, msg: 'End date must be after start date' });
    if (!['active','disabled','archived','draft'].includes(event.status || 'active')) event.status = 'active';
    if (end <= now && ['active', 'disabled', 'draft'].includes(event.status)) event.status = 'archived';
    if (event.status === 'active' && start < now) return res.status(400).json({ success: false, msg: 'Past or finished events cannot be active. They are moved to Archive automatically.' });
    await event.save();
    await createActivity({ type: 'EVENT_UPDATED', title: 'Event updated', message: `${event.title} details were updated.`, actorId: req.auth.id, actorName: 'Admin', actorRole: req.auth.role, targetId: event._id, targetModel: 'Event', audienceRoles: ['admin'], meta: { eventId: event._id } });
    return res.json({ success: true, event: buildEventResponse(event) });
  } catch (e) {
    console.error('update event error', e);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// Events are never hard-deleted for CAT A audit. Admin hides them by status.
app.delete('/events/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, msg: 'Event not found' });
  event.status = 'archived';
  await event.save();
  await logActivity(req, 'EVENT_ARCHIVED', 'event', event._id, `Event hidden: ${event.title}`);
  return res.json({ success: true, msg: 'Event archived/hidden', event: buildEventResponse(event) });
});

// User registers for event
app.post('/events/:id/register', requireAuth, requireRole('innovator', 'funder', 'reviewer'), async (req, res) => {
  try {
    await moveFinishedEventsToDraft();
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, msg: 'Event not found' });
    if (event.status !== 'active') return res.status(400).json({ success: false, msg: 'Registration is disabled for this event' });
    if (new Date(event.endDate) < new Date()) return res.status(400).json({ success: false, msg: 'This event already finished' });
    const already = event.registrations.some((r) => String(r.userId) === String(req.auth.id));
    if (already) return res.status(400).json({ success: false, msg: 'Already registered' });
    if (event.capacity > 0 && event.registrations.length >= event.capacity) {
      return res.status(400).json({ success: false, msg: 'Event is full' });
    }
    event.registrations.push({ userId: req.auth.id });
    await event.save();
    await createNotification(req.auth.id, 'EVENT_REGISTERED', `You registered for event: ${event.title}`, { eventId: event._id });
    await createActivity({ type: 'EVENT_REGISTRATION', title: 'New event registration', message: `${req.auth.role} registered for ${event.title}.`, actorId: req.auth.id, actorName: req.auth.role, actorRole: req.auth.role, targetId: event._id, targetModel: 'Event', audienceRoles: ['admin'], audienceUsers: [req.auth.id], meta: { eventId: event._id } });
    return res.json({ success: true, event: buildEventResponse(event) });
  } catch (e) {
    console.error('register event error', e);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// Admin views QR attendance links and the registered user attendance list.
app.get('/events/:id/attendance', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('registrations.userId', 'name email role');
    if (!event) return res.status(404).json({ success: false, msg: 'Event not found' });
    const now = new Date();
    const finished = event.endDate ? new Date(event.endDate) <= now : false;
    if (finished && ['active', 'disabled', 'draft'].includes(event.status)) {
      event.status = 'archived';
    }
    ensureEventQrTokens(event);
    await event.save();
    const frontendUrl = getPublicFrontendUrl(req);
    const qrUrl = `${frontendUrl}/event-check/${event._id}/in/${event.qrCheckInToken}`;
    return res.json({
      success: true,
      event: {
        _id: event._id,
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        status: event.status,
        registrations: event.registrations,
        qrAvailable: finished,
        attendanceUrl: finished ? qrUrl : null,
        checkInUrl: finished ? qrUrl : null,
        qrMessage: finished
          ? 'Attendance QR is available because the event has finished.'
          : 'Attendance QR will be available after the event finishes.',
      },
    });
  } catch (e) {
    console.error('attendance list error', e);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// Users scan the admin QR after the event.
// The scan requires a short event evaluation before the certificate is released.
app.post('/events/:id/attendance/scan', requireAuth, requireRole('innovator', 'funder', 'reviewer'), async (req, res) => {
  try {
    const { type, token, rating, message, gender, ageRange } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, msg: 'Event not found' });

    const now = new Date();
    let registration = event.registrations.find((r) => String(r.userId) === String(req.auth.id));
    if (!registration) {
      // Make the QR flow reliable during demos: if a valid logged-in participant scans
      // the finished-event QR, add them to registrations then complete attendance.
      event.registrations.push({ userId: req.auth.id, registeredAt: now });
      registration = event.registrations[event.registrations.length - 1];
    }

    if ((type || 'in') !== 'in') return res.status(400).json({ success: false, msg: 'Invalid attendance QR type.' });
    if (token !== event.qrCheckInToken) return res.status(400).json({ success: false, msg: 'Invalid attendance QR code.' });

    const end = new Date(event.endDate);
    if (now < end) {
      return res.status(400).json({ success: false, msg: 'Attendance QR opens only after the event has finished.' });
    }

    const numericRating = Number(rating);
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, msg: 'Please rate the event from 1 to 5 before getting your certificate.' });
    }
    const safeGender = String(gender || '').trim().toLowerCase();
    const safeAgeRange = String(ageRange || '').trim();
    if (!['female', 'male'].includes(safeGender)) {
      return res.status(400).json({ success: false, msg: 'Please select your gender before getting your certificate.' });
    }
    if (!['under18', '18-24', '25-34', '35plus'].includes(safeAgeRange)) {
      return res.status(400).json({ success: false, msg: 'Please select your age group before getting your certificate.' });
    }
    if (isBlank(message)) {
      return res.status(400).json({ success: false, msg: 'Please write a short event evaluation before getting your certificate.' });
    }

    const existingEvaluation = await Feedback.findOne({
      userId: req.auth.id,
      eventId: event._id,
      category: 'EVENT_EVALUATION',
    });

    if (existingEvaluation) {
      existingEvaluation.rating = numericRating;
      existingEvaluation.message = String(message).trim();
      existingEvaluation.role = req.auth.role;
      existingEvaluation.gender = safeGender;
      existingEvaluation.ageRange = safeAgeRange;
      await existingEvaluation.save();
    } else {
      await Feedback.create({
        userId: req.auth.id,
        role: req.auth.role,
        message: String(message).trim(),
        rating: numericRating,
        category: 'EVENT_EVALUATION',
        eventId: event._id,
        gender: safeGender,
        ageRange: safeAgeRange,
      });
    }

    registration.attendanceStatus = 'completed';
    registration.checkedInAt = registration.checkedInAt || now;
    registration.completedAt = registration.completedAt || now;

    const certificate = await issueEventCertificateIfEligible(event, registration);
    await event.save();

    if (!certificate) {
      return res.status(500).json({
        success: false,
        msg: 'Evaluation was saved, but the certificate could not be issued. Please try again or contact the admin.',
      });
    }

    await createNotification(req.auth.id, 'CERTIFICATE_ISSUED', `Certificate issued for event: ${event.title}`, { eventId: event._id, certificateId: certificate?._id });
    await createActivity({
      type: 'EVENT_EVALUATION',
      title: 'Event evaluation submitted',
      message: `${req.auth.role} completed evaluation for ${event.title}.`,
      actorId: req.auth.id,
      actorName: req.auth.role,
      actorRole: req.auth.role,
      targetId: event._id,
      targetModel: 'Event',
      audienceRoles: ['admin'],
      audienceUsers: [req.auth.id],
      meta: { eventId: event._id, rating: numericRating, certificateId: certificate?._id },
    });

    return res.json({
      success: true,
      msg: 'Evaluation submitted. Your SparkUp certificate is now available in My Certificates.',
      event: buildEventResponse(event),
      certificate,
    });
  } catch (e) {
    console.error('attendance scan error', e);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
});


//FEEDBACK 


// CAT C: SparkUp-specific chatbot endpoint. It gives guided answers about this project flow,
// not a generic empty chatbot widget.
app.post('/api/chatbot/ask', requireAuth, async (req, res) => {
  try {
    const question = String(req.body?.question || '').trim();
    if (!question) return res.status(400).json({ success: false, msg: 'Question is required' });

    const q = question.toLowerCase();
    const knowledge = [
      { keys: ['submit', 'idea', 'ip'], answer: 'To submit an idea: open Idea Board, choose Submit Idea, write the idea details, download/fill the IP form, upload it, then submit. The status becomes Submitted and the admin reviews it.' },
      { keys: ['track', 'status', 'progress'], answer: 'Idea tracking follows this flow: Submit Idea → Admin Review → Reviewer Review → Present to Funders → Funder Decision → Contract → Completed. Open My Ideas/Tracking to see the current step.' },
      { keys: ['reviewer', 'review'], answer: 'The admin assigns approved ideas to reviewers. Reviewers can open assigned ideas, add score/comments, approve, request changes, or reject.' },
      { keys: ['funder', 'funding'], answer: 'Only approved funders can view ideas presented by the admin. Funders can accept/reject, update funding status, and continue with contract progress.' },
      { keys: ['event', 'qr', 'certificate'], answer: 'After an event finishes, the admin opens the event QR. Participants scan it, complete a short evaluation, and then receive their SparkUp event participation certificate.' },
      { keys: ['report', 'feedback', 'summary'], answer: 'Admins can open Reports & Feedback to see users, ideas, events, gender/age/field analytics, event evaluations, certificates issued, and participant comments.' },
      { keys: ['password', 'reset'], answer: 'Use Reset Password from your profile menu when logged in, or Forget Password on the login page if you cannot access your account.' },
      { keys: ['notification', 'reminder'], answer: 'SparkUp sends notifications for idea changes and automated event reminders 24 hours and 1 hour before registered events.' },
    ];

    const match = knowledge.find((item) => item.keys.some((key) => q.includes(key)));
    return res.json({
      success: true,
      answer: match?.answer || 'SparkUp helps innovators submit protected ideas, lets admins review and assign reviewers, connects approved ideas with funders, manages events, feedback, reports, certificates, and notifications. Ask me about idea submission, tracking, funding, events, QR certificates, reports, or password reset.',
    });
  } catch (e) {
    console.error('chatbot error', e);
    return res.status(500).json({ success: false, msg: 'Server error answering chatbot question' });
  }
});

// Submit feedback from innovator/funder/reviewer-->admin
app.post('/feedback', requireAuth, requireRole('innovator', 'funder', 'reviewer'), async (req, res) => {
  try {
    const { message, rating } = req.body;
    if (isBlank(message)) return res.status(400).json({ success: false, msg: 'message is required' });
    const feedback = await Feedback.create({ userId: req.auth.id, role: req.auth.role, message, rating: rating ? Number(rating) : null, category: 'GENERAL' });
    await createActivity({ type: 'FEEDBACK_SUBMITTED', title: 'New feedback received', message: `${req.auth.role} submitted feedback${rating ? ` with ${rating} stars` : ''}.`, actorId: req.auth.id, actorName: req.auth.role, actorRole: req.auth.role, targetId: feedback._id, targetModel: 'Feedback', audienceRoles: ['admin'], audienceUsers: [req.auth.id], meta: { feedbackId: feedback._id, rating } });
    return res.status(201).json({ success: true, feedback });
  } catch (e) {
    console.error('feedback error', e);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// Admin views feedback 
app.get('/admin/feedback/summary', requireAuth, requireRole('admin'), async (req, res) => {
  const [feedback, events] = await Promise.all([
    Feedback.find().sort({ createdAt: -1 }).populate('userId', 'name email role').populate('eventId', 'title startDate endDate organizationName'),
    Event.find().sort({ endDate: -1 }),
  ]);
  const generalFeedback = feedback.filter((f) => f.category !== 'EVENT_EVALUATION');
  const eventEvaluations = feedback.filter((f) => f.category === 'EVENT_EVALUATION');
  const rated = feedback.filter((f) => Number(f.rating || 0) > 0);
  const avg = rated.length ? rated.reduce((sum, f) => sum + Number(f.rating || 0), 0) / rated.length : 0;
  const eventSummaryReports = buildEventEvaluationSummary(events, feedback);
  return res.json({
    success: true,
    averageRating: Number(avg.toFixed(2)),
    total: feedback.length,
    totalGeneralFeedback: generalFeedback.length,
    totalEventEvaluations: eventEvaluations.length,
    feedback,
    eventSummaryReports,
  });
});


//REPORT 
// Admin  report
app.get('/reports/admin', requireAuth, requireRole('admin'), async (req, res) => {
  const [users, ideas, events, feedback, contracts, programs] = await Promise.all([
    User.find(),
    Idea.find(),
    Event.find(),
    Feedback.find(),
    Contract.find(),
    FundingProgram.find(),
  ]);
  const ideaStatusBreakdown = IDEA_STATUSES.reduce((acc, s) => ({ ...acc, [s]: ideas.filter((i) => i.status === s).length }), {});
  const userRoleBreakdown = ['innovator', 'funder', 'reviewer'].reduce((acc, role) => ({ ...acc, [role]: users.filter((u) => u.role === role).length }), {});
  const monthlyEventCount = events.reduce((acc, e) => {
    const key = new Date(e.startDate).toISOString().slice(0, 7);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const eventSummaryReports = buildEventEvaluationSummary(events, feedback);
  const totalEventEvaluations = feedback.filter((f) => f.category === 'EVENT_EVALUATION').length;
  const demographicAnalytics = buildDemographicAnalytics(users);
  return res.json({
    success: true,
    stats: {
      totalUsers: users.length,
      activeFunders: users.filter((u) => u.role === 'funder' && u.status === 'active').length,
      totalIdeas: ideas.length,
      totalEvents: events.length,
      totalFeedback: feedback.length,
      totalGeneralFeedback: feedback.filter((f) => f.category !== 'EVENT_EVALUATION').length,
      totalEventEvaluations,
      eventSummaryReports,
      totalCertificatesIssuedForEvents: eventSummaryReports.reduce((sum, event) => sum + Number(event.certificatesIssued || 0), 0),
      totalContracts: contracts.length,
      totalFundingPrograms: programs.length,
      userRoleBreakdown,
      ideaStatusBreakdown,
      monthlyEventCount,
      ...demographicAnalytics,
    },
  });
});


// Reviewer/admin report for evaluation quality and workload
app.get('/reports/reviewer', requireAuth, requireRole('reviewer', 'admin'), async (req, res) => {
  const filter = req.auth.role === 'reviewer' ? { reviewerId: req.auth.id } : {};
  const evaluations = await Evaluation.find(filter).sort({ createdAt: -1 }).populate('ideaId', 'title status').populate('reviewerId', 'name email specialization');
  const accepted = evaluations.filter((e) => e.decision === 'accepted').length;
  const changes = evaluations.filter((e) => e.decision === 'changes_requested').length;
  const rejected = evaluations.filter((e) => e.decision === 'rejected').length;
  const avgScore = evaluations.length ? evaluations.reduce((sum, e) => sum + Number(e.score || 0), 0) / evaluations.length : 0;
  return res.json({
    success: true,
    stats: {
      totalEvaluations: evaluations.length,
      accepted,
      changesRequested: changes,
      rejected,
      averageScore: Number(avgScore.toFixed(2)),
      evaluations,
    },
  });
});

//Funder/admin report for funding-stage ideas
app.get('/reports/funder', requireAuth, requireRole('funder', 'admin'), async (req, res) => {
  const ideas = await Idea.find({ selectedFunderIds: getAuthObjectId(req.auth.id), status: { $in: ['presented_to_funders', 'funding_pending', 'contract_drafted', 'contract_signed', 'in_progress', 'resolved'] } }).populate('innovatorId', 'name email phone imageUrl');
  return res.json({
    success: true,
    stats: {
      visibleIdeas: ideas.length,
      pendingIdeas: ideas.filter((i) => i.status === 'funding_pending').length,
      inProgressIdeas: ideas.filter((i) => i.status === 'in_progress').length,
      resolvedIdeas: ideas.filter((i) => i.status === 'resolved').length,
      ideas: ideas.map(buildIdeaResponse),
    },
  });
});



// Backward-compatible aliases used by the React funding page
app.post('/admin/funding-programs', requireAuth, requireRole('admin'), async (req, res, next) => { req.url = '/funding-programs'; next(); });
app.post('/admin/contracts', requireAuth, requireRole('admin'), async (req, res, next) => { req.url = '/contracts'; next(); });
app.patch('/funder/contracts/:id', requireAuth, requireRole('funder'), async (req, res, next) => { req.url = `/contracts/${req.params.id}/status`; next(); });

//FUNDING PROGRAMS + CONTRACTS
// Admin creates funding program
app.post('/funding-programs', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { name, budget, deadline, criteria, active } = req.body;
    if (isBlank(name)) return res.status(400).json({ success: false, msg: 'name is required' });
    if (!isPositiveMoney(budget)) return res.status(400).json({ success: false, msg: 'Valid positive funding budget is required' });
    if (!deadline || isPastDate(deadline)) return res.status(400).json({ success: false, msg: 'Funding deadline must be a future date' });
    const program = await FundingProgram.create({ name: String(name).trim(), budget: Number(budget), deadline: deadline || null, criteria: criteria || '', active: typeof active === 'boolean' ? active : true, createdByAdminId: req.auth.id });
    return res.status(201).json({ success: true, program });
  } catch (e) {
    console.error('create funding program error', e);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
});
// List funding programs
app.get('/funding-programs', requireAuth, async (req, res) => {
  const programs = await FundingProgram.find().sort({ createdAt: -1 });
  return res.json({ success: true, programs });
});
// Admin updates funding program
app.patch('/funding-programs/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const program = await FundingProgram.findById(req.params.id);
  if (!program) return res.status(404).json({ success: false, msg: 'Funding program not found' });
  ['name', 'criteria', 'deadline', 'active'].forEach((field) => {
    if (typeof req.body[field] !== 'undefined') program[field] = req.body[field];
  });
  if (typeof req.body.budget !== 'undefined') {
    if (!isPositiveMoney(req.body.budget)) return res.status(400).json({ success: false, msg: 'Valid positive funding budget is required' });
    program.budget = Number(req.body.budget);
  }
  if (typeof req.body.deadline !== 'undefined' && isPastDate(req.body.deadline)) return res.status(400).json({ success: false, msg: 'Funding deadline must be a future date' });
  await program.save();
  return res.json({ success: true, program });
});

// Admin issues contract for idea + funder
app.post('/contracts', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { ideaId, funderId, programId, contractUrl, status, finalBudget, deadline, conditions, milestones } = req.body;
    if (!ideaId || !funderId) return res.status(400).json({ success: false, msg: 'ideaId and funderId are required' });
    const resolvedBudget = Number(finalBudget || 0);
    if (!isPositiveMoney(resolvedBudget)) return res.status(400).json({ success: false, msg: 'Valid final budget is required before issuing contract' });
    if (!deadline || isPastDate(deadline)) return res.status(400).json({ success: false, msg: 'Future contract deadline is required' });
    if (isBlank(conditions)) return res.status(400).json({ success: false, msg: 'Contract conditions are required' });
    const idea = await Idea.findById(ideaId);
    if (!idea) return res.status(404).json({ success: false, msg: 'Idea not found' });
    const approvedFunder = await User.findOne({ _id: funderId, role: 'funder', status: 'active' });
    if (!approvedFunder || !idea.selectedFunderIds.some(id => String(id) === String(funderId))) {
      return res.status(403).json({ success: false, msg: 'Contract can only be issued to an approved selected funder' });
    }
    const contract = await Contract.create({
      ideaId,
      funderId,
      programId: programId || null,
      issuedByAdminId: req.auth.id,
      contractUrl: contractUrl || '',
      finalBudget: Number(finalBudget),
      deadline: deadline || idea.fundingAgreement?.deadline || null,
      conditions: conditions || idea.fundingAgreement?.conditions || '',
      milestones: Array.isArray(milestones) ? milestones : idea.fundingAgreement?.milestones || [],
      status: CONTRACT_STATUSES.includes(status) ? status : 'Drafted',
    });
    idea.contractId = contract._id;
    if (['presented_to_funders', 'funding_pending'].includes(idea.status)) idea.status = 'contract_drafted';
    await idea.save();
    await logActivity(req, 'CONTRACT_ISSUED', 'contract', contract._id, `Contract issued for idea ${idea.title}`, { ideaId, funderId });
    await createNotification(funderId, 'CONTRACT_ISSUED', `A contract was issued for idea ${idea.title}`, { ideaId, contractId: contract._id });
    return res.status(201).json({ success: true, contract });
  } catch (e) {
    console.error('create contract error', e);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// Get contracts--> funder sees only own contracts
app.get('/contracts', requireAuth, async (req, res) => {
  const filter = {};
  if (req.auth.role === 'funder') filter.funderId = req.auth.id;
  const contracts = await Contract.find(filter).sort({ createdAt: -1 }).populate('ideaId').populate('funderId', 'name email').populate('programId');
  return res.json({ success: true, contracts });
});

// Admin or owning funder updates contract status
app.patch('/contracts/:id/status', requireAuth, requireRole('admin', 'funder'), async (req, res) => {
  const { status } = req.body;
  if (!CONTRACT_STATUSES.includes(status)) return res.status(400).json({ success: false, msg: 'Invalid contract status' });
  const contract = await Contract.findById(req.params.id);
  if (!contract) return res.status(404).json({ success: false, msg: 'Contract not found' });
  if (req.auth.role === 'funder' && String(contract.funderId) !== String(req.auth.id)) {
    return res.status(403).json({ success: false, msg: 'Forbidden' });
  }
  contract.status = status;
  await contract.save();
  const idea = await Idea.findById(contract.ideaId);
  if (idea) {
    if (status === 'Signed') idea.status = 'contract_signed';
    if (status === 'In Implementation') idea.status = 'in_progress';
    if (status === 'Completed') idea.status = 'resolved';
    await idea.save();
    await createNotification(idea.innovatorId, 'CONTRACT_STATUS', `Contract for your idea is now: ${status}`, { ideaId: idea._id, contractId: contract._id, status });
    await emitIdeaUpdate(idea._id);
  }
  return res.json({ success: true, contract });
});

// Admin audit log/activity history for CAT A traceability
app.get('/admin/activity-logs', requireAuth, requireRole('admin'), async (req, res) => {
  const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(300);
  return res.json({ success: true, logs });
});

//CERTIFICATE 
// Get certificates admin sees all others see own
app.get('/certificates', requireAuth, async (req, res) => {
  const filter = req.auth.role === 'admin' ? {} : { userId: req.auth.id };
  const certificates = await Certificate.find(filter).sort({ createdAt: -1 }).populate('userId', 'name email role').populate('eventId', 'title startDate organizationName').populate('ideaId', 'title');
  return res.json({ success: true, certificates });
});


//NOTIFICATION
// Get latest notifications for user
app.get('/notifications', requireAuth, async (req, res) => {
  const notifications = await Notification.find({ userId: req.auth.id }).sort({ createdAt: -1 }).limit(200);
  return res.json({ success: true, notifications });
});
// Mark one notification as read
app.patch('/notifications/:id/read', requireAuth, async (req, res) => {
  const n = await Notification.findOne({ _id: req.params.id, userId: req.auth.id });
  if (!n) return res.status(404).json({ success: false, msg: 'Not found' });
  n.read = true;
  await n.save();
  return res.json({ success: true });
});


// FILE UPLOAD ERROR HANDLER
app.use((err, req, res, next) => {
  if (err?.message?.includes('Only image and PDF files')) {
    return res.status(400).json({ success: false, msg: 'Only image and PDF files are allowed' });
  }
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, msg: 'File is too large (max 5MB)' });
  }
  next(err);
});


//START SERVER
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
