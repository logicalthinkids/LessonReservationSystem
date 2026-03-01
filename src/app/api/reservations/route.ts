import { NextResponse } from 'next/server';
import { readSessions, addReservation, Reservation } from '@/lib/storage';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { trialSessionId, participantName, birthDate, grade, phoneNumber, email, preferredCampus } = data;

        if (!trialSessionId || !participantName || !email || !preferredCampus) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const [sessions, reservations] = await Promise.all([
            import('@/lib/storage').then(m => m.readSessions()),
            import('@/lib/storage').then(m => m.readReservations())
        ]);
        const session = sessions.find(s => s.id === trialSessionId);
        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const currentReservations = reservations.filter(r => r.trialSessionId === trialSessionId);
        if (currentReservations.length >= session.capacity) {
            return NextResponse.json({ error: "満席のため予約できませんでした。" }, { status: 400 });
        }

        const newReservation: Reservation = {
            id: Math.random().toString(36).substr(2, 9),
            trialSessionId,
            participantName,
            birthDate,
            grade,
            phoneNumber,
            email,
            preferredCampus,
            createdAt: new Date().toISOString()
        };

        // Save to Google Sheets via GAS
        await addReservation(newReservation);

        // Email logic
        const sessionDateStr = new Date(session.startTime).toLocaleString('ja-JP', {
            month: 'long',
            day: 'numeric',
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, "") : "",
            },
        });

        const adminMailOptions = {
            from: process.env.SMTP_USER || "noreply@logicalthinkids.com",
            to: "logical.thinkids@gmail.com",
            subject: "【新規予約】体験会の予約が入りました",
            text: `
体験会の新規予約を受け付けました。

■予約内容
日時: ${sessionDateStr}
参加者: ${participantName} (${grade})
生年月日: ${birthDate}
希望校舎: ${preferredCampus}
電話番号: ${phoneNumber}
メール: ${email}
      `.trim()
        };

        const userMailOptions = {
            from: process.env.SMTP_USER || "noreply@logicalthinkids.com",
            to: email,
            subject: "【予約完了】体験会へのお申し込みありがとうございます",
            text: `
${participantName} 様

体験会へのお申し込み、誠にありがとうございます。
下記の日程で予約を承りました。

■予約内容
日時: ${sessionDateStr}
希望校舎: ${preferredCampus}

■会場
豊洲セイルパーク 2F TOYONOMA
〒135-0061 東京都江東区豊洲2丁目1−9 2F

■補足
体験会は保護者の方の同席をお願いしております。
入り口が少々分かりにくいため、当日会場が分からなくなってしまった場合は、下記連絡先までご連絡いただけますと幸いです。

当日連絡先：070-8521-1802

当日はお気をつけてお越しください。
スタッフ一同、お会いできるのを楽しみにしております。
      `.trim()
        };

        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            await transporter.sendMail(adminMailOptions).catch(err => console.error("Admin Email Error:", err));
            await transporter.sendMail(userMailOptions).catch(err => console.error("User Email Error:", err));
        } else {
            console.log("--- SMTP Config omitted. Email logging to console ---");
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Reservation Error:", error);
        return NextResponse.json({ error: "Failed to process reservation" }, { status: 500 });
    }
}
