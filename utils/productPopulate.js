const PRODUCT_CART_SELECT_FIELDS =
    'name slug price discountPrice images stock freeProducts bundleWith offerText packOptions freeShipping shippingCost minOrderForFreeShipping category';

const getCartProductPopulateConfig = () => ({
    path: 'items.product',
    select: PRODUCT_CART_SELECT_FIELDS,
    populate: [
        {
            path: 'category',
            select: 'name slug'
        },
        {
            path: 'freeProducts.product',
            select: 'name slug images price discountPrice'
        },
        {
            path: 'bundleWith.product',
            select: 'name slug images price discountPrice'
        }
    ]
});

module.exports = {
    PRODUCT_CART_SELECT_FIELDS,
    getCartProductPopulateConfig
};

