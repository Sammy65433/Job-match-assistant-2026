import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import JobUser from "./models/JobUser.js";

const googleClient = new OAuth2Client();

export async function signInWithGoogle(req, res) {
  const { credential } = req.body ?? {};

  if (
    typeof credential !== "string" ||
    !credential ||
    credential.length > 10000
  ) {
    return res.status(400).json({ error: "Google credential required." });
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.JOB_AUTH_SECRET) {
    return res.status(503).json({ error: "Google sign-in is not configured." });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      return res.status(401).json({ error: "Google account not verified." });
    }

    // Never merge an existing password account using email alone.
    let user = await JobUser.findOne({ googleSub: payload.sub });

    if (!user) {
      const existingEmail = await JobUser.findOne({
        email: payload.email.toLowerCase()
      });

      if (existingEmail) {
        return res.status(409).json({
          error:
            "An account with this email already exists. Sign in with its original method."
        });
      }

      user = await JobUser.create({
        email: payload.email.toLowerCase(),
        googleSub: payload.sub
      });
    }

    const token = jwt.sign(
      { sub: user.id },
      process.env.JOB_AUTH_SECRET,
      {
        algorithm: "HS256",
        expiresIn: "12h",
        issuer: "job-match-assistant"
      }
    );

    return res.json({
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: "Account already exists. Sign in with its original method."
      });
    }

    console.error("Google sign-in verification failed:", error.message);
    return res.status(401).json({ error: "Google sign-in failed." });
  }
}
