import { NextResponse } from 'next/server';
import { readSessions, addSession, Session } from '@/lib/storage';

export async function GET() {
    try {
        const sessions = await readSessions();
        return NextResponse.json(sessions);
    } catch (error) {
        console.error("Session fetch error:", error);
        return NextResponse.json([]);
    }
}

export async function POST(request: Request) {
    try {
        const { startTime, endTime, capacity } = await request.json();
        if (!startTime || !endTime) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newSession: Session = {
            id: Math.random().toString(36).substr(2, 9),
            startTime,
            endTime,
            capacity: Number(capacity) || 6
        };

        await addSession(newSession);

        return NextResponse.json(newSession);
    } catch (error) {
        console.error("Reservation fetch error:", error);
        return NextResponse.json([]);
    }
}

export async function DELETE(request: Request) {
    return NextResponse.json({
        error: "Please delete rows directly in the Google Spreadsheet for safety."
    }, { status: 400 });
}
