"use client";

import { useState, useEffect } from "react";

interface Session {
    id: string;
    startTime: string;
    endTime: string;
    capacity: number;
}

interface Reservation {
    id: string;
    trialSessionId: string;
    participantName: string;
    birthDate: string;
    grade: string;
    phoneNumber: string;
    email: string;
    createdAt: string;
    preferredCampus: string;
    trialSession?: Session;
}

const toShortGrade = (grade: string) => {
    return grade
        .replace("小学", "小")
        .replace("中学", "中")
        .replace("高校", "高")
        .replace("年生", "");
};

const snapTo10Min = (dateTimeStr: string) => {
    if (!dateTimeStr) return "";
    const date = new Date(dateTimeStr);
    const minutes = date.getMinutes();
    const roundedMinutes = Math.round(minutes / 10) * 10;
    date.setMinutes(roundedMinutes);
    date.setSeconds(0);
    date.setMilliseconds(0);

    // Format back to YYYY-MM-DDTHH:mm for datetime-local input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${mins}`;
};

export default function AdminPage() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [capacity, setCapacity] = useState("6");
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const [sessionsRes, reservationsRes] = await Promise.all([
                fetch("/api/admin/sessions"),
                fetch("/api/admin/reservations")
            ]);
            const [sessionsData, reservationsData] = await Promise.all([
                sessionsRes.json(),
                reservationsRes.json()
            ]);
            setSessions(sessionsData);
            setReservations(reservationsData);
        } catch (err) {
            setError("データの取得に失敗しました。");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        fetchData();
    }, []);

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/admin/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ startTime, endTime, capacity: parseInt(capacity) }),
            });
            if (!res.ok) throw new Error("セッションの作成に失敗しました。");
            setStartTime("");
            setEndTime("");
            fetchData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDeleteSession = async (id: string) => {
        if (!confirm("この体験会を削除してもよろしいですか？")) return;
        try {
            const res = await fetch(`/api/admin/sessions?id=${id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "削除に失敗しました。");
            fetchData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    if (loading) return <div className="container">読み込み中...</div>;

    return (
        <div className="container" style={{ maxWidth: "1200px" }}>
            <header style={{ marginBottom: "3rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1>管理者ダッシュボード</h1>
                <a href="/" className="btn btn-secondary">利用者画面を表示</a>
            </header>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "2rem" }}>
                {/* Session Management */}
                <section>
                    <div className="card">
                        <h2 style={{ marginBottom: "1.5rem" }}>新規体験会の設定</h2>
                        <form onSubmit={handleCreateSession}>
                            <div className="form-group">
                                <label>開始日時</label>
                                <input
                                    type="datetime-local"
                                    step="600"
                                    required
                                    value={startTime}
                                    onChange={e => setStartTime(snapTo10Min(e.target.value))}
                                />
                            </div>
                            <div className="form-group">
                                <label>終了日時</label>
                                <input
                                    type="datetime-local"
                                    step="600"
                                    required
                                    value={endTime}
                                    onChange={e => setEndTime(snapTo10Min(e.target.value))}
                                />
                            </div>
                            <div className="form-group">
                                <label>定員（人数）</label>
                                <input type="number" required min="1" value={capacity} onChange={e => setCapacity(e.target.value)} />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>体験会を追加する</button>
                        </form>
                    </div>

                    <div className="card">
                        <h2 style={{ marginBottom: "1.5rem" }}>設定済みの日程</h2>
                        <div style={{ overflowX: "auto" }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>日時</th>
                                        <th>定員</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sessions.map(s => (
                                        <tr key={s.id}>
                                            <td style={{ fontSize: "0.9rem" }}>
                                                {mounted ? (
                                                    <>
                                                        {new Date(s.startTime).toLocaleDateString('ja-JP')} {new Date(s.startTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} 〜
                                                    </>
                                                ) : "読み込み中..."}
                                            </td>
                                            <td>{s.capacity}名</td>
                                            <td>
                                                <button
                                                    onClick={() => handleDeleteSession(s.id)}
                                                    style={{ color: "red", background: "none", border: "none", cursor: "pointer", fontWeight: "600" }}
                                                >
                                                    削除
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {sessions.length === 0 && (
                                        <tr><td colSpan={2} style={{ textAlign: "center", color: "var(--text-muted)" }}>設定なし</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Reservations List */}
                <section>
                    <div className="card" style={{ height: "100%" }}>
                        <h2 style={{ marginBottom: "1.5rem" }}>予約者一覧</h2>
                        <div style={{ overflowX: "auto" }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>参加者</th>
                                        <th style={{ whiteSpace: "nowrap" }}>学年</th>
                                        <th style={{ whiteSpace: "nowrap" }}>日程</th>
                                        <th>希望校舎</th>
                                        <th>連絡先</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reservations.map(r => (
                                        <tr key={r.id}>
                                            <td>{r.participantName}</td>
                                            <td style={{ whiteSpace: "nowrap" }}>{toShortGrade(r.grade)}</td>
                                            <td style={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                                                {mounted ? (
                                                    r.trialSession ? new Date(r.trialSession.startTime).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' }) : "不明"
                                                ) : "..."}
                                            </td>
                                            <td style={{ whiteSpace: "nowrap" }}>
                                                <span style={{ fontSize: "0.85rem", padding: "0.25rem 0.5rem", borderRadius: "4px", backgroundColor: "#e9ecef" }}>
                                                    {r.preferredCampus}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: "0.8rem" }}>{r.phoneNumber}</div>
                                                <div style={{ fontSize: "0.8rem", color: "var(--primary)" }}>{r.email}</div>
                                            </td>
                                        </tr>
                                    ))}
                                    {reservations.length === 0 && (
                                        <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>予約はまだありません</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
