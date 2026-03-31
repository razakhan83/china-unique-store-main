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
            default: 'China Unique Store',
        },
        supportEmail: {
            type: String,
            default: '',
        },
        businessAddress: {
            type: String,
            default: '',
        },

        // WhatsApp
        whatsappNumber: {
            type: String,
            default: '',
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
            default: 0,
        },
        outsideKarachiDeliveryFee: {
            type: Number,
            default: 0,
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

        // Dynamically managed admin emails (in addition to ADMIN_EMAIL / ADMIN_EMAILS env vars)
        adminEmails: {
            type: [String],
            default: [],
        },
        homepageSectionOrder: {
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
        !cachedSettings.schema.path('announcementBarMessages')
    )
) {
    delete mongoose.models.Settings;
}

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
