import { ApiError } from "../utils/ApiError.js";

export function validate(schema, source = "body") {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return next(
        new ApiError(400, issues[0]?.message || "Please check the submitted information.", issues)
      );
    }
    req[source] = result.data;
    next();
  };
}
