import express from "express";
import cors from "cors";

import userRoutes from "./routes/user.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import postRoutes from "./routes/post.route.js";
import planRoutes from "./routes/plan.route.js";
import connectionRoutes from "./routes/connection.routes.js";
import adminOverviewRoutes from "./routes/adminOverview.routes.js";
import consultationBookingRoutes from "./routes/consultationBooking.routes.js";
import lawyerAvailabilityRoutes from "./routes/lawyerAvailability.routes.js";
import contactRoutes from "./routes/contact.routes.js";


const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173","http://localhost:5174", "https://lawlink-bd.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("API running ✅");
});


app.use("/api/contact", contactRoutes);
app.use("/api/lawyer-availability", lawyerAvailabilityRoutes);
app.use("/api/bookings", consultationBookingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/admin/overview", adminOverviewRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

export { app };