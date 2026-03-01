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
}

const GRADES = [
    "小学1年生", "小学2年生", "小学3年生", "小学4年生", "小学5年生", "小学6年生",
    "中学1年生", "中学2年生", "中学3年生",
    "高校1年生", "高校2年生", "高校3年生"
];

export default function BookingPage() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [completed, setCompleted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        participantName: "",
        birthDate: "",
        grade: "",
        phoneNumber: "",
        email: "",
        preferredCampus: "",
    });

    useEffect(() => {
        Promise.all([
            fetch("/api/admin/sessions").then(res => res.json()),
            fetch("/api/admin/reservations").then(res => res.json())
        ]).then(([sessionsData, reservationsData]) => {
            const now = new Date();
            const futureSessions = sessionsData.filter((s: Session) => new Date(s.startTime) > now);
            setSessions(futureSessions);
            setReservations(reservationsData);
        }).finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch("/api/reservations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, trialSessionId: selectedSessionId }),
            });

            if (!res.ok) throw new Error("予約に失敗しました。時間をおいて再度お試しください。");
            setCompleted(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="container" style={{ textAlign: "center" }}>読み込み中...</div>;

    if (completed) {
        return (
            <div className="container">
                <div className="card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
                    <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>✨</div>
                    <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>予約が完了しました</h2>
                    <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
                        ご登録いただいたメールアドレスに確認メールを送信しました。<br />
                        当日お会いできるのを楽しみにしております。
                    </p>
                    <button onClick={() => window.location.reload()} className="btn btn-primary">
                        トップに戻る
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <header style={{ textAlign: "center", marginBottom: "3rem" }}>
                <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>体験会予約システム</h1>
                <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
                    プログラミングの第一歩を、ここから始めよう。
                </p>
            </header>

            {!selectedSessionId ? (
                <section>
                    <h2 style={{ marginBottom: "2rem", textAlign: "center" }}>日程を選択してください</h2>
                    <div style={{ display: "grid", gap: "1rem" }}>
                        {sessions.map(session => {
                            const currentCount = reservations.filter(r => r.trialSessionId === session.id).length;
                            const remaining = session.capacity - currentCount;
                            const isFull = remaining <= 0;

                            return (
                                <div
                                    key={session.id}
                                    className="card"
                                    style={{
                                        cursor: isFull ? "default" : "pointer",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "1.5rem",
                                        opacity: isFull ? 0.7 : 1,
                                        backgroundColor: isFull ? "#f8f9fa" : "white"
                                    }}
                                    onClick={() => !isFull && setSelectedSessionId(session.id)}
                                >
                                    <div>
                                        <div style={{ fontWeight: "700", fontSize: "1.2rem" }}>
                                            {new Date(session.startTime).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}
                                        </div>
                                        <div style={{ color: "var(--text-muted)" }}>
                                            {new Date(session.startTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} 〜
                                            {new Date(session.endTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        {isFull ? (
                                            <div style={{ color: "red", fontWeight: "700", marginBottom: "0.5rem" }}>満席</div>
                                        ) : (
                                            <div style={{ color: "var(--primary)", fontWeight: "600", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                                                残り{remaining}席
                                            </div>
                                        )}
                                        <div className={`btn ${isFull ? 'btn-secondary' : 'btn-primary'}`} style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}>
                                            {isFull ? "受付終了" : "選択する"}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {sessions.length === 0 && (
                            <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "3rem" }}>
                                現在募集中の体験会はありません。
                            </p>
                        )}
                    </div>
                </section>
            ) : (
                <section className="card">
                    <button onClick={() => setSelectedSessionId(null)} className="btn btn-secondary" style={{ marginBottom: "2rem" }}>
                        ← 日程を選び直す
                    </button>
                    <h2 style={{ marginBottom: "2rem" }}>参加者情報の入力</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>参加者氏名</label>
                            <input
                                type="text"
                                placeholder="例：山田 太郎"
                                required
                                value={formData.participantName}
                                onChange={e => setFormData({ ...formData, participantName: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>生年月日</label>
                            <input
                                type="date"
                                required
                                value={formData.birthDate}
                                onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>学年</label>
                            <select
                                required
                                value={formData.grade}
                                onChange={e => setFormData({ ...formData, grade: e.target.value })}
                            >
                                <option value="">選択してください</option>
                                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>電話番号</label>
                            <input
                                type="tel"
                                placeholder="例：090-1234-5678"
                                required
                                value={formData.phoneNumber}
                                onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>メールアドレス</label>
                            <input
                                type="email"
                                placeholder="例：example@mail.com"
                                required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>ご入会時の希望校舎</label>
                            <select
                                required
                                value={formData.preferredCampus}
                                onChange={e => setFormData({ ...formData, preferredCampus: e.target.value })}
                            >
                                <option value="">選択してください</option>
                                <option value="豊洲校">豊洲校</option>
                                <option value="晴海校">晴海校</option>
                            </select>
                            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                                ※ご検討されている校舎の選択をお願いいたします。
                            </p>
                        </div>
                        {error && <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}
                        <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "1.25rem" }} disabled={submitting}>
                            {submitting ? "送信中..." : "予約を確定する"}
                        </button>
                    </form>
                </section>
            )}
        </div>
    );
}
