import mongoose from "mongoose";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Connection from "../models/connection.model.js";
import {
  getActiveSubscription,
  getNumericFeatureValue,
} from "../utils/subscription.utils.js";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const sanitizeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

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
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8")
    );

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

const buildPostFilter = (query = {}, defaultStatus = null) => {
  const {
    category,
    urgency,
    status,
    division,
    district,
    minBudget,
    maxBudget,
    search,
    client,
  } = query;

  const filter = {};

  if (defaultStatus && !status) filter.status = defaultStatus;
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (urgency) filter.urgency = urgency;
  if (division) filter.division = division;
  if (district) filter.district = district;

  if (client && isValidObjectId(client)) {
    filter.client = client;
  }

  if (minBudget !== undefined && minBudget !== "") {
    filter.budgetMax = {
      ...(filter.budgetMax || {}),
      $gte: sanitizeNumber(minBudget),
    };
  }

  if (maxBudget !== undefined && maxBudget !== "") {
    filter.budgetMin = {
      ...(filter.budgetMin || {}),
      $lte: sanitizeNumber(maxBudget),
    };
  }

  if (search?.trim()) {
    filter.$or = [
      { title: { $regex: search.trim(), $options: "i" } },
      { description: { $regex: search.trim(), $options: "i" } },
    ];
  }

  return filter;
};

const populatePostQuery = (query) => {
  return query
    .populate("client", "name email phone role subscriptionStatus currentSubscription")
    .populate("selectedLawyer", "name email phone role lawRegNumber")
    .populate("bids.lawyer", "name email phone role lawRegNumber");
};

const fetchPostsWithCursor = async ({
  filter = {},
  cursor,
  limit,
  sort = { createdAt: -1, _id: -1 },
}) => {
  const safeLimit = normalizeLimit(limit);
  const cursorFilter = getCursorFilter(cursor);

  const finalFilter = Object.keys(cursorFilter).length
    ? { $and: [filter, cursorFilter] }
    : filter;

  const docs = await populatePostQuery(
    Post.find(finalFilter).sort(sort).limit(safeLimit + 1)
  );

  const hasNextPage = docs.length > safeLimit;
  const data = hasNextPage ? docs.slice(0, safeLimit) : docs;
  const nextCursor = hasNextPage ? encodeCursor(data[data.length - 1]) : null;

  return {
    data,
    meta: {
      limit: safeLimit,
      hasNextPage,
      nextCursor,
    },
  };
};

const ensurePostExists = async (id) => Post.findById(id);

const ensureClientOwnerOrAdmin = (req, post) => {
  return (
    req.user?.role === "admin" ||
    post.client?.toString() === req.user?.id?.toString()
  );
};

const normalizeDocuments = (documents) => {
  if (Array.isArray(documents)) {
    return documents.map((doc) => String(doc).trim()).filter(Boolean);
  }

  if (typeof documents === "string") {
    return documents
      .split(",")
      .map((doc) => doc.trim())
      .filter(Boolean);
  }

  return [];
};

const validateClientUser = async (clientId) => {
  if (!clientId || !isValidObjectId(clientId)) {
    return { valid: false, status: 400, message: "Invalid client id" };
  }

  const client = await User.findOne({
    _id: clientId,
    role: "client",
  }).select("_id role");

  if (!client) {
    return { valid: false, status: 404, message: "Client not found" };
  }

  return { valid: true, client };
};

export const createPost = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      budgetMin,
      budgetMax,
      urgency,
      division,
      district,
      documents,
      isPriority,
      expiresAt,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    const activeSubscription = await getActiveSubscription(req.user.id);

    if (!activeSubscription && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Active subscription required to create post",
      });
    }

    if (req.user.role === "client") {
      const casePostLimit = await getNumericFeatureValue(
        req.user.id,
        "case_post_limit",
        0
      );

      if (casePostLimit <= 0) {
        return res.status(403).json({
          success: false,
          message: "Your plan does not allow case posting",
        });
      }

      const usedPosts = await Post.countDocuments({
        client: req.user.id,
        createdAt: {
          $gte: activeSubscription.startDate,
          $lte: activeSubscription.endDate,
        },
      });

      if (usedPosts >= casePostLimit) {
        return res.status(403).json({
          success: false,
          message: "Case post limit reached. Please upgrade your plan.",
          limit: casePostLimit,
          used: usedPosts,
        });
      }
    }

    const post = await Post.create({
      client: req.user.id,
      title,
      description,
      category,
      budgetMin: sanitizeNumber(budgetMin),
      budgetMax: sanitizeNumber(budgetMax),
      urgency,
      division,
      district,
      documents: normalizeDocuments(documents),
      isPriority: Number(isPriority) === 1 ? 1 : 0,
      expiresAt: expiresAt || null,
      status: "open",
    });

    const result = await populatePostQuery(Post.findById(post._id));

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllPosts = async (req, res, next) => {
  try {
    const filter = buildPostFilter(req.query, "open");

    const result = await fetchPostsWithCursor({
      filter,
      cursor: req.query.cursor,
      limit: req.query.limit,
      sort: { createdAt: -1, _id: -1 },
    });

    return res.status(200).json({
      success: true,
      message: "Posts fetched successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getSinglePost = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post id",
      });
    }

    const post = await populatePostQuery(Post.findById(id));

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Post fetched successfully",
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyPosts = async (req, res, next) => {
  try {
    const result = await fetchPostsWithCursor({
      filter: { client: req.user.id },
      cursor: req.query.cursor,
      limit: req.query.limit,
      sort: { createdAt: -1, _id: -1 },
    });

    return res.status(200).json({
      success: true,
      message: "My posts fetched successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePost = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post id",
      });
    }

    const post = await ensurePostExists(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (!ensureClientOwnerOrAdmin(req, post)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this post",
      });
    }

    if (req.user.role !== "admin" && post.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Only open posts can be updated",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "category",
      "budgetMin",
      "budgetMax",
      "urgency",
      "division",
      "district",
      "documents",
      "isPriority",
      "expiresAt",
      "status",
      "selectedLawyer",
      "acceptedBid",
    ];

    if (req.user.role === "admin") {
      allowedFields.push("client");
    }

    if (req.body.client !== undefined && req.user.role === "admin") {
      const clientValidation = await validateClientUser(req.body.client);

      if (!clientValidation.valid) {
        return res.status(clientValidation.status).json({
          success: false,
          message: clientValidation.message,
        });
      }
    }

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "documents") {
          post[field] = normalizeDocuments(req.body[field]);
        } else if (["budgetMin", "budgetMax"].includes(field)) {
          post[field] = sanitizeNumber(req.body[field]);
        } else if (field === "isPriority") {
          post[field] = Number(req.body[field]) === 1 ? 1 : 0;
        } else if (field === "expiresAt") {
          post[field] = req.body[field] || null;
        } else {
          post[field] = req.body[field];
        }
      }
    });

    await post.save();

    const updatedPost = await populatePostQuery(Post.findById(post._id));

    return res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: updatedPost,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post id",
      });
    }

    const post = await ensurePostExists(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (!ensureClientOwnerOrAdmin(req, post)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this post",
      });
    }

    await Post.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const placeBid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { proposedFee, message, estimatedDays } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post id",
      });
    }

    if (!proposedFee || !message || !estimatedDays) {
      return res.status(400).json({
        success: false,
        message: "proposedFee, message and estimatedDays are required",
      });
    }

    const lawyer = await User.findOne({
      _id: req.user.id,
      role: "lawyer",
    }).select("_id role subscriptionStatus currentSubscription");

    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: "Lawyer not found",
      });
    }

    const activeSubscription = await getActiveSubscription(req.user.id);

    if (!activeSubscription) {
      return res.status(403).json({
        success: false,
        message: "Active subscription required to send proposal",
      });
    }

    const post = await ensurePostExists(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Bids can only be placed on open posts",
      });
    }

    if (post.client.toString() === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot bid on your own post",
      });
    }

    const acceptedConnection = await Connection.findOne({
      post: post._id,
      client: post.client,
      lawyer: req.user.id,
      status: "accepted",
    });

    if (!acceptedConnection) {
      return res.status(403).json({
        success: false,
        message:
          "Client must accept your connection request before you can send proposal",
      });
    }

    const proposalLimit = await getNumericFeatureValue(
      req.user.id,
      "proposal_limit",
      0
    );

    if (proposalLimit <= 0) {
      return res.status(403).json({
        success: false,
        message: "Your plan does not allow proposal sending",
      });
    }

    const usedProposalsPipeline = await Post.aggregate([
      { $unwind: "$bids" },
      {
        $match: {
          "bids.lawyer": new mongoose.Types.ObjectId(req.user.id),
          "bids.createdAt": {
            $gte: activeSubscription.startDate,
            $lte: activeSubscription.endDate,
          },
        },
      },
      { $count: "total" },
    ]);

    const usedProposals = usedProposalsPipeline[0]?.total || 0;

    if (usedProposals >= proposalLimit) {
      return res.status(403).json({
        success: false,
        message: "Proposal limit reached. Please upgrade your plan.",
        limit: proposalLimit,
        used: usedProposals,
      });
    }

    const alreadyBid = post.bids.find(
      (bid) => bid.lawyer.toString() === req.user.id.toString()
    );

    if (alreadyBid) {
      return res.status(400).json({
        success: false,
        message: "You already placed a bid on this post",
      });
    }

    post.bids.push({
      lawyer: req.user.id,
      proposedFee: sanitizeNumber(proposedFee),
      message,
      estimatedDays: sanitizeNumber(estimatedDays, 1),
    });

    await post.save();

    const updatedPost = await populatePostQuery(Post.findById(post._id));

    return res.status(200).json({
      success: true,
      message: "Proposal sent successfully",
      data: updatedPost,
    });
  } catch (error) {
    next(error);
  }
};

export const withdrawBid = async (req, res, next) => {
  try {
    const { id, bidId } = req.params;

    if (!isValidObjectId(id) || !isValidObjectId(bidId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post id or bid id",
      });
    }

    const post = await ensurePostExists(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const bid = post.bids.id(bidId);

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      });
    }

    if (bid.lawyer.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to withdraw this bid",
      });
    }

    if (bid.status === "accepted") {
      return res.status(400).json({
        success: false,
        message: "Accepted bid cannot be withdrawn",
      });
    }

    bid.status = "withdrawn";
    await post.save();

    const updatedPost = await populatePostQuery(Post.findById(post._id));

    return res.status(200).json({
      success: true,
      message: "Bid withdrawn successfully",
      data: updatedPost,
    });
  } catch (error) {
    next(error);
  }
};

export const acceptBid = async (req, res, next) => {
  try {
    const { id, bidId } = req.params;

    if (!isValidObjectId(id) || !isValidObjectId(bidId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post id or bid id",
      });
    }

    const post = await ensurePostExists(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (!ensureClientOwnerOrAdmin(req, post)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to accept a bid on this post",
      });
    }

    if (post.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Only open posts can accept bids",
      });
    }

    const bid = post.bids.id(bidId);

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      });
    }

    if (bid.status === "withdrawn") {
      return res.status(400).json({
        success: false,
        message: "Withdrawn bid cannot be accepted",
      });
    }

    post.bids.forEach((item) => {
      if (item._id.toString() === bidId) {
        item.status = "accepted";
      } else if (item.status !== "withdrawn") {
        item.status = "rejected";
      }
    });

    post.selectedLawyer = bid.lawyer;
    post.acceptedBid = bid._id;
    post.status = "in_progress";

    await post.save();

    const updatedPost = await populatePostQuery(Post.findById(post._id));

    return res.status(200).json({
      success: true,
      message: "Bid accepted successfully",
      data: updatedPost,
    });
  } catch (error) {
    next(error);
  }
};

export const closePost = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post id",
      });
    }

    const post = await ensurePostExists(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (!ensureClientOwnerOrAdmin(req, post)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to close this post",
      });
    }

    post.status = "closed";
    await post.save();

    const updatedPost = await populatePostQuery(Post.findById(post._id));

    return res.status(200).json({
      success: true,
      message: "Post closed successfully",
      data: updatedPost,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelPost = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post id",
      });
    }

    const post = await ensurePostExists(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (!ensureClientOwnerOrAdmin(req, post)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to cancel this post",
      });
    }

    if (post.status === "closed") {
      return res.status(400).json({
        success: false,
        message: "Closed post cannot be cancelled",
      });
    }

    post.status = "cancelled";
    await post.save();

    const updatedPost = await populatePostQuery(Post.findById(post._id));

    return res.status(200).json({
      success: true,
      message: "Post cancelled successfully",
      data: updatedPost,
    });
  } catch (error) {
    next(error);
  }
};

/* -------------------------------------------------------------------------- */
/*                               ADMIN CONTROLLERS                            */
/* -------------------------------------------------------------------------- */

export const adminGetAllPosts = async (req, res, next) => {
  try {
    const filter = buildPostFilter(req.query);

    const result = await fetchPostsWithCursor({
      filter,
      cursor: req.query.cursor,
      limit: req.query.limit,
      sort: { createdAt: -1, _id: -1 },
    });

    return res.status(200).json({
      success: true,
      message: "Admin fetched all posts successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const adminGetSinglePost = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post id",
      });
    }

    const post = await populatePostQuery(Post.findById(id));

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Admin fetched single post successfully",
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

export const adminCreatePost = async (req, res, next) => {
  try {
    const {
      client,
      title,
      description,
      category,
      budgetMin,
      budgetMax,
      urgency,
      division,
      district,
      documents,
      isPriority,
      expiresAt,
      selectedLawyer,
      acceptedBid,
    } = req.body;

    if (!client || !title || !description) {
      return res.status(400).json({
        success: false,
        message: "client, title and description are required",
      });
    }

    const clientValidation = await validateClientUser(client);

    if (!clientValidation.valid) {
      return res.status(clientValidation.status).json({
        success: false,
        message: clientValidation.message,
      });
    }

    if (selectedLawyer && !isValidObjectId(selectedLawyer)) {
      return res.status(400).json({
        success: false,
        message: "Invalid selected lawyer id",
      });
    }

    if (acceptedBid && !isValidObjectId(acceptedBid)) {
      return res.status(400).json({
        success: false,
        message: "Invalid accepted bid id",
      });
    }

    const post = await Post.create({
      client,
      title,
      description,
      category,
      budgetMin: sanitizeNumber(budgetMin),
      budgetMax: sanitizeNumber(budgetMax),
      urgency,
      division,
      district,
      documents: normalizeDocuments(documents),
      isPriority: Number(isPriority) === 1 ? 1 : 0,
      expiresAt: expiresAt || null,
      status: "open",
      selectedLawyer: selectedLawyer || null,
      acceptedBid: acceptedBid || null,
    });

    const result = await populatePostQuery(Post.findById(post._id));

    return res.status(201).json({
      success: true,
      message: "Admin created post successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const adminUpdatePost = async (req, res, next) => {
  return updatePost(req, res, next);
};

export const adminDeletePost = async (req, res, next) => {
  return deletePost(req, res, next);
};