import MarkdownRenderer from "./MarkdownRenderer";
import type { Message } from "./types";
import ToolStatus from "../streaming/ToolStatus";
import "../streaming/streaming.css";
interface MessageBubbleProps {
  message: Message;
}

// Small models occasionally emit a tool-call as plain text instead of via
// the tool-call channel (e.g. `{"name": "generateDiagram", "parameters": ...}`
// or `{"elements": [...]}`). The real tool call still renders below via the
// `tool-*` part, so showing the raw JSON in the chat bubble is just visual
// noise. This heuristic catches the common shapes from our two tool schemas.
function looksLikeToolCallLeak(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return false;
  return (
    /"name"\s*:\s*"(generateDiagram|modifyDiagram)"/i.test(trimmed) ||
    /"parameters"\s*:\s*\{/.test(trimmed) ||
    /"elements"\s*:\s*\[/.test(trimmed) ||
    /"elementId"\s*:[\s\S]*"updates"\s*:/.test(trimmed)
  );
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div className={`message-bubble ${message.role}`}>
      <div className="message-role">
        {message.role === "user" ? "You" : "Assistant"}
      </div>
      <div className="message-content">
        {(Array.isArray(message.parts) ? message.parts : []).map((part, i) => {
          if (part.type === "text") {
            if (
              message.role === "assistant" &&
              looksLikeToolCallLeak(part.text)
            ) {
              return null;
            }
            if (message.role === "assistant") {
              return <MarkdownRenderer key={i} content={part.text} />;
            }
            return <p key={i}>{part.text}</p>;
          }
          if (part.type?.startsWith("tool-")) {
            const toolname = part.type.replace("tool-", "");
            const toolPart = part as { state?: string };
            const status =
              toolPart.state === "output-available"
                ? "complete"
                : toolPart.state === "output-error"
                  ? "error"
                  : "running";
            return <ToolStatus key={i} name={toolname} status={status} />;
          }
          return null;
        })}
      </div>
    </div>
  );
}
