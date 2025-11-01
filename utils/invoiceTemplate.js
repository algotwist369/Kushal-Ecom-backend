const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateInvoice = (order, filePath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            
            // Ensure directory exists
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Header
            doc.fontSize(24)
               .fillColor('#2c5530')
               .text('INVOICE', { align: 'center' })
               .moveDown();

            // Company Info
            doc.fontSize(10)
               .fillColor('#333333')
               .text('Prolific Healing Herbs', { align: 'center' })
               .text('Premium Ayurvedic Products', { align: 'center' })
               .text('Email: support@ayurvedicstore.com | Phone: +91-XXXXXXXXXX', { align: 'center' })
               .moveDown(2);

            // Invoice Details
            const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            doc.fontSize(10);
            doc.text(`Invoice Number: INV-${order._id.toString().slice(-8).toUpperCase()}`, 50, doc.y);
            doc.text(`Order ID: #${order._id.toString().slice(-8).toUpperCase()}`);
            doc.text(`Invoice Date: ${invoiceDate}`);
            doc.text(`Order Date: ${new Date(order.createdAt).toLocaleString('en-IN')}`);
            doc.moveDown();

            // Customer Details
            doc.fontSize(12)
               .fillColor('#2c5530')
               .text('Bill To:', 50, doc.y)
               .fillColor('#333333')
               .fontSize(10);

            doc.text(order.user?.name || 'Customer', 50, doc.y);
            if (order.user?.email) doc.text(order.user.email);
            if (order.user?.phone || order.shippingAddress?.phone) {
                doc.text(`Phone: ${order.user?.phone || order.shippingAddress?.phone}`);
            }
            doc.moveDown();

            // Shipping Address
            if (order.shippingAddress) {
                doc.fontSize(12)
                   .fillColor('#2c5530')
                   .text('Ship To:', 50, doc.y)
                   .fillColor('#333333')
                   .fontSize(10);

                doc.text(order.shippingAddress.fullName);
                doc.text(order.shippingAddress.addressLine);
                if (order.shippingAddress.landmark) {
                    doc.text(`Landmark: ${order.shippingAddress.landmark}`);
                }
                doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state}`);
                doc.text(`PIN: ${order.shippingAddress.pincode}`);
                doc.text(`Phone: ${order.shippingAddress.phone}`);
            }
            doc.moveDown(2);

            // Table Header
            const tableTop = doc.y;
            doc.fontSize(10)
               .fillColor('#ffffff')
               .rect(50, tableTop, 495, 25)
               .fill('#2c5530');

            doc.fillColor('#ffffff')
               .text('Item', 60, tableTop + 8, { width: 200 })
               .text('Qty', 270, tableTop + 8, { width: 50, align: 'center' })
               .text('Price', 330, tableTop + 8, { width: 70, align: 'right' })
               .text('Total', 410, tableTop + 8, { width: 125, align: 'right' });

            // Table Items
            let yPosition = tableTop + 35;
            doc.fillColor('#333333');

            order.items.forEach((item, index) => {
                const itemName = item.product?.name || 'Product';
                const quantity = item.quantity;
                const price = item.price;
                const total = price * quantity;

                // Calculate row height based on additional details
                let rowHeight = 25;
                let additionalLines = 0;
                
                if (item.packDetails?.isPack) additionalLines++;
                if (item.freeProducts?.length > 0) additionalLines += item.freeProducts.length;
                if (item.bundleDetails?.isBundle) additionalLines++;
                if (item.offerText) additionalLines++;
                
                rowHeight += (additionalLines * 12);

                // Alternate row colors
                if (index % 2 === 0) {
                    doc.rect(50, yPosition - 5, 495, rowHeight).fill('#f9f9f9');
                }

                doc.fillColor('#333333')
                   .fontSize(9)
                   .text(itemName, 60, yPosition, { width: 200 })
                   .text(quantity.toString(), 270, yPosition, { width: 50, align: 'center' })
                   .text(`₹${price.toFixed(2)}`, 330, yPosition, { width: 70, align: 'right' })
                   .text(`₹${total.toFixed(2)}`, 410, yPosition, { width: 125, align: 'right' });

                yPosition += 15;

                // Add pack details
                if (item.packDetails?.isPack) {
                    doc.fillColor('#2196f3')
                       .fontSize(7)
                       .text(`📦 ${item.packDetails.label || `Pack of ${item.packDetails.packSize}`}${item.packDetails.savingsPercent ? ` - Save ${item.packDetails.savingsPercent}%` : ''}`, 60, yPosition, { width: 200 });
                    yPosition += 12;
                }

                // Add free products
                if (item.freeProducts?.length > 0) {
                    item.freeProducts.forEach(fp => {
                        doc.fillColor('#4caf50')
                           .fontSize(7)
                           .text(`🎁 FREE: ${fp.name} × ${fp.quantity}`, 60, yPosition, { width: 200 });
                        yPosition += 12;
                    });
                }

                // Add bundle details
                if (item.bundleDetails?.isBundle) {
                    doc.fillColor('#ff9800')
                       .fontSize(7)
                       .text(`🔗 Bundle with ${item.bundleDetails.bundledProductName}${item.bundleDetails.savingsAmount ? ` - Save ₹${item.bundleDetails.savingsAmount}` : ''}`, 60, yPosition, { width: 200 });
                    yPosition += 12;
                }

                // Add offer text
                if (item.offerText) {
                    doc.fillColor('#e91e63')
                       .fontSize(7)
                       .text(`⭐ ${item.offerText}`, 60, yPosition, { width: 200 });
                    yPosition += 12;
                }

                yPosition += 10;
            });

            // Draw line
            doc.moveTo(50, yPosition)
               .lineTo(545, yPosition)
               .stroke('#cccccc');

            yPosition += 10;

            // Subtotal (totalAmount - shipping)
            const subtotal = order.totalAmount - (order.shippingCost || 0);
            doc.fontSize(10)
               .fillColor('#333333')
               .text('Subtotal:', 370, yPosition)
               .text(`₹${subtotal.toFixed(2)}`, 410, yPosition, { width: 125, align: 'right' });
            
            yPosition += 20;

            // Shipping
            doc.fillColor(order.shippingCost === 0 ? '#4caf50' : '#333333')
               .text('Shipping:', 370, yPosition)
               .text(order.shippingCost > 0 ? `₹${order.shippingCost.toFixed(2)}` : 'FREE', 410, yPosition, { width: 125, align: 'right' });
            
            yPosition += 20;

            // Discount
            if (order.discount && order.discount > 0) {
                doc.fillColor('#4caf50')
                   .text('Discount:', 370, yPosition)
                   .text(`-₹${order.discount.toFixed(2)}`, 410, yPosition, { width: 125, align: 'right' });
                yPosition += 20;
            }

            // Total
            doc.fontSize(12)
               .fillColor('#2c5530')
               .text('Total Amount:', 370, yPosition, { bold: true })
               .text(`₹${order.finalAmount.toFixed(2)}`, 410, yPosition, { width: 125, align: 'right', bold: true });

            yPosition += 30;

            // Payment Info
            doc.fontSize(9)
               .fillColor('#666666')
               .text(`Payment Method: ${order.paymentMethod.toUpperCase()}`, 50, yPosition)
               .text(`Payment Status: ${order.paymentStatus.toUpperCase()}`, 50, yPosition + 15);

            if (order.razorpayPaymentId) {
                doc.text(`Transaction ID: ${order.razorpayPaymentId}`, 50, yPosition + 30);
            }

            // Footer
            doc.moveDown(3);
            doc.fontSize(9)
               .fillColor('#888888')
               .text('Thank you for your purchase!', 50, 700, { align: 'center' })
               .text('For any queries, please contact support@ayurvedicstore.com', { align: 'center' })
               .text('This is a computer-generated invoice and does not require a signature.', { align: 'center' });

            doc.end();

            stream.on('finish', () => {
                resolve(filePath);
            });

            stream.on('error', (err) => {
                reject(err);
            });

        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    generateInvoice
};
