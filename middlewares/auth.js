const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

module.exports = (req, res, next) => {
  const { authorization } = req.headers;
  debugger;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).send({ message: 'Authorization required' });
  }

  const token = authorization.replace('Bearer ', '');
  // console.log('token', token);
  let payload;

  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
    // console.log(payload);
  } catch (err) {
    return res.status(401).send({ message: 'Authorization required' });
  }

  req.user = payload;
  // console.log(req.user._id);

  return next();
};
