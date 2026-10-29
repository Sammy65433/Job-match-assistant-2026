import { Router } from "express";

import { currentUser, signIn, signUp } from "../auth.js";
import { signInWithGoogle } from "../googleAuth.js";
import { requireJobUser } from "../middleware/requireJobUser.js";

const router = Router();

router.post("/signup", signUp);
router.post("/google", signInWithGoogle);
router.post("/login", signIn);
router.get("/me", requireJobUser, currentUser);

export default router;
