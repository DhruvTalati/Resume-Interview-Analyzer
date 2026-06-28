const { Router } = require("express");
const authController = require("../controllers/auth.controller");
const { authUser } = require("../middlewares/auth.middleware");

const authRouter = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
authRouter.post("/register", authController.registerUserController);

/**
 * @route   POST /api/auth/login
 * @desc    Login with email + password
 * @access  Public
 */
authRouter.post("/login", authController.loginUserController);

/**
 * @route   GET /api/auth/logout
 * @desc    Logout and blacklist token
 * @access  Public
 */
authRouter.get("/logout", authController.logoutUserController);

/**
 * @route   GET /api/auth/get-me
 * @desc    Get current logged-in user
 * @access  Private
 */
authRouter.get("/get-me", authUser, authController.getMeController);

module.exports = authRouter;
