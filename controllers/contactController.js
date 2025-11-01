const Contact = require('../models/Contact');
const { handleAsync } = require('../utils/handleAsync');
const sendEmail = require('../utils/sendEmail');

// Submit contact form (public)
const submitContactForm = handleAsync(async (req, res) => {
    const { name, email, phone, subject, message } = req.body;

    // Validate input
    if (!name || !email || !phone || !subject || !message) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required'
        });
    }

    // Create contact submission
    const contact = await Contact.create({
        name,
        email,
        phone,
        subject,
        message,
        status: 'new',
        priority: 'medium'
    });

    // Send confirmation email to user
    try {
        await sendEmail({
            to: email,
            subject: 'We received your message - Prolific Healing Herbs',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #111827;">Thank you for contacting us!</h2>
                    <p>Dear ${name},</p>
                    <p>We have received your message and will get back to you as soon as possible.</p>
                    
                    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #111827; margin-top: 0;">Your Message:</h3>
                        <p><strong>Subject:</strong> ${subject}</p>
                        <p><strong>Message:</strong> ${message}</p>
                    </div>
                    
                    <p>Our support team typically responds within 24 hours.</p>
                    <p>Best regards,<br/>Prolific Healing Herbs Team</p>
                </div>
            `
        });
    } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        // Don't fail the request if email fails
    }

    res.status(201).json({
        success: true,
        message: 'Your message has been sent successfully! We will get back to you soon.',
        data: {
            _id: contact._id,
            name: contact.name,
            email: contact.email
        }
    });
});

// Get all contacts (admin)
const getAllContacts = handleAsync(async (req, res) => {
    const { 
        page = 1, 
        limit = 20, 
        status, 
        priority,
        search,
        sortBy = 'newest'
    } = req.query;

    const filter = {};

    // Status filter
    if (status) {
        filter.status = status;
    }

    // Priority filter
    if (priority) {
        filter.priority = priority;
    }

    // Search filter
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { subject: { $regex: search, $options: 'i' } },
            { message: { $regex: search, $options: 'i' } }
        ];
    }

    // Sort
    let sort = {};
    switch (sortBy) {
        case 'newest':
            sort = { createdAt: -1 };
            break;
        case 'oldest':
            sort = { createdAt: 1 };
            break;
        case 'priority':
            sort = { priority: -1, createdAt: -1 };
            break;
        default:
            sort = { createdAt: -1 };
    }

    const contacts = await Contact.find(filter)
        .populate('assignedTo', 'name email')
        .populate('resolvedBy', 'name email')
        .sort(sort)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .lean();

    const total = await Contact.countDocuments(filter);

    // Get statistics
    const stats = await Contact.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    const statusStats = {
        new: 0,
        in_progress: 0,
        resolved: 0,
        closed: 0
    };

    stats.forEach(stat => {
        statusStats[stat._id] = stat.count;
    });

    res.json({
        success: true,
        data: {
            contacts,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            stats: statusStats
        }
    });
});

// Get contact by ID (admin)
const getContactById = handleAsync(async (req, res) => {
    const { id } = req.params;

    const contact = await Contact.findById(id)
        .populate('assignedTo', 'name email')
        .populate('resolvedBy', 'name email');

    if (!contact) {
        return res.status(404).json({
            success: false,
            message: 'Contact not found'
        });
    }

    res.json({
        success: true,
        data: contact
    });
});

// Update contact status (admin)
const updateContact = handleAsync(async (req, res) => {
    const { id } = req.params;
    const { status, priority, assignedTo, adminNotes } = req.body;

    const contact = await Contact.findById(id);

    if (!contact) {
        return res.status(404).json({
            success: false,
            message: 'Contact not found'
        });
    }

    // Update fields
    if (status !== undefined) {
        contact.status = status;
        
        // If resolved, set resolved timestamp and user
        if (status === 'resolved' || status === 'closed') {
            if (!contact.resolvedAt) {
                contact.resolvedAt = new Date();
                contact.resolvedBy = req.user._id;
            }
        }
    }
    if (priority !== undefined) contact.priority = priority;
    if (assignedTo !== undefined) contact.assignedTo = assignedTo;
    if (adminNotes !== undefined) contact.adminNotes = adminNotes;

    await contact.save();

    const updatedContact = await Contact.findById(id)
        .populate('assignedTo', 'name email')
        .populate('resolvedBy', 'name email');

    res.json({
        success: true,
        message: 'Contact updated successfully',
        data: updatedContact
    });
});

// Delete contact (admin)
const deleteContact = handleAsync(async (req, res) => {
    const { id } = req.params;

    const contact = await Contact.findById(id);

    if (!contact) {
        return res.status(404).json({
            success: false,
            message: 'Contact not found'
        });
    }

    await contact.deleteOne();

    res.json({
        success: true,
        message: 'Contact deleted successfully'
    });
});

// Get contact statistics (admin)
const getContactStats = handleAsync(async (req, res) => {
    const stats = await Contact.aggregate([
        {
            $facet: {
                byStatus: [
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 }
                        }
                    }
                ],
                byPriority: [
                    {
                        $group: {
                            _id: '$priority',
                            count: { $sum: 1 }
                        }
                    }
                ],
                recent: [
                    { $sort: { createdAt: -1 } },
                    { $limit: 5 },
                    {
                        $project: {
                            name: 1,
                            email: 1,
                            subject: 1,
                            status: 1,
                            createdAt: 1
                        }
                    }
                ]
            }
        }
    ]);

    res.json({
        success: true,
        data: stats[0]
    });
});

module.exports = {
    submitContactForm,
    getAllContacts,
    getContactById,
    updateContact,
    deleteContact,
    getContactStats
};

