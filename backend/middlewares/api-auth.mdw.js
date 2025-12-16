export function isApiAuth(req, res, next) {
  if(!req.header('apiKey') || req.header('apiKey') !== '12345ABCDE') {
    return res.status(401).json({
      result_code: -401, // unauthorized
      result_message: 'Unauthorized access'
    });
  }

  next();
}