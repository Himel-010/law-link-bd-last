"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CHATBOT_API_URL = "http://localhost:8000";

const normalizeMessage = (text) => {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[!?.।,]/g, "")
    .replace(/\s+/g, " ");
};

const getLocalBotReply = (message) => {
  const text = normalizeMessage(message);

  const greetings = [
    "hi",
    "hii",
    "hiii",
    "hello",
    "hey",
    "helo",
    "hlw",
    "assalamualaikum",
    "assalamu alaikum",
    "salam",
    "আসসালামু আলাইকুম",
    "হাই",
    "হ্যালো",
  ];

  const thanks = [
    "thanks",
    "thank you",
    "thank u",
    "tnx",
    "ধন্যবাদ",
    "thanks bhai",
    "thank you bhai",
  ];

  const byes = [
    "bye",
    "goodbye",
    "see you",
    "আচ্ছা",
    "বিদায়",
  ];

  const whoAreYou = [
    "who are you",
    "what are you",
    "tumi ke",
    "তুমি কে",
    "apni ke",
    "আপনি কে",
  ];

  if (greetings.includes(text)) {
    return "Hello! Ami Bangladesh legal assistant. Apni Bangladesh law ba ei lawyer-client website niye question korte paren.";
  }

  if (thanks.includes(text)) {
    return "Apnake welcome! Bangladesh law ba website service niye aro kono question thakle korte paren.";
  }

  if (byes.includes(text)) {
    return "Bhalo thakben! Legal issue serious hole licensed Bangladeshi lawyer er sathe consult korben.";
  }

  if (whoAreYou.includes(text)) {
    return "Ami Bangladesh legal assistant chatbot. Ami Bangladesh law and ei lawyer-client website er service related general information dite pari.";
  }

  return null;
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: crypto.randomUUID(),
      text: "Hello! I'm your Bangladesh legal assistant. Ask me about Bangladesh law or this lawyer-client website.",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);

  const quickActions = [
    "Find a lawyer",
    "How to book appointment?",
    "Family law question",
    "Property law help",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-BD", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const addMessage = ({ text, sender }) => {
    const newMessage = {
      id: crypto.randomUUID(),
      text,
      sender,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
  };

  const fetchBotReply = async (messageText) => {
    const response = await fetch(`${CHATBOT_API_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: messageText }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.detail || data?.reply || "Failed to get chatbot response"
      );
    }

    return data?.reply || "Sorry, ami ekhon response dite parchi na.";
  };

  const handleSendMessage = async (customMessage) => {
    const finalMessage = String(customMessage || inputMessage).trim();

    if (!finalMessage || isTyping) return;

    addMessage({
      text: finalMessage,
      sender: "user",
    });

    setInputMessage("");

    const localReply = getLocalBotReply(finalMessage);

    if (localReply) {
      setTimeout(() => {
        addMessage({
          text: localReply,
          sender: "bot",
        });
      }, 350);

      return;
    }

    setIsTyping(true);

    try {
      const botReply = await fetchBotReply(finalMessage);

      addMessage({
        text: botReply,
        sender: "bot",
      });
    } catch (error) {
      console.error("Chatbot API error:", error);

      addMessage({
        text: "Sorry, chatbot server er sathe connect kora jacche na. Please backend running ache kina check korun.",
        sender: "bot",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg ${
          isOpen
            ? "bg-red-500 text-white hover:bg-red-600"
            : "bg-cyan-600 text-white hover:bg-cyan-700"
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="
              fixed
              bottom-24
              right-4
              z-40
              flex
              w-[calc(100vw-2rem)]
              max-w-[360px]
              flex-col
              overflow-hidden
              rounded-lg
              border
              border-slate-200
              bg-white
              shadow-xl
              sm:right-6
              sm:w-80
            "
            style={{
              height: "min(520px, calc(100dvh - 120px))",
              maxHeight: "calc(100dvh - 120px)",
            }}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="shrink-0 rounded-t-lg bg-cyan-600 p-4 text-white">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <span className="font-semibold">Legal Assistant</span>
              </div>

              <p className="mt-1 text-xs text-cyan-100">
                Online • Bangladesh law help
              </p>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <AnimatePresence initial={false}>
                {messages.map((message, index) => {
                  const isUser = message.sender === "user";

                  return (
                    <motion.div
                      key={message.id}
                      className={`flex ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.04, 0.25) }}
                    >
                      <motion.div
                        className={`max-w-[88%] rounded-lg px-3 py-2 ${
                          isUser
                            ? "bg-cyan-600 text-white"
                            : "bg-slate-100 text-slate-700"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="flex items-start gap-2">
                          {!isUser && (
                            <Bot className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
                          )}

                          <div className="min-w-0">
                            <p className="whitespace-pre-wrap break-words text-sm leading-6">
                              {message.text}
                            </p>

                            <p
                              className={`mt-1 text-[10px] font-medium ${
                                isUser ? "text-cyan-100" : "text-slate-400"
                              }`}
                            >
                              {formatTime(message.timestamp)}
                            </p>
                          </div>

                          {isUser && (
                            <User className="mt-0.5 h-4 w-4 shrink-0" />
                          )}
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {isTyping && (
                <motion.div
                  className="flex justify-start"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="max-w-[88%] rounded-lg bg-slate-100 px-3 py-2 text-slate-700">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-cyan-600" />
                      <Loader2 className="h-4 w-4 animate-spin text-cyan-600" />
                      <p className="text-sm font-medium">Typing...</p>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {messages.length === 1 && (
              <motion.div
                className="shrink-0 px-4 pb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action, index) => (
                    <motion.button
                      key={action}
                      type="button"
                      onClick={() => handleSendMessage(action)}
                      disabled={isTyping}
                      className="rounded bg-slate-100 px-2 py-1 text-left text-xs text-slate-600 transition-colors hover:bg-amber-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                    >
                      {action}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="shrink-0 border-t border-slate-200 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  disabled={isTyping}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                />

                <motion.button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isTyping}
                  className="rounded-lg bg-cyan-600 p-2 text-white transition-colors hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  whileHover={{
                    scale: inputMessage.trim() && !isTyping ? 1.05 : 1,
                  }}
                  whileTap={{
                    scale: inputMessage.trim() && !isTyping ? 0.95 : 1,
                  }}
                >
                  {isTyping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;