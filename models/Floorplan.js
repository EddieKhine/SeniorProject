import mongoose from 'mongoose';

const floorplanSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Please provide a name for the floorplan'],
        trim: true
    },
    data: {
        objects: [{
            type: {
                type: String,
                required: true,
                enum: ['wall', 'door', 'window', 'furniture']
            },
            objectId: {
                type: String,
                required: true
            },
            position: [Number],
            rotation: {
                x: Number,
                y: Number,
                z: Number,
                order: String
            },
            scale: [Number],
            userData: {
                type: Map,
                of: mongoose.Schema.Types.Mixed
            }
        }],
        version: {
            type: Number,
            default: 1
        }
    }
}, {
    timestamps: true
});

// Prevent mongoose from creating a plural collection name
const Floorplan = mongoose.models.Floorplan || mongoose.model('Floorplan', floorplanSchema);

export default Floorplan; 