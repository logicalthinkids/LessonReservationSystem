export interface Session {
    id: string;
    startTime: string;
    endTime: string;
    capacity: number;
}

export interface Reservation {
    id: string;
    trialSessionId: string;
    participantName: string;
    birthDate: string;
    grade: string;
    phoneNumber: string;
    email: string;
    createdAt: string;
    preferredCampus: string;
}

const GAS_URL = process.env.GAS_URL;

export const readSessions = async (): Promise<Session[]> => {
    if (!GAS_URL) throw new Error("GAS_URL is not set");
    const res = await fetch(`${GAS_URL}?sheetName=sessions`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((s: any) => ({
        ...s,
        capacity: Number(s.capacity) || 0
    }));
};

export const readReservations = async (): Promise<Reservation[]> => {
    if (!GAS_URL) throw new Error("GAS_URL is not set");
    const res = await fetch(`${GAS_URL}?sheetName=reservations`);
    if (!res.ok) return [];
    return res.json();
};

export const addSession = async (session: Session) => {
    if (!GAS_URL) throw new Error("GAS_URL is not set");
    const res = await fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify({
            sheetName: "sessions",
            values: [session.id, session.startTime, session.endTime, session.capacity]
        })
    });
    return res;
};

export const addReservation = async (reservation: Reservation) => {
    if (!GAS_URL) throw new Error("GAS_URL is not set");
    const res = await fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify({
            sheetName: "reservations",
            values: [
                reservation.id,
                reservation.trialSessionId,
                reservation.participantName,
                reservation.birthDate,
                reservation.grade,
                reservation.phoneNumber,
                reservation.email,
                reservation.createdAt,
                reservation.preferredCampus
            ]
        })
    });
    return res;
};

// NOTE: GAS direct deletion via append-only script is tricky. 
// For now, we will handle deletion by not adding more complex logic to GAS.
// The user can manage/delete rows directly in the Spreadsheet.
export const deleteSession = async (id: string) => {
    console.warn("Direct deletion via GAS not implemented. Please delete from Spreadsheet.");
    // Traditional JSON logic is removed.
};
