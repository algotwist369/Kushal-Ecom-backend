const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const formatCurrency = (value) => `₹${Number(value || 0).toFixed(2)}`;

const ensureDirectory = (filePath) => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

const addHeader = (doc) => {
    doc
        .fontSize(20)
        .fillColor('#2c5530')
        .text('Prolific Healing Herbs', { align: 'center' })
        .moveDown(0.5)
        .fontSize(10)
        .fillColor('#333333')
        .text('Holistic Wellness & Authentic Ayurvedic Products', { align: 'center' })
        .moveDown();

    doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke('#2c5530').moveDown();
};

const addOrderSummary = (doc, order) => {
    doc.fontSize(12).fillColor('#333333').text('Invoice Summary', { underline: true });
    doc.moveDown(0.5);

    const summaryData = [
        { label: 'Invoice Number', value: `INV-${order._id.toString().slice(-8).toUpperCase()}` },
        { label: 'Order ID', value: order._id.toString() },
        { label: 'Order Date', value: new Date(order.createdAt).toLocaleString('en-IN') },
        { label: 'Payment Method', value: order.paymentMethod?.toUpperCase() },
        { label: 'Payment Status', value: order.paymentStatus?.toUpperCase() },
        { label: 'Order Status', value: order.orderStatus?.toUpperCase() }
    ];

    summaryData.forEach(({ label, value }) => {
        doc.font('Helvetica-Bold').text(`${label}: `, { continued: true });
        doc.font('Helvetica').text(value || 'N/A');
    });

    doc.moveDown();
};

const addCustomerDetails = (doc, order) => {
    doc.fontSize(12).fillColor('#333333').text('Billing & Shipping', { underline: true });
    doc.moveDown(0.5);

    const shipping = order.shippingAddress || {};
    const customer = order.user || {};

    doc
        .font('Helvetica-Bold')
        .text(customer.name || shipping.fullName || 'Customer')
        .font('Helvetica')
        .text(shipping.addressLine || '')
        .text([shipping.city, shipping.state, shipping.pincode].filter(Boolean).join(', '))
        .text(`Phone: ${shipping.phone || customer.phone || 'N/A'}`)
        .text(`Email: ${shipping.email || customer.email || 'N/A'}`);

    doc.moveDown();
};

const addItemsTable = (doc, order) => {
    const tableTop = doc.y + 10;
    const itemColumns = [50, 250, 320, 380, 450, 520];

    doc.font('Helvetica-Bold').fontSize(11);
    doc.text('Item', itemColumns[0], tableTop);
    doc.text('Details', itemColumns[1], tableTop);
    doc.text('Qty', itemColumns[2], tableTop, { width: 40, align: 'right' });
    doc.text('Price', itemColumns[3], tableTop, { width: 60, align: 'right' });
    doc.text('Offer', itemColumns[4], tableTop, { width: 60, align: 'right' });
    doc.text('Total', itemColumns[5], tableTop, { width: 60, align: 'right' });

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke('#dddddd');
    doc.font('Helvetica').fontSize(10);

    let position = tableTop + 25;

    order.items.forEach((item) => {
        const details = [];
        if (item.packDetails?.isPack) {
            details.push(`Pack: ${item.packDetails.label || item.packDetails.packSize}`);
        }
        if (item.bundleDetails?.isBundle) {
            details.push(`Bundle with ${item.bundleDetails.bundledProductName}`);
        }
        if (item.offerText) {
            details.push(item.offerText);
        }

        doc.text(item.product?.name || 'Product', itemColumns[0], position, { width: 180 });
        doc.text(details.join('\n') || '-', itemColumns[1], position, { width: 60 });
        doc.text(item.quantity, itemColumns[2], position, { width: 40, align: 'right' });
        doc.text(formatCurrency(item.price), itemColumns[3], position, { width: 60, align: 'right' });

        const offer =
            (item.packDetails?.savingsPercent && `${item.packDetails.savingsPercent}%`) ||
            (item.bundleDetails?.savingsAmount && formatCurrency(item.bundleDetails.savingsAmount)) ||
            '-';

        doc.text(offer, itemColumns[4], position, { width: 60, align: 'right' });
        doc.text(formatCurrency(item.price * item.quantity), itemColumns[5], position, { width: 60, align: 'right' });

        position += 40;
        if (position > doc.page.height - 150) {
            doc.addPage();
            position = doc.y;
        }
    });

    doc.moveDown();
};

const addTotals = (doc, order) => {
    const totalsStart = doc.y + 10;
    const rightColumn = 400;

    const rows = [
        { label: 'Subtotal', value: order.totalAmount - order.shippingCost },
        { label: 'Shipping', value: order.shippingCost },
        { label: 'Discount', value: -Math.abs(order.discount || 0) },
        { label: 'Total', value: order.finalAmount, bold: true }
    ];

    rows.forEach((row, index) => {
        const y = totalsStart + index * 18;
        doc.font(row.bold ? 'Helvetica-Bold' : 'Helvetica');
        doc.text(row.label, rightColumn, y, { width: 120, align: 'right' });
        doc.text(formatCurrency(row.value), rightColumn + 130, y, { width: 80, align: 'right' });
    });

    doc.moveDown(2);
};

const addFooter = (doc) => {
    doc
        .fontSize(10)
        .fillColor('#777777')
        .text('Thank you for shopping with Prolific Healing Herbs!', { align: 'center' })
        .text('For support, contact support@ayurvedicstore.com or call +91-XXXXXXXXXX', {
            align: 'center'
        });
};

const generateInvoice = (order, filePath) =>
    new Promise((resolve, reject) => {
        try {
            ensureDirectory(filePath);

            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            addHeader(doc);
            addOrderSummary(doc, order);
            addCustomerDetails(doc, order);
            addItemsTable(doc, order);
            addTotals(doc, order);
            addFooter(doc);

            doc.end();

            stream.on('finish', resolve);
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });

module.exports = { generateInvoice };

