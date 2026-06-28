"use client";

import React, { useMemo, useRef, useState } from "react";
import { apiFetchJson } from "@/utils/api";

type ChatRole = "user" | "assistant";
type UiMessage = { role: ChatRole; content: string };

type AiChatResponse = {
  reply: string;
  model: string;
};

export default function AiChatPage() {
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      role: "assistant",
      content: "สวัสดีครับ ต้องการให้ช่วยเรื่องอะไร?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const canSend = input.trim().length > 0 && !isSending;

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  const send = async () => {
    const content = input.trim();
    if (!content || isSending) return;

    setIsSending(true);
    setInput("");

    setMessages((prev) => [...prev, { role: "user", content }]);
    queueMicrotask(scrollToBottom);

    try {
      const history = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await apiFetchJson<AiChatResponse>("/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, history }),
        timeoutMs: 60_000,
        skipAuthRedirect: true,
      });

      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
      queueMicrotask(scrollToBottom);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">AI Chat</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">คุยกับผู้ช่วย AI ผ่าน API ของระบบ</p>
        </div>
        <button
          type="button"
          onClick={() => setMessages([{ role: "assistant", content: "เริ่มใหม่ได้เลยครับ" }])}
          className="px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900"
        >
          ล้างแชท
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div ref={scrollRef} className="h-[60vh] overflow-y-auto p-4 space-y-3">
          {messages.map((m, idx) => (
            <div
              key={`${idx}-${m.role}`}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={[
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                  m.role === "user"
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100",
                ].join(" ")}
              >
                {m.content}
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
                กำลังพิมพ์…
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 p-3">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="พิมพ์ข้อความ (Enter เพื่อส่ง, Shift+Enter ขึ้นบรรทัดใหม่)"
              className="flex-1 resize-none min-h-[44px] max-h-40 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-brand-500"
              disabled={isSending}
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={!canSend}
              className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-700"
            >
              ส่ง
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            ถ้า API ไม่ตอบ ให้ตรวจ{" "}
            <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-900">OPENAI_API_KEY</code> ใน{" "}
            <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-900">cci-backend/.env</code>
          </div>
        </div>
      </div>
    </div>
  );
}
