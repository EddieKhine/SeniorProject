import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Restaurant from '@/models/Restaurants';


// ... existing GET method ...

export async function PUT(request, { params }) {
    try {
        await connectDB();
        const { id } = params;
        const updateData = await request.json();
        
        const restaurant = await Restaurant.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );

        if (!restaurant) {
            return NextResponse.json(
                { error: 'Restaurant not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(restaurant);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update restaurant' },
            { status: 500 }
        );
    }
}