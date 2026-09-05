import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { supabaseAdmin, CAMPAIGN_IMAGES_BUCKET } from '@/lib/supabase-admin';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    });
    return NextResponse.json({ campaigns });
  } catch (err) {
    console.error('List campaigns error:', err);
    return NextResponse.json({ error: 'Failed to load campaigns.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const formData = await req.formData();
    const title = formData.get('title')?.toString().trim();
    const description = formData.get('description')?.toString().trim();
    const targetAmountRaw = formData.get('targetAmount')?.toString();
    const imageFile = formData.get('image');

    if (!title || !description || !targetAmountRaw) {
      return NextResponse.json({ error: 'Title, description, and target amount are required.' }, { status: 400 });
    }

    const targetAmount = Number(targetAmountRaw);
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      return NextResponse.json({ error: 'Target amount must be a valid positive number.' }, { status: 400 });
    }

    let imageUrl: string | undefined;

    if (imageFile instanceof File && imageFile.size > 0) {
      if (!ALLOWED_TYPES.includes(imageFile.type)) {
        return NextResponse.json({ error: 'Image must be a JPEG, PNG, WEBP, or GIF file.' }, { status: 400 });
      }
      if (imageFile.size > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: 'Image must be smaller than 5MB.' }, { status: 400 });
      }

      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const extension = imageFile.name.split('.').pop() || 'jpg';
      const filePath = `${session.id}/${Date.now()}.${extension}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from(CAMPAIGN_IMAGES_BUCKET)
        .upload(filePath, buffer, {
          contentType: imageFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Campaign image upload error:', uploadError);
        return NextResponse.json({ error: 'Failed to upload campaign photo.' }, { status: 500 });
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from(CAMPAIGN_IMAGES_BUCKET)
        .getPublicUrl(filePath);

      imageUrl = publicUrlData.publicUrl;
    }

    const campaign = await prisma.campaign.create({
      data: {
        title,
        description,
        targetAmount,
        imageUrl,
        userId: session.id,
      },
    });

    return NextResponse.json({ success: true, campaign }, { status: 201 });
  } catch (err) {
    console.error('Create campaign error:', err);
    return NextResponse.json({ error: 'Failed to create campaign.' }, { status: 500 });
  }
}
