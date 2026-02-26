"use client";

import { useEffect, useRef } from "react";

export const N8nChatAdmin = () => {
  const initialized = useRef(false);

  useEffect(() => {
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL;

    if (!webhookUrl) {
      console.warn("N8n Chat: NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL is not set.");
      return;
    }

    if (initialized.current) return;

    // Dynamically load the script
    const script = document.createElement("script");
    script.type = "module";
    // Using import to load the module and call createChat
    script.innerHTML = `
      import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js';
      
      if (!window.n8nChatInstance) {
        window.n8nChatInstance = createChat({
          webhookUrl: '${webhookUrl}',
          mode: "window",
          target: "#n8n-chat",
          showWelcomeScreen: true,
          defaultLanguage: "en",
          initialMessages: [
            "Hi there! 👋",
            "My name is CEG Assistant. How can I assist you today?",
          ],
          i18n: {
            en: {
              title: "Hi there! 👋",
              subtitle: "Start a chat. We're here to help you 24/7.",
              getStarted: "New Conversation",
              inputPlaceholder: "Type your question..",
              footer: "",
              closeButtonTooltip: "Close Chat",
            },
          },
        });
      }
    `;

    document.body.appendChild(script);
    initialized.current = true;
  }, []);

  return <div id="n8n-chat"></div>;
};
