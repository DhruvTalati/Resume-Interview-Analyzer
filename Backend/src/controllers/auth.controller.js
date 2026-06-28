const userModel           = require("../models/user.model");
const jwt                 = require("jsonwebtoken");
const bcrypt              = require("bcrypt");
const tokenBlacklistModel = require("../models/blacklist.model");

// ── Async error wrapper — eliminates try/catch in every handler ───────────────
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ── Helpers ───────────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: "none",
  maxAge:   24 * 60 * 60 * 1000, // 1 day
};

const signToken = (user) =>
  jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

const safeUser = (user) => ({
  id:       user._id,
  username: user.username,
  email:    user.email,
});

// ── Register ──────────────────────────────────────────────────────────────────
/**
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUserController = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // Input validation
  if (!username?.trim() || !email?.trim() || !password) {
    return res.status(400).json({
      success: false,
      message: "Username, email and password are all required.",
    });
  }
  if (username.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: "Username must be at least 3 characters.",
    });
  }
  if (!EMAIL_RE.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email address.",
    });
  }
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters.",
    });
  }

  // Duplicate check
  const existing = await userModel.findOne({
    $or: [{ username: username.trim() }, { email: email.trim().toLowerCase() }],
  });
  if (existing) {
    const field = existing.email === email.trim().toLowerCase() ? "email" : "username";
    return res.status(409).json({
      success: false,
      message: `An account with this ${field} already exists.`,
      field,
    });
  }

  const hash = await bcrypt.hash(password, 12);
  const user = await userModel.create({
    username: username.trim(),
    email:    email.trim().toLowerCase(),
    password: hash,
  });

  const token = signToken(user);
  res.cookie("token", token, COOKIE_OPTIONS);

  res.status(201).json({
    success: true,
    message: "Account created successfully.",
    user:    safeUser(user),
  });
});

// ── Login ─────────────────────────────────────────────────────────────────────
/**
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUserController = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required.",
    });
  }

  const user = await userModel.findOne({ email: email.trim().toLowerCase() });

  // Use the same generic message for both wrong email & wrong password
  // to prevent user enumeration attacks
  const INVALID_MSG = "Invalid email or password.";

  if (!user) {
    return res.status(401).json({ success: false, message: INVALID_MSG });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ success: false, message: INVALID_MSG });
  }

  const token = signToken(user);
  res.cookie("token", token, COOKIE_OPTIONS);

  res.status(200).json({
    success: true,
    message: "Logged in successfully.",
    user:    safeUser(user),
  });
});

// ── Logout ────────────────────────────────────────────────────────────────────
/**
 * @route   GET /api/auth/logout
 * @access  Public
 */
const logoutUserController = asyncHandler(async (req, res) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "No active session found.",
    });
  }

  // Blacklist the token so it can't be reused even before expiry
  await tokenBlacklistModel.create({ token });

  res.clearCookie("token", {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "none",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});

// ── Get Me ────────────────────────────────────────────────────────────────────
/**
 * @route   GET /api/auth/get-me
 * @access  Private
 */
const getMeController = asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.user.id).select("-password -__v");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found.",
    });
  }

  res.status(200).json({
    success: true,
    message: "User fetched successfully.",
    user:    safeUser(user),
  });
});

module.exports = {
  registerUserController,
  loginUserController,
  logoutUserController,
  getMeController,
};