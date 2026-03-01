import { NextResponse } from 'next/server';
import { readSessions, readReservations } from '@/lib/storage';

export async function GET() {
    try {
        const [sessions, reservations] = await Promise.all([
            readSessions(),
            readReservations()
        ]);

        // Join reservations with their respective trial sessions
        const joinedReservations = reservations.map(res => ({
            ...res,
            trialSession: sessions.find(s => s.id === res.trialSessionId)
        })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json(joinedReservations);
    } catch (error) {
        console.error("Reservation fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch reservations" }, { status: 500 });
    }
}
