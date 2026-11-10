export function notFound(req, res) {
  res
    .status(404)
    .json({
      success: false,
      message: `Route not found: ${req.method} ${req.path}`,
    });
}
export function errorHandler(err, req, res, next) {
  if (
    err?.type === "entity.parse.failed" ||
    (err instanceof SyntaxError && err.status === 400 && "body" in err)
  )
    return res.status(400).json({ success: false, message: "Request body contains malformed JSON" });
  if (err?.code === "P2002")
    return res
      .status(409)
      .json({
        success: false,
        message: "A record with this value already exists",
      });
  if (err?.code === "P2025")
    return res
      .status(404)
      .json({ success: false, message: "Record not found" });
  if (err?.code === "P2003")
    return res.status(409).json({
      success: false,
      message: "This operation conflicts with related records",
    });
  if (
    err?.name === "PrismaClientInitializationError" ||
    ["P1000", "P1001", "P1003"].includes(err?.code)
  ) {
    console.error("Database connection failed:", err.code || err.name);
    return res
      .status(503)
      .json({
        success: false,
        message:
          "Database is unavailable. Start PostgreSQL, confirm DATABASE_URL in backend/.env, and apply the Prisma migration.",
      });
  }
  if (
    err?.name === "MulterError" ||
    err?.message?.startsWith("Only PDF resumes")
  )
    return res.status(400).json({ success: false, message: err.message });
  if (err.status && err.status < 500)
    return res
      .status(err.status)
      .json({ success: false, message: err.message });
  console.error(err);
  res
    .status(err.status || 500)
    .json({
      success: false,
      message: err.status ? err.message : "Internal server error",
    });
}
