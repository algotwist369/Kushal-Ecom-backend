const crypto = require('crypto');

const slugify = (value) => {
    return value
        .toString()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
};

const buildUniqueSlug = async (model, value, documentId) => {
    let baseSlug = slugify(value);
    if (!baseSlug) {
        baseSlug = crypto.randomBytes(4).toString('hex');
    }

    let slug = baseSlug;
    let counter = 1;

    while (await slugExists(model, slug, documentId)) {
        slug = `${baseSlug}-${counter++}`;
    }

    return slug;
};

const slugExists = async (model, slug, documentId) => {
    if (!model) {
        return false;
    }

    const query = { slug };
    if (documentId) {
        query._id = { $ne: documentId };
    }

    const existing = await model.findOne(query).select('_id');
    return Boolean(existing);
};

module.exports = {
    slugify,
    buildUniqueSlug
};

