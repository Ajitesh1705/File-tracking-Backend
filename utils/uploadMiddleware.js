const multer = require('multer');
const { storage } = require('../utils/configCloudinary');

const upload = multer({ storage: storage });

module.exports = upload;

