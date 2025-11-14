const { Types } = require('mongoose');

const sampleUserIds = [
    new Types.ObjectId().toHexString(),
    new Types.ObjectId().toHexString(),
    new Types.ObjectId().toHexString()
];

const sampleCategoryIds = [
    new Types.ObjectId().toHexString(),
    new Types.ObjectId().toHexString(),
    new Types.ObjectId().toHexString()
];

const sampleProducts = [
    {
        name: 'Ashwagandha Vitality Capsules',
        description: 'Premium ashwagandha capsules formulated to reduce stress and boost overall vitality.',
        price: 899,
        discountPrice: 749,
        stock: 120,
        category: sampleCategoryIds[0],
        images: [
            'https://cdn.example.com/products/ashwagandha/main.jpg',
            'https://cdn.example.com/products/ashwagandha/alt1.jpg'
        ],
        attributes: {
            dosageForm: 'Capsule',
            netQuantity: '60 capsules',
            herbalBlend: true
        },
        isActive: true,
        averageRating: 4.6,
        numReviews: 18,
        ratingBreakdown: {
            '1': 0,
            '2': 1,
            '3': 2,
            '4': 5,
            '5': 10
        },
        ingredients: 'Withania somnifera extract (Ashwagandha), BioPerine®',
        benefits: 'Reduces stress, improves stamina, supports immune response.',
        dosage: 'Take 1 capsule twice daily after meals.',
        contraindications: 'Consult a physician if pregnant, nursing, or on medication.',
        shelfLife: '24 months',
        storageInstructions: 'Store in a cool, dry place away from direct sunlight.',
        manufacturer: 'Prolific Healing Labs',
        batchNumber: 'ASH-2401',
        expiryDate: new Date(Date.now() + 360 * 24 * 60 * 60 * 1000),
        certification: 'FSSAI Certified',
        origin: 'India',
        processingMethod: 'Standardized extraction',
        potency: '600 mg per capsule',
        formulation: 'Vegetarian capsule',
        ageGroup: ['adult'],
        gender: 'unisex',
        season: ['all'],
        timeOfDay: ['morning', 'evening'],
        faq: [
            {
                question: 'Can I take it on an empty stomach?',
                answer: 'We recommend consuming it after meals for better absorption.'
            },
            {
                question: 'Is it safe for long-term use?',
                answer: 'Yes, but consult your healthcare provider for personalized advice.'
            }
        ],
        howToUse: 'Swallow capsule with water after breakfast and dinner.',
        howToStore: 'Keep tightly closed when not in use.',
        howToConsume: 'Do not exceed recommended dosage.',
        metaTitle: 'Ashwagandha Capsules for Stress Relief',
        metaDescription: 'Buy natural Ashwagandha vitality capsules to combat stress and fatigue.',
        keywords: ['ashwagandha', 'stress relief', 'capsules', 'ayurvedic supplement'],
        packOptions: [
            {
                packSize: 1,
                packPrice: 749,
                savingsPercent: 0,
                label: 'Single Pack'
            },
            {
                packSize: 3,
                packPrice: 2099,
                savingsPercent: 7,
                label: 'Family Pack'
            }
        ],
        freeProducts: [
            {
                product: sampleCategoryIds[0],
                quantity: 1,
                minQuantity: 3
            }
        ],
        bundleWith: [
            {
                product: sampleCategoryIds[1],
                quantity: 1,
                bundlePrice: 1299,
                savingsAmount: 199
            }
        ],
        offerText: 'Buy 2 get free shipping!',
        isOnOffer: true,
        freeShipping: true,
        shippingCost: 0,
        minOrderForFreeShipping: 0,
        tags: ['stress', 'wellness', 'energy'],
        views: 542,
        reviews: [
            {
                user: sampleUserIds[0],
                rating: 5,
                comment: 'Noticed better sleep within a week!',
                images: []
            },
            {
                user: sampleUserIds[1],
                rating: 4,
                comment: 'Great quality but capsules are slightly large.',
                images: ['https://cdn.example.com/reviews/ashwagandha/review1.jpg']
            }
        ],
        createdBy: sampleUserIds[2],
        updatedBy: sampleUserIds[2]
    },
    {
        name: 'Turmeric Curcumin Powder',
        description: 'Organic turmeric powder standardized for 95% curcuminoids to support joint health.',
        price: 599,
        discountPrice: 499,
        stock: 80,
        category: sampleCategoryIds[1],
        images: [
            'https://cdn.example.com/products/turmeric/main.jpg',
            'https://cdn.example.com/products/turmeric/alt1.jpg'
        ],
        attributes: {
            netWeight: '200 g',
            organic: true,
            curcuminoidPercentage: '95%'
        },
        isActive: true,
        averageRating: 4.8,
        numReviews: 26,
        ratingBreakdown: {
            '1': 0,
            '2': 0,
            '3': 2,
            '4': 6,
            '5': 18
        },
        ingredients: 'Curcuma longa rhizome powder with standardized curcuminoids.',
        benefits: 'Supports joint mobility, reduces inflammation, boosts immunity.',
        dosage: 'Mix 1 tsp in warm milk or water twice daily.',
        contraindications: 'Avoid if you have gallstones or bile duct obstruction.',
        shelfLife: '18 months',
        storageInstructions: 'Keep in airtight container away from moisture.',
        manufacturer: 'Golden Roots Naturals',
        batchNumber: 'TUR-2309',
        expiryDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
        certification: 'USDA Organic, GMP Certified',
        origin: 'Kerala, India',
        processingMethod: 'Cold-processed and vacuum dehydrated',
        potency: '95% curcuminoids',
        formulation: 'Fine powder',
        ageGroup: ['adult', 'senior'],
        gender: 'unisex',
        season: ['all'],
        timeOfDay: ['morning'],
        faq: [
            {
                question: 'Can children consume this?',
                answer: 'Consult a pediatrician before giving it to children under 12.'
            }
        ],
        howToUse: 'Add to beverages or cooking for enhanced benefits.',
        howToStore: 'Transfer to an airtight glass jar after opening.',
        howToConsume: 'Best absorbed with healthy fats and black pepper.',
        metaTitle: 'Organic Turmeric Curcumin Powder',
        metaDescription: 'High-potency turmeric curcumin powder to support joint health and immunity.',
        keywords: ['turmeric', 'curcumin', 'joint health', 'anti-inflammatory'],
        packOptions: [
            {
                packSize: 1,
                packPrice: 499,
                savingsPercent: 0,
                label: '200 g Pouch'
            },
            {
                packSize: 2,
                packPrice: 949,
                savingsPercent: 5,
                label: 'Value Pack'
            }
        ],
        freeProducts: [],
        bundleWith: [
            {
                product: sampleCategoryIds[2],
                quantity: 1,
                bundlePrice: 899,
                savingsAmount: 149
            }
        ],
        offerText: 'Free wooden spoon with every order!',
        isOnOffer: true,
        freeShipping: false,
        shippingCost: 49,
        minOrderForFreeShipping: 1500,
        tags: ['turmeric', 'curcumin', 'anti-inflammatory'],
        views: 321,
        reviews: [
            {
                user: sampleUserIds[2],
                rating: 5,
                comment: 'Color and aroma are fantastic—authentic product.',
                images: []
            }
        ],
        createdBy: sampleUserIds[0],
        updatedBy: sampleUserIds[1]
    },
    {
        name: 'Triphala Digestive Tonic',
        description: 'Traditional Triphala blend to support digestion, detoxification, and gut balance.',
        price: 499,
        discountPrice: 449,
        stock: 200,
        category: sampleCategoryIds[2],
        images: [
            'https://cdn.example.com/products/triphala/main.jpg',
            'https://cdn.example.com/products/triphala/alt1.jpg'
        ],
        attributes: {
            form: 'Powder',
            netWeight: '250 g',
            sugarFree: true
        },
        isActive: true,
        averageRating: 4.4,
        numReviews: 9,
        ratingBreakdown: {
            '1': 0,
            '2': 1,
            '3': 1,
            '4': 3,
            '5': 4
        },
        ingredients: 'Emblica officinalis (Amla), Terminalia chebula (Haritaki), Terminalia bellirica (Bibhitaki).',
        benefits: 'Improves digestion, gently detoxifies, supports regular bowel movements.',
        dosage: 'Mix 1 teaspoon with lukewarm water at bedtime.',
        contraindications: 'Not recommended during pregnancy without medical supervision.',
        shelfLife: '12 months',
        storageInstructions: 'Keep sealed in a dry place.',
        manufacturer: 'Herbal Balance Co.',
        batchNumber: 'TRI-2402',
        expiryDate: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000),
        certification: 'ISO 22000 Certified',
        origin: 'Ayurvedic formulation from India',
        processingMethod: 'Sun-dried fruits milled under low heat',
        potency: 'Traditional ratio 1:1:1',
        formulation: 'Granular powder',
        ageGroup: ['adult'],
        gender: 'unisex',
        season: ['all'],
        timeOfDay: ['night'],
        faq: [
            {
                question: 'Can I mix it with honey?',
                answer: 'Yes, you can mix with honey or warm water for taste.'
            }
        ],
        howToUse: 'Stir in warm water and drink slowly.',
        howToStore: 'Keep container closed to avoid moisture absorption.',
        howToConsume: 'Avoid consuming immediately after heavy meals.',
        metaTitle: 'Triphala Digestive Cleanse Powder',
        metaDescription: 'Balanced Triphala tonic for daily detox and digestive wellness.',
        keywords: ['triphala', 'digestion', 'detox', 'ayurveda'],
        packOptions: [
            {
                packSize: 1,
                packPrice: 449,
                savingsPercent: 0,
                label: 'Standard Pack'
            },
            {
                packSize: 4,
                packPrice: 1599,
                savingsPercent: 11,
                label: 'Monthly Supply'
            }
        ],
        freeProducts: [
            {
                product: sampleCategoryIds[1],
                quantity: 1,
                minQuantity: 4
            }
        ],
        bundleWith: [],
        offerText: 'Extra 5% off when paired with our Detox Tea.',
        isOnOffer: false,
        freeShipping: false,
        shippingCost: 49,
        minOrderForFreeShipping: 999,
        tags: ['digestion', 'detox', 'gut health'],
        views: 187,
        reviews: [],
        createdBy: sampleUserIds[1],
        updatedBy: sampleUserIds[0]
    }
];

module.exports = sampleProducts;

