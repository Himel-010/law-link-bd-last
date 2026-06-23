import mongoose from "mongoose";
import Contact, {
  CONTACT_STATUS,
  CONTACT_URGENCY,
} from "../models/contact.model.js";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeString = (value = "") => String(value || "").trim();

const normalizeEmail = (email = "") =>
  String(email || "").toLowerCase().trim();

const normalizeLimit = (limit = DEFAULT_LIMIT) => {
  const safeLimit = Math.max(Number(limit) || DEFAULT_LIMIT, 1);
  return Math.min(safeLimit, MAX_LIMIT);
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

const getClientIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.socket?.remoteAddress || "";
};

const buildContactFilter = (query = {}) => {
  const {
    search = "",
    status = "all",
    urgency = "all",
    fromDate,
    toDate,
  } = query;

  const filter = {};

  if (status !== "all") {
    filter.status = status;
  }

  if (urgency !== "all") {
    filter.urgency = urgency;
  }

  if (fromDate || toDate) {
    filter.createdAt = {};

    if (fromDate) {
      const start = new Date(fromDate);

      if (!Number.isNaN(start.getTime())) {
        filter.createdAt.$gte = start;
      }
    }

    if (toDate) {
      const end = new Date(toDate);

      if (!Number.isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    if (!Object.keys(filter.createdAt).length) {
      delete filter.createdAt;
    }
  }

  if (search.trim()) {
    const keyword = search.trim();

    filter.$or = [
      { name: { $regex: keyword, $options: "i" } },
      { email: { $regex: keyword, $options: "i" } },
      { phone: { $regex: keyword, $options: "i" } },
      { subject: { $regex: keyword, $options: "i" } },
      { message: { $regex: keyword, $options: "i" } },
    ];
  }

  return filter;
};

const buildContactSort = (sortBy = "newest") => {
  switch (sortBy) {
    case "oldest":
      return {
        createdAt: 1,
        _id: 1,
      };

    case "urgency":
      return {
        urgency: 1,
        createdAt: -1,
        _id: -1,
      };

    default:
      return {
        createdAt: -1,
        _id: -1,
      };
  }
};

const sanitizeContactPayload = (body = {}) => {
  const payload = {
    name: normalizeString(body.name),
    email: normalizeEmail(body.email),
    phone: normalizeString(body.phone),
    subject: normalizeString(body.subject),
    message: normalizeString(body.message),
    urgency: normalizeString(body.urgency || "normal"),
  };

  if (!CONTACT_URGENCY.includes(payload.urgency)) {
    payload.urgency = "normal";
  }

  return payload;
};

export const createContactMessage = async (req, res) => {
  try {
    const payload = sanitizeContactPayload(req.body);

    if (!payload.name || !payload.email || !payload.subject || !payload.message) {
      return res.status(400).json({
        success: false,
        message: "Name, email, subject and message are required",
      });
    }

    const contact = await Contact.create({
      ...payload,
      ipAddress: getClientIp(req),
      userAgent: req.headers["user-agent"] || "",
    });

    return res.status(201).json({
      success: true,
      message: "Message sent successfully. Admin will review it soon.",
      data: contact,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to send contact message",
      error: err.message,
    });
  }
};

export const getAllContactMessages = async (req, res) => {
  try {
    const { cursor, sortBy = "newest" } = req.query;

    const limit = normalizeLimit(req.query.limit);
    const filter = buildContactFilter(req.query);
    const cursorFilter = getCursorFilter(cursor);

    const finalFilter = Object.keys(cursorFilter).length
      ? { $and: [filter, cursorFilter] }
      : filter;

    const contacts = await Contact.find(finalFilter)
      .populate("handledBy", "name email role")
      .sort(buildContactSort(sortBy))
      .limit(limit + 1)
      .lean();

    const hasNextPage = contacts.length > limit;
    const data = hasNextPage ? contacts.slice(0, limit) : contacts;
    const nextCursor = hasNextPage ? encodeCursor(data[data.length - 1]) : null;

    return res.status(200).json({
      success: true,
      message: "Contact messages fetched successfully",
      meta: {
        limit,
        count: data.length,
        hasNextPage,
        nextCursor,
      },
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch contact messages",
      error: err.message,
    });
  }
};

export const getContactMessageById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact message id",
      });
    }

    const contact = await Contact.findById(id)
      .populate("handledBy", "name email role")
      .lean();

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contact message fetched successfully",
      data: contact,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch contact message",
      error: err.message,
    });
  }
};

export const updateContactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, urgency, adminNote } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact message id",
      });
    }

    const updateData = {};

    if (status !== undefined) {
      const normalizedStatus = normalizeString(status);

      if (!CONTACT_STATUS.includes(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Allowed: ${CONTACT_STATUS.join(", ")}`,
        });
      }

      updateData.status = normalizedStatus;

      if (normalizedStatus === "replied") {
        updateData.repliedAt = new Date();
      }

      if (normalizedStatus === "closed") {
        updateData.closedAt = new Date();
      }

      if (["new", "read"].includes(normalizedStatus)) {
        updateData.closedAt = null;
      }
    }

    if (urgency !== undefined) {
      const normalizedUrgency = normalizeString(urgency);

      if (!CONTACT_URGENCY.includes(normalizedUrgency)) {
        return res.status(400).json({
          success: false,
          message: `Invalid urgency. Allowed: ${CONTACT_URGENCY.join(", ")}`,
        });
      }

      updateData.urgency = normalizedUrgency;
    }

    if (adminNote !== undefined) {
      updateData.adminNote = normalizeString(adminNote);
    }

    updateData.handledBy = req.user.id;

    const updatedContact = await Contact.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("handledBy", "name email role")
      .lean();

    if (!updatedContact) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contact message updated successfully",
      data: updatedContact,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update contact message",
      error: err.message,
    });
  }
};

export const markContactAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact message id",
      });
    }

    const updatedContact = await Contact.findByIdAndUpdate(
      id,
      {
        status: "read",
        handledBy: req.user.id,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("handledBy", "name email role")
      .lean();

    if (!updatedContact) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contact message marked as read",
      data: updatedContact,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to mark contact message as read",
      error: err.message,
    });
  }
};

export const deleteContactMessage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact message id",
      });
    }

    const deletedContact = await Contact.findByIdAndDelete(id).lean();

    if (!deletedContact) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contact message deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete contact message",
      error: err.message,
    });
  }
};

export const getContactStats = async (req, res) => {
  try {
    const [statusStats, urgencyStats, totalMessages] = await Promise.all([
      Contact.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      Contact.aggregate([
        {
          $group: {
            _id: "$urgency",
            count: { $sum: 1 },
          },
        },
      ]),

      Contact.countDocuments(),
    ]);

    const byStatus = CONTACT_STATUS.reduce((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {});

    const byUrgency = CONTACT_URGENCY.reduce((acc, urgency) => {
      acc[urgency] = 0;
      return acc;
    }, {});

    statusStats.forEach((item) => {
      byStatus[item._id] = item.count;
    });

    urgencyStats.forEach((item) => {
      byUrgency[item._id] = item.count;
    });

    return res.status(200).json({
      success: true,
      message: "Contact stats fetched successfully",
      data: {
        totalMessages,
        byStatus,
        byUrgency,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch contact stats",
      error: err.message,
    });
  }
};