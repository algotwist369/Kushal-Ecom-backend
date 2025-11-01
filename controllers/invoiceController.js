const { generateInvoice } = require('../utils/invoiceTemplate');
const Order = require('../models/Order');
const { handleAsync } = require('../utils/handleAsync');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

// Download invoice PDF
const downloadInvoice = handleAsync(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('user', 'name email phone')
        .populate('items.product', 'name');
    
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization - user can only download their own invoice, admin can download any
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to download this invoice' });
    }

    const invoiceFileName = `invoice_${order._id}.pdf`;
    const invoicePath = path.join(__dirname, '../uploads/invoices', invoiceFileName);

    try {
        // Generate invoice PDF
        await generateInvoice(order, invoicePath);
        
        // Save invoice path to order
        order.invoicePath = invoicePath;
        await order.save();

        // Send file for download
        res.download(invoicePath, `Invoice_${order._id.toString().slice(-8).toUpperCase()}.pdf`, (err) => {
            if (err) {
                console.error('Error downloading invoice:', err);
                if (!res.headersSent) {
                    res.status(500).json({ message: 'Error downloading invoice' });
                }
            }
        });
    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).json({ message: 'Error generating invoice', error: error.message });
    }
});

// Send invoice via email with attachment
const sendInvoiceEmail = async (order) => {
    try {
        const invoiceFileName = `invoice_${order._id}.pdf`;
        const invoicePath = path.join(__dirname, '../uploads/invoices', invoiceFileName);

        // Generate invoice if it doesn't exist
        if (!fs.existsSync(invoicePath)) {
            await generateInvoice(order, invoicePath);
            order.invoicePath = invoicePath;
            await order.save();
        }

        // Create email transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const invoiceEmailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .header { background: linear-gradient(135deg, #2c5530 0%, #3d7a42 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; background: white; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 12px 30px; background: #2c5530; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .invoice-info { background: #f9f9f9; padding: 20px; border-left: 4px solid #2c5530; margin: 20px 0; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📄 Your Invoice is Ready!</h1>
        </div>
        <div class="content">
            <h2>Hello ${order.user?.name || 'Valued Customer'},</h2>
            <p>Thank you for your order! Your invoice for Order #${order._id.toString().slice(-8).toUpperCase()} is attached to this email.</p>
            
            <div class="invoice-info">
                <h3 style="margin-top: 0; color: #2c5530;">Order Summary:</h3>
                <p><strong>Order ID:</strong> #${order._id.toString().slice(-8).toUpperCase()}</p>
                <p><strong>Invoice Number:</strong> INV-${order._id.toString().slice(-8).toUpperCase()}</p>
                <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                <p><strong>Total Amount:</strong> ₹${order.finalAmount.toFixed(2)}</p>
                <p><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
                <p><strong>Payment Status:</strong> ${order.paymentStatus.toUpperCase()}</p>
            </div>
            
            <p>Please find your detailed invoice attached as a PDF file. You can also download it anytime from your order details page.</p>
            
            <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>📌 Note:</strong> Please keep this invoice for your records. You may need it for warranty claims or returns.</p>
            </div>
            
            <p>If you have any questions about your invoice or order, please don't hesitate to contact our support team.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <p style="color: #666;">Thank you for shopping with us! 🌿</p>
            </div>
        </div>
        <div class="footer">
            <p style="font-weight: bold;">Prolific Healing Herbs</p>
            <p>© 2024 Prolific Healing Herbs. All rights reserved.</p>
            <p>📧 support@ayurvedicstore.com | 📞 +91-XXXXXXXXXX</p>
        </div>
    </div>
</body>
</html>
        `;

        // Send email with attachment
        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: order.user.email,
            subject: `📄 Invoice for Order #${order._id.toString().slice(-8).toUpperCase()} - Prolific Healing Herbs`,
            html: invoiceEmailHtml,
            attachments: [
                {
                    filename: `Invoice_${order._id.toString().slice(-8).toUpperCase()}.pdf`,
                    path: invoicePath
                }
            ]
        });

        console.log(`✅ Invoice email sent to ${order.user.email} for order ${order._id}`);
        return true;
    } catch (error) {
        console.error('Error sending invoice email:', error);
        throw error;
    }
};

module.exports = { 
    downloadInvoice,
    sendInvoiceEmail
};