require('colors');
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const Category = require('../models/Category');

// Connect to database
connectDB();

// Sample products data with all fields
const sampleProducts = [
    {
        name: 'Ashwagandha Premium Capsules',
        description: 'Premium quality Ashwagandha capsules made from organic roots. Helps reduce stress, improve sleep quality, and boost immunity. Formulated with 100% natural ingredients and standardized for maximum potency.',
        price: 899,
        discountPrice: 749,
        stock: 150,
        images: [
            'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500',
            'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=500',
            'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=500'
        ],
        attributes: {
            weight: '500mg per capsule',
            quantity: '60 capsules',
            form: 'Vegetarian Capsule',
            purity: '100% Pure Extract'
        },
        isActive: true,
        // Ayurvedic-specific fields - using object arrays as per frontend
        ingredients: [
            {
                image: 'https://images.unsplash.com/photo-1606787842090-a2f0c43a8b18?w=300',
                name: 'Ashwagandha Root Extract',
                description: 'Standardized to contain 5% withanolides for maximum efficacy'
            },
            {
                image: 'https://images.unsplash.com/photo-1606787842200-5b5b8466ca3f?w=300',
                name: 'Black Pepper Extract',
                description: 'Enhances bioavailability and absorption'
            }
        ],
        benefits: [
            {
                image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300',
                name: 'Stress Relief',
                description: 'Reduces cortisol levels and promotes calmness'
            },
            {
                image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300',
                name: 'Better Sleep',
                description: 'Improves sleep quality and duration'
            },
            {
                image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300',
                name: 'Immune Support',
                description: 'Boosts natural immunity and resistance'
            }
        ],
        dosage: '1-2 capsules twice daily with warm water, preferably after meals',
        contraindications: [
            {
                image: '',
                name: 'Pregnancy',
                description: 'Not recommended during pregnancy and lactation'
            },
            {
                image: '',
                name: 'Autoimmune Conditions',
                description: 'Consult doctor if you have autoimmune disorders'
            }
        ],
        shelfLife: '24 months from date of manufacture',
        storageInstructions: 'Store in a cool, dry place away from direct sunlight. Keep the container tightly closed.',
        manufacturer: 'Prolific Healing Herbs',
        batchNumber: 'ASH-2024-001',
        expiryDate: new Date('2026-12-31'),
        certification: [
            {
                image: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=300',
                name: 'FSSAI Certified',
                description: 'Food Safety and Standards Authority of India approved'
            },
            {
                image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300',
                name: 'GMP Certified',
                description: 'Good Manufacturing Practices certified facility'
            },
            {
                image: '',
                name: 'Organic Certified',
                description: 'Certified organic by recognized authority'
            }
        ],
        origin: 'India',
        processingMethod: 'Standardized extraction using water and ethanol',
        potency: '600mg per capsule (5% withanolides)',
        formulation: 'Vegetarian capsule with natural plant-based shell',
        ageGroup: ['adult', 'senior'],
        gender: ['male', 'female', 'unisex'],
        season: ['winter', 'all'],
        timeOfDay: ['morning', 'evening'],
        faq: [
            {
                question: 'How long does it take to see results?',
                answer: 'Most users notice improvements in stress levels and sleep quality within 2-4 weeks of regular use. For optimal results, continue for at least 3 months.'
            },
            {
                question: 'Can I take this with other medications?',
                answer: 'Please consult your healthcare provider before taking Ashwagandha if you are on any medications, especially for thyroid, blood pressure, or diabetes.'
            },
            {
                question: 'Is this suitable for vegetarians?',
                answer: 'Yes, our capsules are made with vegetarian-friendly ingredients and are completely plant-based.'
            },
            {
                question: 'What is the best time to take Ashwagandha?',
                answer: 'It is recommended to take Ashwagandha twice daily - once in the morning after breakfast and once in the evening after dinner for best results.'
            }
        ],
        howToUse: [
            {
                image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=300',
                name: 'Dosage',
                description: 'Take 1-2 capsules twice daily with warm water'
            },
            {
                image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=300',
                name: 'Timing',
                description: 'Best taken after meals for better absorption'
            }
        ],
        howToStore: [
            {
                image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=300',
                name: 'Temperature',
                description: 'Store at room temperature (15-30°C)'
            },
            {
                image: '',
                name: 'Moisture',
                description: 'Keep away from moisture and direct sunlight'
            }
        ],
        howToConsume: [
            {
                image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=300',
                name: 'With Water',
                description: 'Swallow with a full glass of warm water'
            },
            {
                image: '',
                name: 'Consistency',
                description: 'Take at the same time daily for best results'
            }
        ],
        metaTitle: 'Ashwagandha Premium Capsules - Natural Stress Relief & Better Sleep | Prolific Healing',
        metaDescription: 'Buy premium Ashwagandha capsules online. 100% natural, FSSAI certified, helps reduce stress, improve sleep, and boost immunity. Free shipping available.',
        keywords: ['ashwagandha', 'stress relief', 'sleep aid', 'immunity booster', 'ayurvedic', 'natural supplements', 'herbal medicine'],
        packOptions: [
            {
                packSize: 1,
                packPrice: 749,
                savingsPercent: 17,
                label: 'Single Pack',
                image: ''
            },
            {
                packSize: 2,
                packPrice: 1398,
                savingsPercent: 22,
                label: 'Buy 2 Get 10% Extra',
                image: ''
            },
            {
                packSize: 3,
                packPrice: 1997,
                savingsPercent: 26,
                label: 'Best Value Pack',
                image: ''
            }
        ],
        freeProducts: [],
        bundleWith: [],
        offerText: 'Buy 2 Get 10% Extra Discount + Free Shipping',
        isOnOffer: true,
        freeShipping: true,
        shippingCost: 0,
        minOrderForFreeShipping: 0
    },
    {
        name: 'Turmeric Curcumin Gold Complex',
        description: 'Premium Turmeric Curcumin with Black Pepper and Ginger. Powerful anti-inflammatory properties, supports joint health, and promotes overall wellness. Enhanced with BioPerine for better absorption.',
        price: 699,
        discountPrice: 599,
        stock: 200,
        images: [
            'https://images.unsplash.com/photo-1606787842090-a2f0c43a8b18?w=500',
            'https://images.unsplash.com/photo-1606787842200-5b5b8466ca3f?w=500'
        ],
        attributes: {
            weight: '500mg per capsule',
            quantity: '90 capsules',
            form: 'Vegetarian Capsule',
            curcuminContent: '95% Curcuminoids'
        },
        isActive: true,
        ingredients: [
            {
                image: 'https://images.unsplash.com/photo-1606787842090-a2f0c43a8b18?w=300',
                name: 'Turmeric Extract',
                description: 'Standardized to 95% curcuminoids (475mg per capsule)'
            },
            {
                image: 'https://images.unsplash.com/photo-1606787842200-5b5b8466ca3f?w=300',
                name: 'Black Pepper Extract (BioPerine)',
                description: '5mg BioPerine enhances curcumin absorption by 2000%'
            },
            {
                image: '',
                name: 'Ginger Extract',
                description: '50mg for additional anti-inflammatory support'
            }
        ],
        benefits: [
            {
                image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300',
                name: 'Joint Health',
                description: 'Reduces joint inflammation and supports mobility'
            },
            {
                image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300',
                name: 'Anti-Inflammatory',
                description: 'Natural anti-inflammatory properties'
            },
            {
                image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300',
                name: 'Antioxidant Support',
                description: 'Powerful antioxidant that fights free radicals'
            }
        ],
        dosage: '1 capsule twice daily with meals, or as directed by healthcare provider',
        contraindications: [
            {
                image: '',
                name: 'Gallbladder Issues',
                description: 'Avoid if you have gallstones or bile duct obstruction'
            },
            {
                image: '',
                name: 'Blood Thinners',
                description: 'Consult doctor if taking blood-thinning medications'
            }
        ],
        shelfLife: '36 months from date of manufacture',
        storageInstructions: 'Store in a cool, dry place. Protect from light and moisture.',
        manufacturer: 'Prolific Healing Herbs',
        batchNumber: 'TUR-2024-002',
        expiryDate: new Date('2027-06-30'),
        certification: [
            {
                image: '',
                name: 'FSSAI Certified',
                description: 'Food Safety and Standards Authority of India approved'
            },
            {
                image: '',
                name: 'Non-GMO',
                description: 'Certified non-genetically modified'
            }
        ],
        origin: 'India',
        processingMethod: 'Cold extraction method to preserve active compounds',
        potency: '500mg per capsule (95% curcuminoids)',
        formulation: 'Vegetarian capsule with enhanced bioavailability',
        ageGroup: ['adult', 'senior'],
        gender: ['male', 'female', 'unisex'],
        season: ['all'],
        timeOfDay: ['morning', 'evening'],
        faq: [
            {
                question: 'How is this different from regular turmeric?',
                answer: 'This contains 95% curcuminoids (the active compound) compared to only 2-5% in regular turmeric powder. Enhanced with BioPerine for 2000% better absorption.'
            },
            {
                question: 'Can I take this on an empty stomach?',
                answer: 'It is recommended to take with meals to avoid any stomach discomfort and for better absorption.'
            }
        ],
        howToUse: [
            {
                image: '',
                name: 'Dosage',
                description: '1 capsule twice daily with meals'
            }
        ],
        howToStore: [
            {
                image: '',
                name: 'Storage',
                description: 'Store in original container in a cool, dry place'
            }
        ],
        howToConsume: [
            {
                image: '',
                name: 'With Meals',
                description: 'Take with food for optimal absorption'
            }
        ],
        metaTitle: 'Turmeric Curcumin Gold Complex - Joint Health & Anti-Inflammatory | Prolific Healing',
        metaDescription: 'Premium Turmeric Curcumin with BioPerine. 95% curcuminoids, supports joint health, reduces inflammation. Buy online with free shipping.',
        keywords: ['turmeric', 'curcumin', 'joint health', 'anti-inflammatory', 'bioperine', 'ayurvedic'],
        packOptions: [
            {
                packSize: 1,
                packPrice: 599,
                savingsPercent: 14,
                label: 'Single Pack',
                image: ''
            },
            {
                packSize: 2,
                packPrice: 1098,
                savingsPercent: 21,
                label: 'Buy 2 Save More',
                image: ''
            }
        ],
        freeProducts: [],
        bundleWith: [],
        offerText: 'Buy 2 Get 15% Extra Discount',
        isOnOffer: true,
        freeShipping: false,
        shippingCost: 50,
        minOrderForFreeShipping: 1000
    },
    {
        name: 'Triphala Digestive Wellness Tablets',
        description: 'Classic Ayurvedic formula combining three powerful fruits - Amla, Bibhitaki, and Haritaki. Supports digestive health, natural detoxification, and promotes regular bowel movements. 100% natural and gentle.',
        price: 549,
        discountPrice: 449,
        stock: 180,
        images: [
            'https://images.unsplash.com/photo-1606787842090-a2f0c43a8b18?w=500',
            'https://images.unsplash.com/photo-1606787842200-5b5b8466ca3f?w=500'
        ],
        attributes: {
            weight: '500mg per tablet',
            quantity: '120 tablets',
            form: 'Vegetarian Tablet',
            composition: 'Equal parts Amla, Bibhitaki, Haritaki'
        },
        isActive: true,
        ingredients: [
            {
                image: 'https://images.unsplash.com/photo-1606787842090-a2f0c43a8b18?w=300',
                name: 'Amla (Indian Gooseberry)',
                description: 'Rich in Vitamin C and antioxidants'
            },
            {
                image: 'https://images.unsplash.com/photo-1606787842200-5b5b8466ca3f?w=300',
                name: 'Bibhitaki',
                description: 'Supports respiratory and digestive health'
            },
            {
                image: '',
                name: 'Haritaki',
                description: 'Promotes natural detoxification and regularity'
            }
        ],
        benefits: [
            {
                image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300',
                name: 'Digestive Health',
                description: 'Supports healthy digestion and gut function'
            },
            {
                image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300',
                name: 'Natural Detox',
                description: 'Gentle detoxification and cleansing'
            },
            {
                image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300',
                name: 'Regularity',
                description: 'Promotes regular and healthy bowel movements'
            }
        ],
        dosage: '1-2 tablets at bedtime with warm water, or as directed',
        contraindications: [
            {
                image: '',
                name: 'Diarrhea',
                description: 'Avoid during acute diarrhea episodes'
            },
            {
                image: '',
                name: 'Pregnancy',
                description: 'Consult healthcare provider before use during pregnancy'
            }
        ],
        shelfLife: '30 months from date of manufacture',
        storageInstructions: 'Store in a cool, dry place. Keep container tightly closed.',
        manufacturer: 'Prolific Healing Herbs',
        batchNumber: 'TRI-2024-003',
        expiryDate: new Date('2027-03-31'),
        certification: [
            {
                image: '',
                name: 'FSSAI Certified',
                description: 'Food Safety and Standards Authority of India approved'
            },
            {
                image: '',
                name: 'Traditional Ayurvedic Formula',
                description: 'Based on ancient Ayurvedic texts'
            }
        ],
        origin: 'India',
        processingMethod: 'Traditional preparation method preserving all active compounds',
        potency: '500mg per tablet (equal blend of three fruits)',
        formulation: 'Vegetarian tablet, easy to swallow',
        ageGroup: ['adult', 'senior'],
        gender: ['male', 'female', 'unisex'],
        season: ['all'],
        timeOfDay: ['night'],
        faq: [
            {
                question: 'How long before I see results?',
                answer: 'Most users notice improved digestion and regularity within 1-2 weeks of consistent use.'
            },
            {
                question: 'Can I take this daily?',
                answer: 'Yes, Triphala is safe for daily use and is traditionally taken as a daily wellness supplement.'
            }
        ],
        howToUse: [
            {
                image: '',
                name: 'Timing',
                description: 'Best taken at bedtime with warm water'
            }
        ],
        howToStore: [
            {
                image: '',
                name: 'Storage',
                description: 'Store in original container away from moisture'
            }
        ],
        howToConsume: [
            {
                image: '',
                name: 'With Water',
                description: 'Swallow with warm water for best results'
            }
        ],
        metaTitle: 'Triphala Digestive Wellness Tablets - Natural Digestive Support | Prolific Healing',
        metaDescription: 'Classic Ayurvedic Triphala formula for digestive health. 100% natural, supports gut health and natural detox. Buy online.',
        keywords: ['triphala', 'digestive health', 'detox', 'ayurvedic', 'digestive wellness', 'natural laxative'],
        packOptions: [
            {
                packSize: 1,
                packPrice: 449,
                savingsPercent: 18,
                label: 'Single Pack',
                image: ''
            },
            {
                packSize: 2,
                packPrice: 798,
                savingsPercent: 27,
                label: 'Buy 2 Save More',
                image: ''
            }
        ],
        freeProducts: [],
        bundleWith: [],
        offerText: 'Buy 2 Get 20% Extra Discount',
        isOnOffer: true,
        freeShipping: false,
        shippingCost: 40,
        minOrderForFreeShipping: 800
    },
    {
        name: 'Brahmi Brain Boost Memory Support',
        description: 'Premium Brahmi (Bacopa Monnieri) extract formulated to support cognitive function, memory, focus, and mental clarity. Clinically studied for brain health benefits. Suitable for students and professionals.',
        price: 799,
        discountPrice: 649,
        stock: 120,
        images: [
            'https://images.unsplash.com/photo-1606787842090-a2f0c43a8b18?w=500',
            'https://images.unsplash.com/photo-1606787842200-5b5b8466ca3f?w=500'
        ],
        attributes: {
            weight: '500mg per capsule',
            quantity: '60 capsules',
            form: 'Vegetarian Capsule',
            extractRatio: '10:1 Extract (equivalent to 5000mg)'
        },
        isActive: true,
        ingredients: [
            {
                image: 'https://images.unsplash.com/photo-1606787842090-a2f0c43a8b18?w=300',
                name: 'Brahmi Extract',
                description: 'Standardized to contain 20% bacosides (active compounds)'
            },
            {
                image: '',
                name: 'Ginkgo Biloba',
                description: '50mg for enhanced cognitive support'
            }
        ],
        benefits: [
            {
                image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300',
                name: 'Memory Enhancement',
                description: 'Improves memory retention and recall'
            },
            {
                image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300',
                name: 'Focus & Concentration',
                description: 'Enhances mental focus and attention span'
            },
            {
                image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300',
                name: 'Cognitive Function',
                description: 'Supports overall brain health and function'
            }
        ],
        dosage: '1-2 capsules twice daily with meals, preferably morning and evening',
        contraindications: [
            {
                image: '',
                name: 'Thyroid Medications',
                description: 'Consult doctor if taking thyroid medications'
            },
            {
                image: '',
                name: 'Pregnancy',
                description: 'Not recommended during pregnancy without medical supervision'
            }
        ],
        shelfLife: '24 months from date of manufacture',
        storageInstructions: 'Store in a cool, dry place. Keep away from direct sunlight.',
        manufacturer: 'Prolific Healing Herbs',
        batchNumber: 'BRA-2024-004',
        expiryDate: new Date('2026-11-30'),
        certification: [
            {
                image: '',
                name: 'FSSAI Certified',
                description: 'Food Safety and Standards Authority of India approved'
            },
            {
                image: '',
                name: 'Clinically Studied',
                description: 'Backed by scientific research'
            }
        ],
        origin: 'India',
        processingMethod: 'Standardized extraction preserving active bacosides',
        potency: '500mg per capsule (20% bacosides = 100mg active)',
        formulation: 'Vegetarian capsule with natural ingredients',
        ageGroup: ['teen', 'adult', 'senior'],
        gender: ['male', 'female', 'unisex'],
        season: ['all'],
        timeOfDay: ['morning', 'afternoon'],
        faq: [
            {
                question: 'How long does it take to see cognitive benefits?',
                answer: 'Cognitive benefits typically become noticeable after 8-12 weeks of consistent use. Brahmi works gradually to support long-term brain health.'
            },
            {
                question: 'Is this safe for students?',
                answer: 'Yes, Brahmi is safe and beneficial for students. It can help with focus, memory, and learning capacity.'
            },
            {
                question: 'Can I take this with other supplements?',
                answer: 'Brahmi is generally safe with other supplements, but consult your healthcare provider if taking multiple brain health supplements.'
            }
        ],
        howToUse: [
            {
                image: '',
                name: 'Dosage',
                description: '1-2 capsules twice daily with meals'
            },
            {
                image: '',
                name: 'Consistency',
                description: 'Take consistently for best results'
            }
        ],
        howToStore: [
            {
                image: '',
                name: 'Storage',
                description: 'Store in original container in cool, dry place'
            }
        ],
        howToConsume: [
            {
                image: '',
                name: 'With Meals',
                description: 'Take with food for better absorption'
            }
        ],
        metaTitle: 'Brahmi Brain Boost - Memory & Cognitive Support | Prolific Healing',
        metaDescription: 'Premium Brahmi extract for memory, focus, and cognitive function. Clinically studied, 100% natural. Ideal for students and professionals.',
        keywords: ['brahmi', 'memory', 'brain health', 'cognitive function', 'focus', 'bacopa', 'mental clarity'],
        packOptions: [
            {
                packSize: 1,
                packPrice: 649,
                savingsPercent: 19,
                label: 'Single Pack',
                image: ''
            },
            {
                packSize: 2,
                packPrice: 1198,
                savingsPercent: 25,
                label: 'Buy 2 Save More',
                image: ''
            }
        ],
        freeProducts: [],
        bundleWith: [],
        offerText: 'Buy 2 Get 15% Extra + Free Study Guide',
        isOnOffer: true,
        freeShipping: true,
        shippingCost: 0,
        minOrderForFreeShipping: 0
    },
    {
        name: 'Guduchi Immunity Power Capsules',
        description: 'Powerful immune system support with Guduchi (Tinospora Cordifolia), also known as Giloy. Enhances natural immunity, supports recovery, and promotes overall wellness. Traditional Ayurvedic immunity booster.',
        price: 649,
        discountPrice: 549,
        stock: 170,
        images: [
            'https://images.unsplash.com/photo-1606787842090-a2f0c43a8b18?w=500',
            'https://images.unsplash.com/photo-1606787842200-5b5b8466ca3f?w=500'
        ],
        attributes: {
            weight: '500mg per capsule',
            quantity: '90 capsules',
            form: 'Vegetarian Capsule',
            extractType: 'Full Spectrum Extract'
        },
        isActive: true,
        ingredients: [
            {
                image: 'https://images.unsplash.com/photo-1606787842090-a2f0c43a8b18?w=300',
                name: 'Guduchi Stem Extract',
                description: 'Standardized extract from mature Guduchi stems'
            },
            {
                image: '',
                name: 'Amalaki Extract',
                description: '50mg for additional Vitamin C support'
            }
        ],
        benefits: [
            {
                image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300',
                name: 'Immune Support',
                description: 'Strengthens natural immune system function'
            },
            {
                image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300',
                name: 'Faster Recovery',
                description: 'Supports faster recovery from illness'
            },
            {
                image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300',
                name: 'Overall Wellness',
                description: 'Promotes general health and vitality'
            }
        ],
        dosage: '1-2 capsules twice daily with warm water, preferably on empty stomach in morning',
        contraindications: [
            {
                image: '',
                name: 'Autoimmune Conditions',
                description: 'Consult doctor if you have autoimmune disorders'
            },
            {
                image: '',
                name: 'Organ Transplant',
                description: 'Not recommended for organ transplant recipients'
            }
        ],
        shelfLife: '30 months from date of manufacture',
        storageInstructions: 'Store in a cool, dry place. Keep container tightly sealed.',
        manufacturer: 'Prolific Healing Herbs',
        batchNumber: 'GUD-2024-005',
        expiryDate: new Date('2027-05-31'),
        certification: [
            {
                image: '',
                name: 'FSSAI Certified',
                description: 'Food Safety and Standards Authority of India approved'
            },
            {
                image: '',
                name: 'Traditional Ayurvedic',
                description: 'Based on ancient Ayurvedic wisdom'
            }
        ],
        origin: 'India',
        processingMethod: 'Traditional extraction preserving all active compounds',
        potency: '500mg per capsule (full spectrum extract)',
        formulation: 'Vegetarian capsule, easy to digest',
        ageGroup: ['adult', 'senior'],
        gender: ['male', 'female', 'unisex'],
        season: ['monsoon', 'winter', 'all'],
        timeOfDay: ['morning', 'evening'],
        faq: [
            {
                question: 'When is the best time to take Guduchi?',
                answer: 'Guduchi is best taken on an empty stomach in the morning, or twice daily - morning and evening.'
            },
            {
                question: 'Can I take this during illness?',
                answer: 'Yes, Guduchi can support recovery, but always consult your healthcare provider for serious conditions.'
            },
            {
                question: 'How long should I take this?',
                answer: 'For immune support, take for at least 2-3 months. Can be taken long-term as a wellness supplement.'
            }
        ],
        howToUse: [
            {
                image: '',
                name: 'Timing',
                description: 'Best taken on empty stomach in morning'
            },
            {
                image: '',
                name: 'Dosage',
                description: '1-2 capsules twice daily'
            }
        ],
        howToStore: [
            {
                image: '',
                name: 'Storage',
                description: 'Store in cool, dry place away from light'
            }
        ],
        howToConsume: [
            {
                image: '',
                name: 'With Water',
                description: 'Take with warm water for best results'
            }
        ],
        metaTitle: 'Guduchi Immunity Power - Natural Immune Support | Prolific Healing',
        metaDescription: 'Premium Guduchi (Giloy) capsules for immune system support. Traditional Ayurvedic immunity booster. Buy online with free shipping.',
        keywords: ['guduchi', 'giloy', 'immunity', 'immune support', 'ayurvedic', 'tinospora', 'wellness'],
        packOptions: [
            {
                packSize: 1,
                packPrice: 549,
                savingsPercent: 15,
                label: 'Single Pack',
                image: ''
            },
            {
                packSize: 2,
                packPrice: 998,
                savingsPercent: 23,
                label: 'Buy 2 Save More',
                image: ''
            },
            {
                packSize: 3,
                packPrice: 1397,
                savingsPercent: 28,
                label: 'Family Pack',
                image: ''
            }
        ],
        freeProducts: [],
        bundleWith: [],
        offerText: 'Buy 3 Get 30% Extra Discount + Free Shipping',
        isOnOffer: true,
        freeShipping: true,
        shippingCost: 0,
        minOrderForFreeShipping: 0
    }
];

// Function to seed products
const seedProducts = async () => {
    try {
        // Wait for database connection
        await new Promise((resolve) => {
            if (mongoose.connection.readyState === 1) {
                resolve();
            } else {
                mongoose.connection.once('open', resolve);
            }
        });

        console.log('🌱 Starting product seeding...'.cyan);

        // Get first category for products (or create a default one)
        let category = await Category.findOne();
        if (!category) {
            console.log('⚠️  No category found. Creating default category...'.yellow);
            const CategoryModel = require('../models/Category');
            category = await CategoryModel.create({
                name: 'Ayurvedic Supplements',
                description: 'Traditional Ayurvedic health supplements',
                isActive: true
            });
            console.log('✅ Default category created'.green);
        }

        // Clear existing products (optional - comment out if you want to keep existing)
        // await Product.deleteMany({});
        // console.log('🗑️  Cleared existing products'.yellow);

        // Add category to all products
        const productsWithCategory = sampleProducts.map(product => ({
            ...product,
            category: category._id
        }));

        // Insert products
        const createdProducts = await Product.insertMany(productsWithCategory);
        
        console.log(`✅ Successfully seeded ${createdProducts.length} products!`.green);
        console.log('\n📦 Created Products:'.cyan);
        createdProducts.forEach((product, index) => {
            console.log(`${index + 1}. ${product.name} - ₹${product.price}`.white);
        });

        console.log('\n✨ Seeding completed successfully!'.green);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding products:'.red, error.message);
        console.error(error);
        process.exit(1);
    }
};

// Run the seeding function
seedProducts();

