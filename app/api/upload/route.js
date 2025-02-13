//for image handling
import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "@/lib/aws-config";
import { v4 as uuidv4 } from 'uuid';

export async function POST(req) {
  try {
    const data = await req.formData();
    const file = data.get('file');
    const type = data.get('type'); // 'restaurant', 'customer', 'review'

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Determine folder based on upload type
    const folder = type === 'restaurant' ? 'restaurant-images' :
                  type === 'customer' ? 'customer-profiles' :
                  type === 'review' ? 'review-images' :
                  'misc-uploads';

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;

    // Upload to S3 in appropriate folder
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${folder}/${fileName}`,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read',
    });

    await s3Client.send(command);

    // Generate URL
    const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${folder}/${fileName}`;

    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: "Error uploading file" },
      { status: 500 }
    );
  }
} 