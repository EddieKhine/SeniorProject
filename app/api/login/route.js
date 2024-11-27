import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import User from '@/models/user';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Connect to the database
    const db = await dbConnect();
    console.log("Database connection established:", db);

    // Find user by email (removed the 'name' check)
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Compare passwords
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return NextResponse.json({ message: 'Invalid password' }, { status: 401 });
    }

    // If login is successful
    return NextResponse.json({ message: 'Login successful', name: user.name, email: user.email });
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
