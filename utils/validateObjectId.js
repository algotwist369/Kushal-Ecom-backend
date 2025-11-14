const mongoose = require('mongoose');

const validateObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

module.exports = validateObjectId;

