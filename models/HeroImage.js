const mongoose = require('mongoose');

const heroImageSchema = new mongoose.Schema({
    data: [
        {
            large_image: String,
            mobile_image: String,
            product_url: String
        }
    ]
})

module.exports = mongoose.model('HeroImage', heroImageSchema);