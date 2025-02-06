import mongoose from "mongoose";

const restaurantOwnerSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    contactNumber: { type: String, required: true },
    role: { type: String, default: "restaurant-owner" }, // Default role
    subscriptionPlan: { type: String, default: "Basic" }, // Default plan
    restaurants: [
      {
        name: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        cuisineType: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

const RestaurantOwner =
  mongoose.models.RestaurantOwner ||
  mongoose.model("RestaurantOwner", restaurantOwnerSchema);

export default RestaurantOwner;
