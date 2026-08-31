"use client";
import { useState } from "react";

export default function ReviewForm({ orderId, alreadyReviewed }: { orderId: string; alreadyReviewed: boolean }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(alreadyReviewed);
  const [loading, setLoading] = useState(false);

  if (done) return <p className="text-center text-xs text-gray-400">Thanks for your feedback.</p>;

  async function submit() {
    setLoading(true);
    const res = await fetch(`/api/orders/${orderId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment }),
    });
    setLoading(false);
    if (res.ok) setDone(true);
  }

  return (
    <div className="card space-y-2">
      <h3 className="text-sm font-bold text-gray-800">Rate this transaction</h3>
      <div className="flex gap-1 text-2xl">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)}>{n <= rating ? "★" : "☆"}</button>
        ))}
      </div>
      <textarea className="input-field" rows={2} placeholder="Comment (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
      <button className="btn-primary" disabled={loading} onClick={submit}>{loading ? "Submitting…" : "Submit review"}</button>
    </div>
  );
}
