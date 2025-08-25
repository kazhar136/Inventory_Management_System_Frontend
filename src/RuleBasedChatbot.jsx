import React, { useState } from "react";
import axios from "axios";
import "./RuleBasedChatbot.css";

const API_URL = "http://localhost:8000/items";

export default function RuleBasedChatbot({ items = [], refreshItems }) {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: `👋 Hello! I'm Inventory Assistant. 
Here are some commands you can try:
- total stock
- low stock
- find <name>
- add <name> <qty>
- update <name> <qty>
- delete <name>`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // popup state

  // helper: append message
  const pushMessage = (msg) => setMessages((m) => [...m, msg]);

  // helper: format small item list
  const formatItems = (list, max = 10) => {
    if (!list.length) return "No items.";
    return list
      .slice(0, max)
      .map((it) => `${it.name} (qty: ${it.quantity})`)
      .join("\n");
  };

  // parse commands (same as before)...
  const parseCommand = (text) => {
    const t = text.trim();
    const lower = t.toLowerCase();

    const addRegex = /^(?:add|add item)\s+(.+?)\s+(\d+)$/i;
    const addMatch = t.match(addRegex);
    if (addMatch)
      return { cmd: "add", name: addMatch[1].trim(), qty: Number(addMatch[2]) };

    const updateRegex = /^(?:update|set)\s+(.+?)\s+(\d+)$/i;
    const updateMatch = t.match(updateRegex);
    if (updateMatch) {
      const target = updateMatch[1].trim();
      const qty = Number(updateMatch[2]);
      if (/^\d+$/.test(target))
        return { cmd: "update", by: "id", id: Number(target), qty };
      return { cmd: "update", by: "name", name: target, qty };
    }

    const delRegex = /^(?:delete|remove)\s+(.+)$/i;
    const delMatch = t.match(delRegex);
    if (delMatch) {
      const target = delMatch[1].trim();
      if (/^\d+$/.test(target))
        return { cmd: "delete", by: "id", id: Number(target) };
      return { cmd: "delete", by: "name", name: target };
    }

    const findRegex = /^(?:find|search|show)\s+(.+)$/i;
    const findMatch = t.match(findRegex);
    if (findMatch) return { cmd: "find", query: findMatch[1].trim() };

    if (
      lower.includes("show inventory") ||
      lower === "inventory" ||
      lower === "list items" ||
      lower === "show items"
    )
      return { cmd: "show_inventory" };

    if (
      lower.includes("total stock") ||
      lower.includes("total items") ||
      lower.includes("total quantity")
    )
      return { cmd: "total_stock" };

    const lowRegex = /(low stock|low inventory|below\s+(\d+))/i;
    const lowMatch = lower.match(lowRegex);
    if (lowMatch) {
      if (lowMatch[2]) return { cmd: "low_stock", threshold: Number(lowMatch[2]) };
      return { cmd: "low_stock", threshold: 5 };
    }

    if (t.length <= 30 && t.split(" ").length <= 4)
      return { cmd: "find", query: t };

    return { cmd: "unknown" };
  };

  // main handler
  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    pushMessage({ sender: "user", text });
    setInput("");
    setLoading(true);

    const action = parseCommand(text);

    try {
      switch (action.cmd) {
        case "show_inventory": {
          const reply = `${items.length} items:\n${formatItems(items, 20)}`;
          pushMessage({ sender: "bot", text: reply });
          break;
        }
        case "total_stock": {
          const total = items.reduce(
            (s, it) => s + (Number(it.quantity) || 0),
            0
          );
          pushMessage({
            sender: "bot",
            text: `📦 Total stock across items: ${total}`,
          });
          break;
        }
        case "low_stock": {
          const thr = action.threshold ?? 5;
          const low = items.filter((it) => Number(it.quantity) < thr);
          if (low.length === 0)
            pushMessage({
              sender: "bot",
              text: `✅ No items below ${thr}.`,
            });
          else
            pushMessage({
              sender: "bot",
              text: `⚠️ Items with qty < ${thr}:\n${formatItems(low, 30)}`,
            });
          break;
        }
        case "find": {
          const q = (action.query || "").toLowerCase();
          const found = items.filter((it) =>
            (it.name || "").toLowerCase().includes(q)
          );
          if (found.length === 0)
            pushMessage({
              sender: "bot",
              text: `No items matching "${action.query}"`,
            });
          else
            pushMessage({
              sender: "bot",
              text: `🔍 Found ${found.length} item(s):\n${formatItems(
                found,
                20
              )}`,
            });
          break;
        }
        case "add": {
          const payload = {
            name: action.name,
            quantity: Number(action.qty),
            description: "",
          };
          await axios.post(API_URL, payload);
          await refreshItems?.();
          pushMessage({
            sender: "bot",
            text: `✅ Added "${action.name}" (qty: ${action.qty}).`,
          });
          break;
        }
        case "update": {
          let targetItem = null;
          if (action.by === "id") {
            targetItem = items.find((it) => Number(it.id) === action.id);
          } else {
            targetItem = items.find(
              (it) =>
                (it.name || "").toLowerCase() ===
                (action.name || "").toLowerCase()
            );
          }
          if (!targetItem) {
            pushMessage({
              sender: "bot",
              text: `❌ Item not found to update.`,
            });
          } else {
            const payload = {
              name: targetItem.name,
              quantity: Number(action.qty),
              description: targetItem.description ?? "",
            };
            await axios.put(`${API_URL}/${targetItem.id}`, payload);
            await refreshItems?.();
            pushMessage({
              sender: "bot",
              text: `✏️ Updated "${targetItem.name}" → qty ${action.qty}.`,
            });
          }
          break;
        }
        case "delete": {
          let targetItem = null;
          if (action.by === "id") {
            targetItem = items.find((it) => Number(it.id) === action.id);
          } else {
            targetItem = items.find(
              (it) =>
                (it.name || "").toLowerCase() ===
                (action.name || "").toLowerCase()
            );
          }
          if (!targetItem) {
            pushMessage({
              sender: "bot",
              text: `❌ Item not found to delete.`,
            });
          } else {
            await axios.delete(`${API_URL}/${targetItem.id}`);
            await refreshItems?.();
            pushMessage({
              sender: "bot",
              text: `🗑️ Deleted "${targetItem.name}".`,
            });
          }
          break;
        }
        default: {
          pushMessage({
            sender: "bot",
            text: `🤖 Sorry, I didn't understand.\nTry commands like:\n• show inventory\n• total stock\n• low stock\n• find <name>\n• add <name> <qty>\n• update <name|id> <qty>\n• delete <name|id>`,
          });
        }
      }
    } catch (err) {
      console.error("Chatbot error:", err);
      pushMessage({
        sender: "bot",
        text: "⚠️ There was an error performing that action. Check console.",
      });
    } finally {
      setLoading(false);
    }
  };

  const onEnter = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div>
      {/* Floating button (only for mobile via CSS) */}
      <button className="chatbot-toggle" onClick={() => setIsOpen(!isOpen)}>
        💬
      </button>

      {/* Chatbot box */}
      <div className={`chatbot-container ${isOpen ? "open" : ""}`}>
        <div className="chatbot-header">
          📋 Inventory Assistant
          <button
            className="close-btn"
            onClick={() => setIsOpen(false)}
          >
            ✖
          </button>
        </div>

        <div className="chatbot-messages">
          {messages.map((m, i) => (
            <div key={i} className={`message ${m.sender}`}>
              <div className="message-bubble">{m.text}</div>
            </div>
          ))}
          {loading && (
            <div style={{ fontStyle: "italic", color: "#666" }}>Typing...</div>
          )}
        </div>

        <div className="chatbot-input">
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onEnter}
            placeholder="Type a command (e.g. add Mango 10)"
          />
          <button onClick={handleSend} disabled={loading}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
