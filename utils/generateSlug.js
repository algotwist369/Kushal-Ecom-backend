const generateSlug = (text) => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

const generateUniqueSlug = async (Model, text, excludeId = null) => {
    let baseSlug = generateSlug(text);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
        const query = { slug };
        if (excludeId) {
            query._id = { $ne: excludeId };
        }
        
        const existing = await Model.findOne(query);
        if (!existing) {
            return slug;
        }
        
        slug = `${baseSlug}-${counter}`;
        counter++;
    }
};

module.exports = { generateSlug, generateUniqueSlug };
