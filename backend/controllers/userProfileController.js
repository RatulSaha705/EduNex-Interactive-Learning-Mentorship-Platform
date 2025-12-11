// backend/controllers/userProfileController.js
import User from "../models/User.js";

/**
 * @desc   Get profile of the logged-in user
 *         (including interests for recommendations)
 * @route  GET /api/me/profile
 * @access Protected
 */
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "name email role interests learningStats isActive createdAt updatedAt"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (err) {
    console.error("Error in getMyProfile:", err);
    return res.status(500).json({
      message: "Error fetching profile",
      error: err.message,
    });
  }
};

/**
 * @desc   Update interests for the logged-in user.
 *         These drive course recommendations.
 * @route  PATCH /api/me/interests
 * @body   { interests: string[] }
 * @access Protected
 */
export const updateMyInterests = async (req, res) => {
  try {
    const { interests } = req.body;

    if (!Array.isArray(interests)) {
      return res
        .status(400)
        .json({ message: "interests must be an array of strings" });
    }

    // Normalise: trim + lowercase + remove empties + dedupe
    const cleaned = Array.from(
      new Set(
        interests
          .map((item) => String(item).trim().toLowerCase())
          .filter((item) => item.length > 0)
      )
    );

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.interests = cleaned;
    await user.save();

    return res.json({
      message: "Interests updated successfully",
      interests: user.interests,
    });
  } catch (err) {
    console.error("Error in updateMyInterests:", err);
    return res.status(500).json({
      message: "Error updating interests",
      error: err.message,
    });
  }
};

/**
 * @desc   (Optional) Update basic profile fields
 *         e.g. name only for now (email/password should have separate flows)
 * @route  PATCH /api/me/profile
 * @body   { name?: string }
 * @access Protected
 */
export const updateMyProfile = async (req, res) => {
  try {
    const { name } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (typeof name === "string" && name.trim().length > 0) {
      user.name = name.trim();
    }

    await user.save();

    return res.json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        interests: user.interests,
      },
    });
  } catch (err) {
    console.error("Error in updateMyProfile:", err);
    return res.status(500).json({
      message: "Error updating profile",
      error: err.message,
    });
  }
};
