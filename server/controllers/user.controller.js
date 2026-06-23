import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import uploadCloudinary from "../utils/cloudinary.js";
import {
  assignFreeSubscriptionToUser,
  getActiveSubscription,
} from "../utils/subscription.utils.js";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeLimit = (limit = DEFAULT_LIMIT) => {
  const safeLimit = Math.max(Number(limit) || DEFAULT_LIMIT, 1);
  return Math.min(safeLimit, MAX_LIMIT);
};

const normalizeString = (value = "") => String(value || "").trim();

const normalizeEmail = (email = "") => String(email || "").toLowerCase().trim();

const normalizeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const clampNumber = (value, min, max, fallback = 0) => {
  const number = normalizeNumber(value, fallback);
  return Math.min(Math.max(number, min), max);
};

const encodeCursor = (doc) => {
  if (!doc) return null;

  const payload = {
    createdAt:
      doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
    id: doc._id.toString(),
  };

  return Buffer.from(JSON.stringify(payload)).toString("base64url");
};

const decodeCursor = (cursor) => {
  if (!cursor) return null;

  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));

    if (!parsed?.createdAt || !parsed?.id || !isValidObjectId(parsed.id)) {
      return null;
    }

    const createdAt = new Date(parsed.createdAt);

    if (Number.isNaN(createdAt.getTime())) {
      return null;
    }

    return {
      createdAt,
      id: new mongoose.Types.ObjectId(parsed.id),
    };
  } catch {
    return null;
  }
};

const getCursorFilter = (cursor) => {
  const decoded = decodeCursor(cursor);

  if (!decoded) return {};

  return {
    $or: [
      { createdAt: { $lt: decoded.createdAt } },
      {
        createdAt: decoded.createdAt,
        _id: { $lt: decoded.id },
      },
    ],
  };
};

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

const subscriptionPopulate = {
  path: "currentSubscription",
  select:
    "planName planSlug roleType status startDate endDate price currency features",
};

const safeUserSelect = "-password";

const publicLawyerSelect =
  "name email phone role lawRegNumber phoneVerified subscriptionStatus currentSubscription specialization experienceYears profileImage bio officeAddress city consultationFee availability rating casesHandled isVerifiedLawyer profileCompleted createdAt updatedAt";

const getSafeUserData = (user) => ({
  id: user._id,
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || null,
  nid: user.nid || null,
  lawRegNumber: user.lawRegNumber || null,
  phoneVerified: user.phoneVerified || 0,
  role: user.role,
  subscriptionStatus: user.subscriptionStatus,
  currentSubscription: user.currentSubscription || null,
  specialization: user.specialization || "",
  experienceYears: user.experienceYears ?? 0,
  profileImage: user.profileImage || "",
  bio: user.bio || "",
  officeAddress: user.officeAddress || "",
  city: user.city || "",
  consultationFee: user.consultationFee ?? 0,
  availability: user.availability || "available",
  rating: user.rating ?? 0,
  casesHandled: user.casesHandled ?? 0,
  isVerifiedLawyer: user.isVerifiedLawyer || false,
  profileCompleted: user.profileCompleted || false,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const isLawyerProfileComplete = (data = {}) => {
  return Boolean(
    data.specialization &&
      Number(data.experienceYears) >= 0 &&
      data.profileImage &&
      data.bio &&
      data.city &&
      Number(data.consultationFee) >= 0 &&
      data.availability
  );
};

const uploadProfileImageIfExists = async (file) => {
  if (!file?.buffer) return null;

  const imageUrl = await uploadCloudinary(file.buffer);

  if (!imageUrl) {
    throw new Error("Failed to upload profile image");
  }

  return imageUrl;
};

const buildUserFilter = (query = {}) => {
  const { role, search, subscriptionStatus } = query;

  const filter = {};

  if (role && role !== "all") {
    filter.role = role;
  }

  if (subscriptionStatus && subscriptionStatus !== "all") {
    filter.subscriptionStatus = subscriptionStatus;
  }

  if (search?.trim()) {
    const keyword = search.trim();

    filter.$or = [
      { name: { $regex: keyword, $options: "i" } },
      { email: { $regex: keyword, $options: "i" } },
      { phone: { $regex: keyword, $options: "i" } },
      { nid: { $regex: keyword, $options: "i" } },
      { lawRegNumber: { $regex: keyword, $options: "i" } },
      { specialization: { $regex: keyword, $options: "i" } },
      { city: { $regex: keyword, $options: "i" } },
    ];
  }

  return filter;
};

const buildPublicLawyerFilter = (query = {}) => {
  const {
    search = "",
    subscriptionStatus = "all",
    specialization = "all",
    city = "all",
    availability = "all",
    minExperience,
    maxConsultationFee,
  } = query;

  const filter = {
    role: "lawyer",
    phoneVerified: 1,
    profileCompleted: true,
    isVerifiedLawyer: true,
  };

  if (subscriptionStatus !== "all") {
    filter.subscriptionStatus = subscriptionStatus;
  }

  if (specialization !== "all") {
    filter.specialization = specialization;
  }

  if (city !== "all") {
    filter.city = { $regex: city.trim(), $options: "i" };
  }

  if (availability !== "all") {
    filter.availability = availability;
  }

  if (minExperience !== undefined && minExperience !== "") {
    filter.experienceYears = {
      ...(filter.experienceYears || {}),
      $gte: normalizeNumber(minExperience, 0),
    };
  }

  if (maxConsultationFee !== undefined && maxConsultationFee !== "") {
    filter.consultationFee = {
      ...(filter.consultationFee || {}),
      $lte: normalizeNumber(maxConsultationFee, 0),
    };
  }

  if (search?.trim()) {
    const keyword = search.trim();

    filter.$or = [
      { name: { $regex: keyword, $options: "i" } },
      { email: { $regex: keyword, $options: "i" } },
      { phone: { $regex: keyword, $options: "i" } },
      { lawRegNumber: { $regex: keyword, $options: "i" } },
      { specialization: { $regex: keyword, $options: "i" } },
      { city: { $regex: keyword, $options: "i" } },
      { bio: { $regex: keyword, $options: "i" } },
    ];
  }

  return filter;
};

const buildLawyerSort = (sortBy = "recommended") => {
  switch (sortBy) {
    case "rating":
      return {
        rating: -1,
        isVerifiedLawyer: -1,
        createdAt: -1,
        _id: -1,
      };

    case "experience":
      return {
        experienceYears: -1,
        isVerifiedLawyer: -1,
        createdAt: -1,
        _id: -1,
      };

    case "feeLow":
      return {
        consultationFee: 1,
        isVerifiedLawyer: -1,
        createdAt: -1,
        _id: -1,
      };

    case "newest":
      return {
        createdAt: -1,
        _id: -1,
      };

    default:
      return {
        isVerifiedLawyer: -1,
        profileCompleted: -1,
        subscriptionStatus: 1,
        rating: -1,
        experienceYears: -1,
        createdAt: -1,
        _id: -1,
      };
  }
};

const getSubscriptionFeature = (subscription, key, fallback = null) => {
  if (!subscription?.features || typeof subscription.features !== "object") {
    return fallback;
  }

  if (!Object.prototype.hasOwnProperty.call(subscription.features, key)) {
    return fallback;
  }

  return subscription.features[key];
};

const canViewFullLawyerDetails = async (req) => {
  if (!req.user) return false;

  if (req.user.role === "admin") return true;

  if (req.user.role !== "client") return false;

  const activeSubscription = await getActiveSubscription(req.user.id);

  return (
    getSubscriptionFeature(activeSubscription, "lawyer_detail_access", false) ===
    true
  );
};

const hasLawyerProfileBoost = (lawyer) => {
  return (
    lawyer?.currentSubscription?.features?.profile_boost === true &&
    lawyer?.currentSubscription?.status === "active"
  );
};

const maskLawyerForAccess = (lawyer, fullAccess = false) => {
  if (!lawyer) return lawyer;

  if (fullAccess) {
    return {
      ...lawyer,
      profileBoosted: hasLawyerProfileBoost(lawyer),
      access: {
        lawyerDetailAccess: true,
        lockedFields: [],
      },
    };
  }

  return {
    id: lawyer._id,
    _id: lawyer._id,
    name: lawyer.name,
    role: lawyer.role,
    specialization: lawyer.specialization || "",
    experienceYears: lawyer.experienceYears ?? 0,
    bio: lawyer.bio || "",
    isVerifiedLawyer: lawyer.isVerifiedLawyer || false,
    profileCompleted: lawyer.profileCompleted || false,
    profileBoosted: hasLawyerProfileBoost(lawyer),
    access: {
      lawyerDetailAccess: false,
      lockedFields: [
        "email",
        "phone",
        "lawRegNumber",
        "phoneVerified",
        "subscriptionStatus",
        "currentSubscription",
        "profileImage",
        "officeAddress",
        "city",
        "consultationFee",
        "availability",
        "rating",
        "casesHandled",
        "createdAt",
        "updatedAt",
      ],
      message:
        "Upgrade your plan to view full lawyer details and contact information.",
    },
  };
};

const sortBoostedLawyersFirst = (lawyers = [], sortBy = "recommended") => {
  if (sortBy !== "recommended") return lawyers;

  return [...lawyers].sort((a, b) => {
    const boostA = hasLawyerProfileBoost(a) ? 1 : 0;
    const boostB = hasLawyerProfileBoost(b) ? 1 : 0;

    if (boostA !== boostB) return boostB - boostA;

    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
};

export const registerClient = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone and password are required",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const existingUser = await User.exists({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: normalizeString(name),
      email: normalizedEmail,
      phone: normalizeString(phone),
      password: hashedPassword,
      role: "client",
    });

    await assignFreeSubscriptionToUser(user);

    const finalUser = await User.findById(user._id)
      .select(safeUserSelect)
      .populate(subscriptionPopulate)
      .lean();

    const token = generateToken(finalUser);

    return res.status(201).json({
      success: true,
      message: "Client registered successfully. Free plan activated.",
      user: getSafeUserData(finalUser),
      token,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to register client",
      error: err.message,
    });
  }
};

export const registerLawyer = async (req, res) => {
  try {
    const { name, email, nid, lawRegNumber, phone, password } = req.body;

    if (!name || !email || !nid || !lawRegNumber || !phone || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, nid, lawRegNumber, phone and password are required",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const existingUser = await User.exists({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: normalizeString(name),
      email: normalizedEmail,
      nid: normalizeString(nid),
      lawRegNumber: normalizeString(lawRegNumber),
      phone: normalizeString(phone),
      phoneVerified: 0,
      isVerifiedLawyer: false,
      profileCompleted: false,
      password: hashedPassword,
      role: "lawyer",
    });

    await assignFreeSubscriptionToUser(user);

    const finalUser = await User.findById(user._id)
      .select(safeUserSelect)
      .populate(subscriptionPopulate)
      .lean();

    const token = generateToken(finalUser);

    return res.status(201).json({
      success: true,
      message:
        "Lawyer registered successfully. Complete your profile after login and wait for admin verification.",
      user: getSafeUserData(finalUser),
      token,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to register lawyer",
      error: err.message,
    });
  }
};

export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const existingUser = await User.exists({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: normalizeString(name),
      email: normalizedEmail,
      phone: normalizeString(phone),
      password: hashedPassword,
      role: "admin",
    });

    const finalUser = await User.findById(user._id).select(safeUserSelect).lean();

    const token = generateToken(finalUser);

    return res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      user: getSafeUserData(finalUser),
      token,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to register admin",
      error: err.message,
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const userWithPassword = await User.findOne({
      email: normalizeEmail(email),
    }).select("+password");

    if (!userWithPassword) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, userWithPassword.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (
      ["client", "lawyer"].includes(userWithPassword.role) &&
      userWithPassword.subscriptionStatus === "none"
    ) {
      await assignFreeSubscriptionToUser(userWithPassword);
    }

    const user = await User.findById(userWithPassword._id)
      .select(safeUserSelect)
      .populate(subscriptionPopulate)
      .lean();

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful ✅",
      user: getSafeUserData(user),
      token,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: err.message,
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select(safeUserSelect)
      .populate(subscriptionPopulate)
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: getSafeUserData(user),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: err.message,
    });
  }
};

export const completeLawyerProfile = async (req, res) => {
  try {
    if (req.user.role !== "lawyer") {
      return res.status(403).json({
        success: false,
        message: "Only lawyers can complete lawyer profile",
      });
    }

    const {
      specialization,
      experienceYears,
      bio,
      officeAddress,
      city,
      consultationFee,
      availability,
    } = req.body;

    if (
      !specialization ||
      experienceYears === undefined ||
      !bio ||
      !city ||
      consultationFee === undefined ||
      !availability
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Specialization, experienceYears, bio, city, consultationFee and availability are required",
      });
    }

    const uploadedImageUrl = await uploadProfileImageIfExists(req.file);

    const updateData = {
      specialization: normalizeString(specialization),
      experienceYears: clampNumber(experienceYears, 0, 80, 0),
      bio: normalizeString(bio),
      officeAddress: normalizeString(officeAddress),
      city: normalizeString(city),
      consultationFee: normalizeNumber(consultationFee, 0),
      availability: normalizeString(availability),
    };

    if (uploadedImageUrl) {
      updateData.profileImage = uploadedImageUrl;
    }

    const currentUser = await User.findById(req.user.id).lean();

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    updateData.profileCompleted = isLawyerProfileComplete({
      ...currentUser,
      ...updateData,
    });

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    })
      .select(safeUserSelect)
      .populate(subscriptionPopulate)
      .lean();

    return res.status(200).json({
      success: true,
      message:
        "Lawyer profile completed successfully. Please wait for admin verification.",
      data: getSafeUserData(updatedUser),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to complete lawyer profile",
      error: err.message,
    });
  }
};

export const updateMyLawyerProfile = async (req, res) => {
  try {
    if (req.user.role !== "lawyer") {
      return res.status(403).json({
        success: false,
        message: "Only lawyers can update lawyer profile",
      });
    }

    const allowedFields = [
      "specialization",
      "experienceYears",
      "bio",
      "officeAddress",
      "city",
      "consultationFee",
      "availability",
    ];

    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const uploadedImageUrl = await uploadProfileImageIfExists(req.file);

    if (uploadedImageUrl) {
      updateData.profileImage = uploadedImageUrl;
    }

    if (updateData.specialization !== undefined) {
      updateData.specialization = normalizeString(updateData.specialization);
    }

    if (updateData.experienceYears !== undefined) {
      updateData.experienceYears = clampNumber(updateData.experienceYears, 0, 80, 0);
    }

    if (updateData.bio !== undefined) {
      updateData.bio = normalizeString(updateData.bio);
    }

    if (updateData.officeAddress !== undefined) {
      updateData.officeAddress = normalizeString(updateData.officeAddress);
    }

    if (updateData.city !== undefined) {
      updateData.city = normalizeString(updateData.city);
    }

    if (updateData.consultationFee !== undefined) {
      updateData.consultationFee = normalizeNumber(updateData.consultationFee, 0);
    }

    if (updateData.availability !== undefined) {
      updateData.availability = normalizeString(updateData.availability);
    }

    const currentUser = await User.findById(req.user.id).lean();

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    updateData.profileCompleted = isLawyerProfileComplete({
      ...currentUser,
      ...updateData,
    });

    if (currentUser.isVerifiedLawyer && !updateData.profileCompleted) {
      updateData.isVerifiedLawyer = false;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    })
      .select(safeUserSelect)
      .populate(subscriptionPopulate)
      .lean();

    return res.status(200).json({
      success: true,
      message:
        "Lawyer profile updated successfully. Verification depends on admin approval.",
      data: getSafeUserData(updatedUser),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update lawyer profile",
      error: err.message,
    });
  }
};

export const getPublicLawyers = async (req, res) => {
  try {
    const { cursor, limit = 12, sortBy = "recommended" } = req.query;

    const safeLimit = normalizeLimit(limit);
    const filter = buildPublicLawyerFilter(req.query);
    const cursorFilter = getCursorFilter(cursor);

    const finalFilter = Object.keys(cursorFilter).length
      ? { $and: [filter, cursorFilter] }
      : filter;

    const canViewFull = await canViewFullLawyerDetails(req);

    const lawyers = await User.find(finalFilter)
      .select(publicLawyerSelect)
      .populate(subscriptionPopulate)
      .sort(buildLawyerSort(sortBy))
      .limit(safeLimit + 1)
      .lean();

    const sortedLawyers = sortBoostedLawyersFirst(lawyers, sortBy);

    const hasNextPage = sortedLawyers.length > safeLimit;
    const pagedData = hasNextPage
      ? sortedLawyers.slice(0, safeLimit)
      : sortedLawyers;

    const data = pagedData.map((lawyer) =>
      maskLawyerForAccess(lawyer, canViewFull)
    );

    const nextCursor = hasNextPage
      ? encodeCursor(pagedData[pagedData.length - 1])
      : null;

    return res.status(200).json({
      success: true,
      message: canViewFull
        ? "Lawyers fetched successfully with full details"
        : "Lawyers fetched successfully with basic details",
      meta: {
        limit: safeLimit,
        hasNextPage,
        nextCursor,
        count: data.length,
        lawyerDetailAccess: canViewFull,
      },
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch lawyers",
      error: err.message,
    });
  }
};

export const getPublicLawyerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lawyer id",
      });
    }

    const canViewFull = await canViewFullLawyerDetails(req);

    const lawyer = await User.findOne({
      _id: id,
      role: "lawyer",
      phoneVerified: 1,
      profileCompleted: true,
      isVerifiedLawyer: true,
    })
      .select(publicLawyerSelect)
      .populate(subscriptionPopulate)
      .lean();

    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: "Lawyer not found or not approved yet",
      });
    }

    return res.status(200).json({
      success: true,
      message: canViewFull
        ? "Lawyer fetched successfully with full details"
        : "Lawyer fetched successfully with basic details",
      meta: {
        lawyerDetailAccess: canViewFull,
      },
      data: maskLawyerForAccess(lawyer, canViewFull),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch lawyer",
      error: err.message,
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { cursor } = req.query;
    const limit = normalizeLimit(req.query.limit);
    const filter = buildUserFilter(req.query);
    const cursorFilter = getCursorFilter(cursor);

    const finalFilter = Object.keys(cursorFilter).length
      ? { $and: [filter, cursorFilter] }
      : filter;

    const users = await User.find(finalFilter)
      .select(safeUserSelect)
      .populate(subscriptionPopulate)
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .limit(limit + 1)
      .lean();

    const hasNextPage = users.length > limit;
    const data = hasNextPage ? users.slice(0, limit) : users;
    const nextCursor = hasNextPage ? encodeCursor(data[data.length - 1]) : null;

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      meta: {
        limit,
        hasNextPage,
        nextCursor,
        count: data.length,
      },
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: err.message,
    });
  }
};

export const getUsersDropdown = async (req, res) => {
  try {
    const { role = "client", search = "", cursor } = req.query;
    const limit = normalizeLimit(req.query.limit || 50);

    const filter = {};

    if (role && role !== "all") {
      filter.role = role;
    }

    if (search.trim()) {
      const keyword = search.trim();

      filter.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } },
        { phone: { $regex: keyword, $options: "i" } },
      ];
    }

    const cursorFilter = getCursorFilter(cursor);

    const finalFilter = Object.keys(cursorFilter).length
      ? { $and: [filter, cursorFilter] }
      : filter;

    const users = await User.find(finalFilter)
      .select("name email phone role createdAt")
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .limit(limit + 1)
      .lean();

    const hasNextPage = users.length > limit;
    const data = hasNextPage ? users.slice(0, limit) : users;
    const nextCursor = hasNextPage ? encodeCursor(data[data.length - 1]) : null;

    return res.status(200).json({
      success: true,
      message: "Dropdown users fetched successfully",
      meta: {
        limit,
        hasNextPage,
        nextCursor,
        count: data.length,
      },
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dropdown users",
      error: err.message,
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const updateData = { ...req.body };

    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const uploadedImageUrl = await uploadProfileImageIfExists(req.file);

    if (uploadedImageUrl) {
      updateData.profileImage = uploadedImageUrl;
    }

    if (updateData.email) {
      updateData.email = normalizeEmail(updateData.email);

      const existingUser = await User.exists({
        email: updateData.email,
        _id: { $ne: id },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    if (updateData.name) updateData.name = normalizeString(updateData.name);
    if (updateData.phone) updateData.phone = normalizeString(updateData.phone);
    if (updateData.nid) updateData.nid = normalizeString(updateData.nid);

    if (updateData.lawRegNumber) {
      updateData.lawRegNumber = normalizeString(updateData.lawRegNumber);
    }

    if (updateData.specialization) {
      updateData.specialization = normalizeString(updateData.specialization);
    }

    if (updateData.bio) {
      updateData.bio = normalizeString(updateData.bio);
    }

    if (updateData.officeAddress) {
      updateData.officeAddress = normalizeString(updateData.officeAddress);
    }

    if (updateData.city) {
      updateData.city = normalizeString(updateData.city);
    }

    if (updateData.availability) {
      updateData.availability = normalizeString(updateData.availability);
    }

    if (updateData.experienceYears !== undefined) {
      updateData.experienceYears = clampNumber(updateData.experienceYears, 0, 80, 0);
    }

    if (updateData.consultationFee !== undefined) {
      updateData.consultationFee = normalizeNumber(updateData.consultationFee, 0);
    }

    if (updateData.rating !== undefined) {
      updateData.rating = clampNumber(updateData.rating, 0, 5, 0);
    }

    if (updateData.casesHandled !== undefined) {
      updateData.casesHandled = normalizeNumber(updateData.casesHandled, 0);
    }

    if (updateData.phoneVerified !== undefined) {
      updateData.phoneVerified = Number(updateData.phoneVerified) === 1 ? 1 : 0;
    }

    if (updateData.isVerifiedLawyer !== undefined) {
      updateData.isVerifiedLawyer =
        updateData.isVerifiedLawyer === true ||
        updateData.isVerifiedLawyer === "true";
    }

    if (updateData.profileCompleted !== undefined) {
      delete updateData.profileCompleted;
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const currentUser = await User.findById(id).lean();

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (currentUser.role === "lawyer" || updateData.role === "lawyer") {
      updateData.profileCompleted = isLawyerProfileComplete({
        ...currentUser,
        ...updateData,
      });

      if (updateData.isVerifiedLawyer === true && !updateData.profileCompleted) {
        return res.status(400).json({
          success: false,
          message:
            "Lawyer profile is incomplete. Complete profile before verification.",
        });
      }

      if (updateData.isVerifiedLawyer === true && updateData.phoneVerified !== 1) {
        const finalPhoneVerified =
          updateData.phoneVerified !== undefined
            ? updateData.phoneVerified
            : currentUser.phoneVerified;

        if (finalPhoneVerified !== 1) {
          return res.status(400).json({
            success: false,
            message:
              "Phone must be verified before lawyer can be approved.",
          });
        }
      }
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .select(safeUserSelect)
      .populate(subscriptionPopulate)
      .lean();

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: getSafeUserData(updatedUser),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: err.message,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    if (req.user?.id?.toString() === id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const deletedUser = await User.findByIdAndDelete(id).lean();

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: err.message,
    });
  }
};
export const updateMyProfile = async (req, res) => {
  try {
    if (req.user.role !== "client") {
      return res.status(403).json({
        success: false,
        message: "Only clients can update their own profile from this route",
      });
    }

    const allowedFields = [
      "name",
      "phone",
      "bio",
      "officeAddress",
      "city",
    ];

    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const uploadedImageUrl = await uploadProfileImageIfExists(req.file);

    if (uploadedImageUrl) {
      updateData.profileImage = uploadedImageUrl;
    }

    if (updateData.name !== undefined) {
      updateData.name = normalizeString(updateData.name);
    }

    if (updateData.phone !== undefined) {
      updateData.phone = normalizeString(updateData.phone);
    }

    if (updateData.bio !== undefined) {
      updateData.bio = normalizeString(updateData.bio);
    }

    if (updateData.officeAddress !== undefined) {
      updateData.officeAddress = normalizeString(updateData.officeAddress);
    }

    if (updateData.city !== undefined) {
      updateData.city = normalizeString(updateData.city);
    }

    if (!updateData.name && updateData.name !== undefined) {
      return res.status(400).json({
        success: false,
        message: "Name cannot be empty",
      });
    }

    if (!updateData.phone && updateData.phone !== undefined) {
      return res.status(400).json({
        success: false,
        message: "Phone cannot be empty",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    })
      .select(safeUserSelect)
      .populate(subscriptionPopulate)
      .lean();

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: getSafeUserData(updatedUser),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: err.message,
    });
  }
};