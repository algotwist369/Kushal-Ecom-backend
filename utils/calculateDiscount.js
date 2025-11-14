const calculateDiscount = ({ amount, discountType, discountValue, maxDiscountAmount }) => {
    if (!Number.isFinite(amount) || amount <= 0) {
        return 0;
    }

    if (!Number.isFinite(discountValue) || discountValue <= 0) {
        return 0;
    }

    let discount = 0;

    if (discountType === 'percentage') {
        discount = (amount * discountValue) / 100;
    } else {
        discount = discountValue;
    }

    if (Number.isFinite(maxDiscountAmount) && maxDiscountAmount > 0) {
        discount = Math.min(discount, maxDiscountAmount);
    }

    return Math.max(0, Math.min(discount, amount));
};

module.exports = calculateDiscount;

