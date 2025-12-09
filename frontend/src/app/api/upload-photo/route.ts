import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

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

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${userId}_${timestamp}_${category}.jpg`;

    // Upload to Vercel Blob
    const blob = await put(filename, photo, {
      access: 'public',
    });

    // Return the Blob URL
    const url = blob.url;

    const photoData = {
      url,
      filename,
      category,
      location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
      timestamp: new Date().toISOString(),
      sizeBytes: photo.size,
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
          sizeBytes: photo.size,
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
