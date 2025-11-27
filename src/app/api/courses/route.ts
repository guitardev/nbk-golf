import { NextResponse } from 'next/server';
import { db, Course } from '@/lib/googleSheets';
import { checkAdminAuth, getUnauthorizedResponse } from '@/lib/serverAuth';

export async function GET() {
    try {
        const courses = await db.courses.getAll();
        return NextResponse.json(courses);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = request.headers.get('x-user-id') || '123';

        if (!checkAdminAuth(userId)) {
            return getUnauthorizedResponse();
        }

        const body = await request.json();
        const newCourse: Course = {
            id: Date.now().toString(),
            ...body,
        };
        await db.courses.add(newCourse);
        return NextResponse.json(newCourse);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to add course' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const userId = request.headers.get('x-user-id') || '123';

        if (!checkAdminAuth(userId)) {
            return getUnauthorizedResponse();
        }

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
        }

        const success = await db.courses.update(id, updates);

        if (!success) {
            return NextResponse.json({ error: 'Course not found or update failed' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Course updated successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const userId = request.headers.get('x-user-id') || '123';

        if (!checkAdminAuth(userId)) {
            return getUnauthorizedResponse();
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
        }

        const success = await db.courses.delete(id);

        if (!success) {
            return NextResponse.json({ error: 'Course not found or delete failed' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Course deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
    }
}
