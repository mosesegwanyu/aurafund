import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { supabaseAdmin, CAMPAIGN_IMAGES_BUCKET } from '@/lib/supabase-admin';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: { user: { select: { name: true } } },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (err) {
    console.error('Get campaign error:', err);
    return NextResponse.json({ error: 'Failed to load campaign.' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const existing = await prisma.campaign.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 });
    }
    if (existing.userId !== session.id && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'You do not have permission to edit this campaign.' }, { status: 403 });
    }

    const formData = await req.formData();
    const title = formData.get('title')?.toString().trim();
    const description = formData.get('description')?.toString().trim();
    const targetAmountRaw = formData.get('targetAmount')?.toString();
    const imageFile = formData.get('image');
    const removeImage = formData.get('removeImage')?.toString() === 'true';

    if (!title || !description || !targetAmountRaw) {
      return NextResponse.json({ error: 'Title, description, and target amount are required.' }, { status: 400 });
    }

    const targetAmount = Number(targetAmountRaw);
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      return NextResponse.json({ error: 'Target amount must be a valid positive number.' }, { status: 400 });
    }

    let imageUrl: string | null | undefined = undefined; // undefined = leave unchanged

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
    } else if (removeImage) {
      imageUrl = null;
    }

    const campaign = await prisma.campaign.update({
      where: { id: params.id },
      data: {
        title,
        description,
        targetAmount,
        ...(imageUrl !== undefined ? { imageUrl } : {}),
      },
    });

    return NextResponse.json({ success: true, campaign });
  } catch (err) {
    console.error('Update campaign error:', err);
    return NextResponse.json({ error: 'Failed to update campaign.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const existing = await prisma.campaign.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 });
    }
    if (existing.userId !== session.id && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'You do not have permission to delete this campaign.' }, { status: 403 });
    }

    await prisma.campaign.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete campaign error:', err);
    return NextResponse.json({ error: 'Failed to delete campaign.' }, { status: 500 });
  }
}
