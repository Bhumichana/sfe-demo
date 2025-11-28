import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Check if we have Vercel Blob token
    const hasVerceldToken = !!process.env.BLOB_READ_WRITE_TOKEN;

    if (hasVerceldToken) {
      // Use Vercel Blob for production
      try {
        const blob = await put(file.name, file, {
          access: 'public',
        });

        return NextResponse.json({
          url: blob.url,
          downloadUrl: blob.downloadUrl,
        });
      } catch (blobError) {
        console.error('Vercel Blob error:', blobError);
        // Fall back to base64 if Vercel Blob fails
      }
    }

    // Use base64 for development or fallback
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      url: dataUrl,
      downloadUrl: dataUrl,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
