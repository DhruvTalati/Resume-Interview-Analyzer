import api from "../../../api/axios";

/**
 * @desc  Register a new user
 * @throws {Error} with .message and .status from the server
 */
export async function register({ username, email, password }) {
  const response = await api.post("/api/auth/register", {
    username,
    email,
    password,
  });
  return response.data; // { success, message, user }
}

/**
 * @desc  Login with email + password
 * @throws {Error} with .message from server (e.g. "Invalid email or password.")
 */
export async function login({ email, password }) {
  const response = await api.post("/api/auth/login", {
    email,
    password,
  });
  return response.data; // { success, message, user }
}

/**
 * @desc  Logout — clears cookie on server, blacklists token
 * @throws {Error} if request fails
 */
export async function logout() {
  const response = await api.get("/api/auth/logout");
  return response.data; // { success, message }
}

/**
 * @desc  Get the currently logged-in user
 * @returns {Object|null} response data, or null if not authenticated
 */
export async function getMe() {
  try {
    const response = await api.get("/api/auth/get-me");
    return response.data; // { success, message, user }
  } catch (err) {
    // 401 is expected when not logged in — return null silently
    if (err.status === 401) return null;
    throw err;
  }
}
