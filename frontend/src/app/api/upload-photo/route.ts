import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const photo = formData.get('photo') as File;
    const category = formData.get('category') as string;
    const userId = formData.get('userId') as string;
    const callReportId = formData.get('callReportId') as string | null;
    const lat = formData.get('lat') as string | null;
    const lng = formData.get('lng') as string | null;

    if (!photo) {
      return NextResponse.json(
        { error: 'No photo provided' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${userId}_${timestamp}_${category}.jpg`;

    // Save to public/uploads directory
    const filepath = path.join(process.cwd(), 'public/uploads', filename);
    await writeFile(filepath, buffer);

    // Return the URL
    const url = `/uploads/${filename}`;

    const photoData = {
      url,
      filename,
      category,
      location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
      timestamp: new Date().toISOString(),
      sizeBytes: buffer.length,
      callReportId: callReportId || null,
    };

    // If callReportId is provided, save to database via backend API
    if (callReportId) {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const apiUrl = `${backendUrl}/call-reports/${callReportId}/photos`;

        const payload = {
          category: category.toUpperCase(),
          url,
          thumbnailUrl: url, // Same as url for now
          lat: lat ? parseFloat(lat) : null,
          lng: lng ? parseFloat(lng) : null,
          timestamp: new Date().toISOString(),
          sizeBytes: buffer.length,
        };

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Backend API failed: ${response.status} - ${errorText}`);
        }

        const savedPhoto = await response.json();
      } catch (error) {
        console.error('❌ Error saving photo to database:', error);
        throw error; // Don't swallow the error - let the user know
      }
    }

    return NextResponse.json({
      success: true,
      ...photoData,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
