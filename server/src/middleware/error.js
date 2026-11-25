import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

export function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, req, res, _next) {
  let status = err.statusCode || 500;
  let message = err.message || "Something went wrong.";
  let details = err.details || null;

  if (err.name === "ZodError") {
    status = 400;
    message = err.issues?.[0]?.message || "Validation failed.";
    details = err.issues?.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  }

  if (err.name === "CastError") {
    status = 404;
    message = "The requested resource was not found.";
  }

  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0] || "value";
    const friendly = {
      email: "An account with this email already exists.",
      phone: "An account with this phone number already exists.",
      username: "This username is already taken.",
      memberCode: "This member code is already in use.",
      slug: "An item with a similar title already exists.",
    };
    message = friendly[field] || "A duplicate record already exists.";
  }

  if (err.name === "MulterError") {
    status = 400;
    message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Image is too large. Maximum size is 5 MB."
        : "The file could not be uploaded.";
  }

  if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Invalid JSON in request body.";
  }

  if (status >= 500) {
    console.error("[ERROR]", err);
  }

  res.status(status).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(env.isProduction ? {} : { stack: status >= 500 ? err.stack : undefined }),
  });
}
