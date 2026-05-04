import { useState } from "react";
import MessageList from "./MessageList";
import type { Message } from "./types";
import "./chat.css";

interface ChatPanelProps {
  messages: Message[];
  sendMessage: (message: Message) => void | Promise<void>;
  status?: string;
}

export default function ChatPanel({
  messages,
  sendMessage,
  status = "",
}: ChatPanelProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    // AI SDK / useAgentChat expect UIMessage-shaped payloads (`parts`) or `{ text }`.
    sendMessage({
      id: crypto.randomUUID(),
      role: "user",
      parts: [{ type: "text", text: input.trim() }],
    });
    setInput("");
  };
  const inStreaming = status === "submitted" || status === "streaming";
  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h2>Chat</h2>
      </div>
      <MessageList messages={messages} />
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          // disabled={inStreaming || !input.trim()}
          type="text"
          className="chat-input"
          placeholder="Describe a diagram..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="chat-send-btn">
          {inStreaming ? "..." : "send"}
        </button>
      </form>
    </div>
  );
}
