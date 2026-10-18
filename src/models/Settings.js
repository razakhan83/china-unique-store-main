import mongoose from 'mongoose';

const AnnouncementMessageSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            trim: true,
        },
        text: {
            type: String,
            default: '',
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        _id: false,
    }
);

const CustomPageSchema = new mongoose.Schema(
    {
        slug: {
            type: String,
            required: true,
            trim: true,
        },
        title: {
            type: String,
            default: '',
            trim: true,
        },
        label: {
            type: String,
            default: '',
            trim: true,
        },
        description: {
            type: String,
            default: '',
            trim: true,
        },
        content: {
            type: String,
            default: '',
            trim: true,
        },
        seoTitle: {
            type: String,
            default: '',
            trim: true,
        },
        seoDescription: {
            type: String,
            default: '',
            trim: true,
        },
        isEnabled: {
            type: Boolean,
            default: true,
        },
        showInFooter: {
            type: Boolean,
            default: true,
        },
        sortOrder: {
            type: Number,
            default: 0,
        },
    },
    {
        _id: false,
    }
);

const SettingsSchema = new mongoose.Schema(
    {
        // Use a singleton pattern: there's only one settings doc, identified by this key
        singletonKey: {
            type: String,
            default: 'site-settings',
            unique: true,
        },

        // General Info
        storeName: {
            type: String,
            default: () => process.env.NEXT_PUBLIC_STORE_NAME || 'Store',
        },
        supportEmail: {
            type: String,
            default: '',
        },
        businessAddress: {
            type: String,
            default: '',
        },
        lightLogoUrl: {
            type: String,
            default: '',
        },
        darkLogoUrl: {
            type: String,
            default: '',
        },
        faviconUrl: {
            type: String,
            default: '',
        },
        faviconSizePx: {
            type: Number,
            default: 64,
            min: 32,
            max: 256,
        },
        logoScalePercent: {
            type: Number,
            default: 100,
            min: 60,
            max: 200,
        },
        emailLogoScalePercent: {
            type: Number,
            default: 100,
            min: 40,
            max: 200,
        },
        invoiceLogoScalePercent: {
            type: Number,
            default: 100,
            min: 40,
            max: 200,
        },
        primaryColor: {
            type: String,
            default: '#015347',
        },
        accentColor: {
            type: String,
            default: '#10b981',
        },
        marqueeText: {
            type: String,
            default: '',
        },

        // WhatsApp
        whatsappNumber: {
            type: String,
            default: '923228252592',
        },
        facebookPageUrl: {
            type: String,
            default: '',
        },
        instagramUrl: {
            type: String,
            default: '',
        },

        // Marketing / Tracking
        trackingEnabled: {
            type: Boolean,
            default: false,
        },
        facebookPixelId: {
            type: String,
            default: '',
        },
        facebookConversionsApiToken: {
            type: String,
            default: '',
        },
        facebookTestEventCode: {
            type: String,
            default: '',
        },
        tiktokPixelId: {
            type: String,
            default: '',
        },
        tiktokAccessToken: {
            type: String,
            default: '',
        },

        // Shipping Rates
        karachiDeliveryFee: {
            type: Number,
            default: 200,
        },
        outsideKarachiDeliveryFee: {
            type: Number,
            default: 300,
        },
        freeShippingThreshold: {
            type: Number,
            default: 5000,
        },

        // Banner / Notice
        announcementBarEnabled: {
            type: Boolean,
            default: true,
        },
        announcementBarText: {
            type: String,
            default: '',
        },
        announcementBarMessages: {
            type: [AnnouncementMessageSchema],
            default: [],
        },

        // Payment Methods
        codEnabled: {
            type: Boolean,
            default: true,
        },
        bankDepositEnabled: {
            type: Boolean,
            default: false,
        },
        bankDepositAccountDetails: {
            type: String,
            default: '',
        },

        // Tax Configuration
        taxEnabled: {
            type: Boolean,
            default: false,
        },
        taxRatePercent: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },

        // Inventory Alerts
        lowStockThreshold: {
            type: Number,
            default: 5,
            min: 0,
        },

        // Notification Templates
        whatsappTemplates: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        emailTemplates: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },

        // Staff Roles & Permissions
        staffMembers: {
            type: [
                new mongoose.Schema(
                    {
                        email: { type: String, required: true, lowercase: true, trim: true },
                        role: { type: String, default: 'Store Manager', trim: true },
                        permissions: { type: [String], default: [] },
                    },
                    { _id: false }
                ),
            ],
            default: [],
        },

        // Navigation Menu
        navigationMenuItems: {
            type: [
                new mongoose.Schema(
                    {
                        label: { type: String, required: true, trim: true },
                        url: { type: String, required: true, trim: true },
                        openInNewTab: { type: Boolean, default: false },
                        isEnabled: { type: Boolean, default: true },
                        sortOrder: { type: Number, default: 0 },
                    },
                    { _id: false }
                ),
            ],
            default: [],
        },

        // URL Redirects
        urlRedirects: {
            type: [
                new mongoose.Schema(
                    {
                        sourcePath: { type: String, required: true, trim: true },
                        targetPath: { type: String, required: true, trim: true },
                        statusCode: { type: Number, default: 301, enum: [301, 302] },
                        isEnabled: { type: Boolean, default: true },
                    },
                    { _id: false }
                ),
            ],
            default: [],
        },

        // Dynamically managed admin emails (in addition to ADMIN_EMAIL / ADMIN_EMAILS env vars)
        adminEmails: {
            type: [String],
            default: [],
        },
        homepageSectionOrder: {
            type: [String],
            default: [],
        },
        customPages: {
            type: [CustomPageSchema],
            default: [],
        },
        guestModeEnabled: {
            type: Boolean,
            default: false,
        },
        enableSecondaryNoc: {
            type: Boolean,
            default: false,
        },
        limitedOfferProductIds: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

const cachedSettings = mongoose.models.Settings;
if (
    cachedSettings &&
    (
        !cachedSettings.schema.path('homepageSectionOrder') ||
        !cachedSettings.schema.path('announcementBarMessages') ||
        !cachedSettings.schema.path('lightLogoUrl') ||
        !cachedSettings.schema.path('darkLogoUrl') ||
        !cachedSettings.schema.path('faviconUrl') ||
        !cachedSettings.schema.path('faviconSizePx') ||
        !cachedSettings.schema.path('logoScalePercent') ||
        !cachedSettings.schema.path('emailLogoScalePercent') ||
        !cachedSettings.schema.path('invoiceLogoScalePercent') ||
        !cachedSettings.schema.path('customPages') ||
        !cachedSettings.schema.path('guestModeEnabled') ||
        !cachedSettings.schema.path('codEnabled') ||
        !cachedSettings.schema.path('taxEnabled') ||
        !cachedSettings.schema.path('taxRatePercent') ||
        !cachedSettings.schema.path('lowStockThreshold') ||
        !cachedSettings.schema.path('whatsappTemplates') ||
        !cachedSettings.schema.path('emailTemplates') ||
        !cachedSettings.schema.path('staffMembers') ||
        !cachedSettings.schema.path('navigationMenuItems') ||
        !cachedSettings.schema.path('urlRedirects') ||
        !cachedSettings.schema.path('bankDepositEnabled') ||
        !cachedSettings.schema.path('bankDepositAccountDetails') ||
        !cachedSettings.schema.path('enableSecondaryNoc') ||
        !cachedSettings.schema.path('limitedOfferProductIds') ||
        !cachedSettings.schema.path('primaryColor') ||
        !cachedSettings.schema.path('accentColor') ||
        !cachedSettings.schema.path('marqueeText')
    )
) {
    delete mongoose.models.Settings;
}

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
