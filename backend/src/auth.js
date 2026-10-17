import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import JobUser from "./models/JobUser.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function issueToken(user) {
  if (!process.env.JOB_AUTH_SECRET) {
    throw new Error("JOB_AUTH_SECRET is not configured.");
  }

  return jwt.sign(
    { sub: user.id },
    process.env.JOB_AUTH_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "12h",
      issuer: "job-match-assistant"
    }
  );
}

function publicUser(user) {
  return { id: user.id, email: user.email };
}

export async function signUp(req, res) {
  const { email, password } = req.body ?? {};
  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";

  if (
    !EMAIL_PATTERN.test(normalizedEmail) ||
    normalizedEmail.length > 254 ||
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 128
  ) {
    return res.status(400).json({
      error: "Provide a valid email and a password of 12 to 128 characters."
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await JobUser.create({
      email: normalizedEmail,
      passwordHash
    });

    return res.status(201).json({
      token: issueToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "Account already exists." });
    }

    console.error("Sign-up failed:", error);
    return res.status(500).json({ error: "Could not create account." });
  }
}

export async function signIn(req, res) {
  const { email, password } = req.body ?? {};
  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";

  if (
    !EMAIL_PATTERN.test(normalizedEmail) ||
    typeof password !== "string"
  ) {
    return res.status(400).json({ error: "Invalid credentials." });
  }

  try {
    const user = await JobUser.findOne({
      email: normalizedEmail
    }).select("+passwordHash");

    if (
      !user?.passwordHash ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    return res.json({
      token: issueToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    console.error("Sign-in failed:", error);
    return res.status(500).json({ error: "Could not sign in." });
  }
}

export async function currentUser(req, res) {
  try {
    const user = await JobUser.findById(req.jobUser.id);

    if (!user) {
      return res.status(401).json({ error: "Account not found." });
    }

    return res.json({ user: publicUser(user) });
  } catch (error) {
    console.error("Could not load account:", error);
    return res.status(500).json({ error: "Could not load account." });
  }
}
