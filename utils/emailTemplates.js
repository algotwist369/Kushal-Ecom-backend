const formatCurrency = (value) => `₹${Number(value || 0).toFixed(2)}`;

const welcomeEmailTemplate = (name = 'Customer') => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f7f7f7; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #2c5530 0%, #3d7a42 100%); padding: 30px; color: #ffffff;">
      <h1 style="margin: 0;">Welcome to Prolific Healing Herbs</h1>
    </div>
    <div style="padding: 30px; color: #333333;">
      <p>Hi ${name},</p>
      <p>We’re delighted to have you in our community of wellness enthusiasts. Explore authentic Ayurvedic products curated to help you live healthier every day.</p>
      <p>Need help getting started? Reply to this email or visit your account dashboard.</p>
      <p style="margin-top: 30px;">Warm regards,<br/>Team Prolific Healing Herbs</p>
    </div>
  </div>
</body>
</html>
`;

const orderConfirmationTemplate = (order, user = {}) => {
    const itemsHtml = (order.items || [])
        .map(
            (item) => `
        <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #eeeeee;">${item.product?.name || 'Product'}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eeeeee;text-align:center;">${item.quantity}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eeeeee;text-align:right;">${formatCurrency(
                item.price
            )}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eeeeee;text-align:right;">${formatCurrency(
                item.price * item.quantity
            )}</td>
        </tr>`
        )
        .join('');

    return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f7f7f7; padding: 20px;">
  <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden;">
    <div style="background: #2c5530; padding: 30px; color: #ffffff;">
      <h2 style="margin: 0;">Order Confirmed!</h2>
      <p style="margin: 4px 0 0;">Order #${order._id.toString().slice(-8).toUpperCase()}</p>
    </div>
    <div style="padding: 30px; color: #333333;">
      <p>Hi ${user.name || order.shippingAddress?.fullName || 'Customer'},</p>
      <p>Thank you for placing an order with Prolific Healing Herbs. Here is a summary of your purchase:</p>

      <table style="width:100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background:#f0f5f1;">
            <th style="padding:8px 12px;text-align:left;">Item</th>
            <th style="padding:8px 12px;text-align:center;">Qty</th>
            <th style="padding:8px 12px;text-align:right;">Price</th>
            <th style="padding:8px 12px;text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="margin-top: 20px; text-align: right;">
        <p><strong>Subtotal:</strong> ${formatCurrency(order.totalAmount - order.shippingCost)}</p>
        <p><strong>Shipping:</strong> ${formatCurrency(order.shippingCost)}</p>
        <p><strong>Discount:</strong> -${formatCurrency(order.discount)}</p>
        <p style="font-size: 18px;"><strong>Grand Total:</strong> ${formatCurrency(order.finalAmount)}</p>
      </div>

      <p style="margin-top: 30px;">We will notify you when your order ships.</p>
      <p>Warm regards,<br/>Team Prolific Healing Herbs</p>
    </div>
  </div>
</body>
</html>
`;
};

const adminNotificationTemplate = (user) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden;">
    <div style="background: #1f2933; padding: 24px; color: #ffffff;">
      <h2 style="margin: 0;">New Customer Registered</h2>
    </div>
    <div style="padding: 24px; color: #333333;">
      <p>A new user has just registered on the store.</p>
      <ul>
        <li><strong>Name:</strong> ${user?.name || 'N/A'}</li>
        <li><strong>Email:</strong> ${user?.email || 'N/A'}</li>
        <li><strong>Phone:</strong> ${user?.phone || 'N/A'}</li>
      </ul>
      <p>Please review the account in the admin dashboard if needed.</p>
    </div>
  </div>
</body>
</html>
`;

const renderOrderItemsList = (order) =>
    (order.items || [])
        .map(
            (item) =>
                `<li>${item.product?.name || 'Product'} × ${item.quantity} — <strong>${formatCurrency(
                    item.price * item.quantity
                )}</strong></li>`
        )
        .join('');

const adminNewOrderNotificationTemplate = (order, user) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background:#fafafa; padding:20px;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;">
    <div style="background:#0f172a;padding:24px;color:#ffffff;">
      <h2 style="margin:0;">🛒 New Order Placed</h2>
      <p style="margin:4px 0 0;">Order #${order._id.toString().slice(-8).toUpperCase()} | ${new Date(
    order.createdAt
).toLocaleString('en-IN')}</p>
    </div>
    <div style="padding:24px;color:#111827;">
      <p><strong>Customer:</strong> ${user?.name || order.shippingAddress?.fullName || 'Customer'} (${
    user?.email || order.shippingAddress?.email || 'N/A'
})</p>
      <p><strong>Total:</strong> ${formatCurrency(order.finalAmount)} | <strong>Payment:</strong> ${order.paymentMethod.toUpperCase()}</p>
      <p style="margin-top:16px;"><strong>Items:</strong></p>
      <ul>
        ${renderOrderItemsList(order)}
      </ul>
      <p style="margin-top:24px;">Visit the admin panel to process this order.</p>
    </div>
  </div>
</body>
</html>
`;

const orderStatusUpdateTemplate = (order, user, status) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background:#f5f5f5; padding: 20px;">
  <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;">
    <div style="background:#2563eb;padding:24px;color:#ffffff;">
      <h2 style="margin:0;">Order Status Updated</h2>
      <p style="margin:4px 0 0;">Order #${order._id.toString().slice(-8).toUpperCase()}</p>
    </div>
    <div style="padding:24px;color:#111827;">
      <p>Hi ${user?.name || 'there'},</p>
      <p>Your order status has been updated to <strong>${status.toUpperCase()}</strong>.</p>
      <p>You can track your order progress from the My Orders section.</p>
      <p style="margin-top:30px;">Warm regards,<br/>Team Prolific Healing Herbs</p>
    </div>
  </div>
</body>
</html>
`;

const orderDeliveredWishesTemplate = (order, user) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background:#fef9f5; padding: 20px;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;">
    <div style="background:#16a34a;padding:24px;color:#ffffff;">
      <h2 style="margin:0;">🎉 Your Order Has Arrived!</h2>
    </div>
    <div style="padding:24px;color:#1f2937;">
      <p>Dear ${user?.name || 'Customer'},</p>
      <p>We hope you love your purchase! If you have any feedback or need assistance, we are just an email away.</p>
      <p style="margin-top:24px;">Stay well,<br/>Team Prolific Healing Herbs</p>
    </div>
  </div>
</body>
</html>
`;

const adminOrderCancelledNotificationTemplate = (order, user, reason) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background:#fef2f2; padding: 20px;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;">
    <div style="background:#b91c1c;padding:24px;color:#ffffff;">
      <h2 style="margin:0;">⚠️ Order Cancelled by Customer</h2>
      <p style="margin:4px 0 0;">Order #${order._id.toString().slice(-8).toUpperCase()}</p>
    </div>
    <div style="padding:24px;color:#111827;">
      <p><strong>Customer:</strong> ${user?.name || 'Customer'} (${user?.email || 'N/A'})</p>
      <p><strong>Reason:</strong> ${reason || 'Not specified'}</p>
      <p style="margin-top:16px;"><strong>Items:</strong></p>
      <ul>${renderOrderItemsList(order)}</ul>
      <p style="margin-top:24px;">The inventory has been restored automatically. Review and follow up if required.</p>
    </div>
  </div>
</body>
</html>
`;

module.exports = {
    welcomeEmailTemplate,
    orderConfirmationTemplate,
    adminNotificationTemplate,
    adminNewOrderNotificationTemplate,
    orderStatusUpdateTemplate,
    orderDeliveredWishesTemplate,
    adminOrderCancelledNotificationTemplate
};

