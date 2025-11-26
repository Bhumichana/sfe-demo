import { NextRequest, NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import path from 'path';
import { stat } from 'fs/promises';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), 'public/uploads');

    // Check if directory exists
    try {
      await stat(uploadsDir);
    } catch {
      // Directory doesn't exist, return empty array
      return NextResponse.json({
        photos: [],
      });
    }

    // Read all files in uploads directory
    const files = await readdir(uploadsDir);

    // Filter files for this user and parse metadata
    const userPhotos = files
      .filter((filename) => filename.startsWith(userId))
      .map((filename) => {
        // Parse filename: userId_timestamp_category.jpg
        const parts = filename.replace('.jpg', '').split('_');
        const timestamp = parts[1] ? parseInt(parts[1]) : null;
        const category = parts[2] || 'other';

        return {
          url: `/uploads/${filename}`,
          filename,
          category,
          timestamp: timestamp ? new Date(timestamp).toISOString() : null,
          // Note: Location data is in watermark, not available in filename
        };
      })
      .sort((a, b) => {
        // Sort by timestamp descending (newest first)
        if (!a.timestamp || !b.timestamp) return 0;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

    return NextResponse.json({
      photos: userPhotos,
      count: userPhotos.length,
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}
