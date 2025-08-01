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
        required: false, // Made optional to support Google login users without phone numbers
        default: 'Not provided'
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
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentIntentId: {
        type: String,
        default: null
    },
    paidAt: {
        type: Date,
        default: null
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'usd'
    },
    specialRequests: {
        type: String,
        default: ''
    },
    history: [{
        action: {
            type: String,
            enum: ['created', 'modified', 'cancelled', 'completed'],
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        details: {
            type: Map,
            of: mongoose.Schema.Types.Mixed
        }
    }]
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
bookingSchema.index({ 'history.timestamp': 1 });

// Compound indexes for better performance
bookingSchema.index({ restaurantId: 1, date: 1, status: 1 });
bookingSchema.index({ tableId: 1, date: 1, status: 1 });
bookingSchema.index({ userId: 1, date: -1 });
bookingSchema.index({ status: 1, date: 1 });

// Method to check if table is available for a specific time
bookingSchema.statics.isTableAvailable = async function(tableId, date, startTime, endTime) {
    console.log('Checking availability for:', { tableId, date, startTime, endTime });
    
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    // Optimized query using compound index
    const existingBooking = await this.findOne({
        tableId: tableId,
        date: bookingDate,
        status: { $in: ['pending', 'confirmed'] },
        $or: [
            { tableId: tableId },
            { originalTableId: tableId }
        ]
    }).select('_id startTime endTime').lean();

    if (!existingBooking) {
        return true; // No bookings found, table is available
    }

    // Time overlap check (only if booking exists)
    const timeToMinutes = (timeStr) => {
        const [time, period] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
    };

    const requestStart = timeToMinutes(startTime);
    const requestEnd = timeToMinutes(endTime);
    const bookingStart = timeToMinutes(existingBooking.startTime);
    const bookingEnd = timeToMinutes(existingBooking.endTime);

    // Check for time overlap
    const hasOverlap = bookingStart < requestEnd && bookingEnd > requestStart;

    console.log(`Checking table ${tableId} for date ${bookingDate}:`, 
        hasOverlap ? 'Booked' : 'Available'
    );

    return !hasOverlap;
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

// Add a method to record history
bookingSchema.methods.addToHistory = function(action, details = {}) {
    // Check for duplicate recent entries (within last 5 seconds)
    const now = new Date();
    const fiveSecondsAgo = new Date(now.getTime() - 5000);
    
    const recentDuplicate = this.history.find(entry => {
        if (entry.action !== action) return false;
        if (entry.timestamp < fiveSecondsAgo) return false;
        
        // Check if details are the same
        if (action === 'modified' && details.previousStatus && details.newStatus) {
            return entry.details.get('previousStatus') === details.previousStatus &&
                   entry.details.get('newStatus') === details.newStatus;
        }
        
        return false;
    });
    
    // Only add if no recent duplicate found
    if (!recentDuplicate) {
        this.history.push({
            action,
            details
        });
    }
};

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

export default Booking; 