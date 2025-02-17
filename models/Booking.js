import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    bookingRef: {
        type: String,
        unique: true,
        // Will be auto-generated in pre-save
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    floorplanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Floorplan',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tableId: {
        type: String,
        required: true        // This will store the friendly ID (e.g., 't1')
    },
    originalTableId: {        // Add this new field
        type: String,
        required: false       // Optional, stores the original UUID if needed
    },
    customerName: {
        type: String,
        required: [true, 'Please provide customer name']
    },
    customerEmail: {
        type: String,
        required: [true, 'Please provide customer email'],
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    customerPhone: {
        type: String,
        required: [true, 'Please provide customer phone number']
    },
    date: {
        type: Date,
        required: [true, 'Please provide booking date']
    },
    startTime: {
        type: String,
        required: [true, 'Please provide booking start time']
    },
    endTime: {
        type: String,
        required: [true, 'Please provide booking end time']
    },
    guestCount: {
        type: Number,
        required: [true, 'Please provide number of guests'],
        min: [1, 'Must have at least 1 guest']
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    specialRequests: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Generate booking reference number before saving
bookingSchema.pre('save', async function(next) {
    if (!this.bookingRef) {
        // Generate date-based prefix (e.g., "BK230224" for Feb 24, 2023)
        const datePrefix = new Date().toISOString().slice(2,8).replace(/-/g, '');
        
        // Find the latest booking number for today
        const latestBooking = await this.constructor.findOne(
            { bookingRef: new RegExp(`^BK${datePrefix}`) },
            { bookingRef: 1 },
            { sort: { bookingRef: -1 } }
        );

        // Generate new sequence number
        let sequenceNumber = '001';
        if (latestBooking && latestBooking.bookingRef) {
            const lastSequence = parseInt(latestBooking.bookingRef.slice(-3));
            sequenceNumber = String(lastSequence + 1).padStart(3, '0');
        }

        // Combine to create booking reference (e.g., "BK230224001")
        this.bookingRef = `BK${datePrefix}${sequenceNumber}`;
    }
    next();
});

// Indexes for querying bookings efficiently
bookingSchema.index({ restaurantId: 1, date: 1 });
bookingSchema.index({ tableId: 1, date: 1 });
bookingSchema.index({ userId: 1 });
bookingSchema.index({ bookingRef: 1 }, { unique: true });

// Method to check if table is available for a specific time
bookingSchema.statics.isTableAvailable = async function(tableId, date, startTime, endTime) {
    const existingBooking = await this.findOne({
        $or: [
            { tableId: tableId },
            { originalTableId: tableId }
        ],
        date,
        $or: [
            {
                $and: [
                    { startTime: { $lt: endTime } },
                    { endTime: { $gt: startTime } }
                ]
            }
        ],
        status: { $in: ['pending', 'confirmed'] }
    });
    return !existingBooking;
};

// Method to get all bookings for a restaurant on a specific date
bookingSchema.statics.getRestaurantBookings = async function(restaurantId, date) {
    return this.find({
        restaurantId,
        date,
        status: { $in: ['pending', 'confirmed'] }
    })
    .populate('userId', 'firstName lastName contactNumber')
    .sort({ time: 1 });
};

// Method to get table bookings
bookingSchema.statics.getTableBookings = async function(tableId, date) {
    return this.find({
        $or: [
            { tableId: tableId },
            { originalTableId: tableId }
        ],
        date,
        status: { $in: ['pending', 'confirmed'] }
    })
    .populate('userId', 'firstName lastName contactNumber')
    .sort({ time: 1 });
};

// Method to find booking by reference
bookingSchema.statics.findByBookingRef = async function(bookingRef) {
    return this.findOne({ bookingRef });
};

// Method to get bookings for a specific user
bookingSchema.statics.getUserBookings = async function(userId) {
    return this.find({ userId })
        .populate('restaurantId')
        .sort({ date: -1, time: -1 });
};

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

export default Booking; 