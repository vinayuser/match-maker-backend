/**
 * Express middleware: attaches res.success / res.error (same shape as typical app APIs).
 */
module.exports = function responsesMiddleware() {
  return (req, res, next) => {
    res.success = (message, data, status = 1) => {
      return res.status(200).json({
        statusCode: 200,
        message: message || "Success",
        data: data !== undefined ? data : {},
        status
      });
    };

    res.error = (code, message, data) => {
      const http = typeof code === "number" && code >= 400 && code < 600 ? code : 400;
      return res.status(http).json({
        statusCode: http,
        message: message || "Error",
        data: data !== undefined ? data : {},
        status: 0
      });
    };

    next();
  };
};
