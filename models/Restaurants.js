import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema({
  floorplanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Floorplan'
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RestaurantOwner",
    required: true,
  },
  restaurantName: {
    type: String,
    required: true,
  },
  cuisineType: {
    type: String,
    required: true,
  },
  location: {
    address: String,
    placeId: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  description: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: String,
    default: ""
  },
  openingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String },
  },
  images: {
    main: { type: String, default: "" },
    gallery: [{ type: String }],
    menu: [{ type: String }]
  },
  rating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const Restaurant = mongoose.models.Restaurant || mongoose.model("Restaurant", restaurantSchema);

export default Restaurant;
