// src/context/ChatContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';

export type SenderRole = 'buyer' | 'seller';

export interface ChatMessage {
  id: string;
  text: string;
  sender: SenderRole;
  senderName: string;
  timestamp: Date;
}

interface ChatContextValue {
  messages: ChatMessage[];
  buyerUnread: number;
  sellerUnread: number;
  sendMessage: (text: string, sender: SenderRole, senderName: string) => void;
  markAsRead: (role: SenderRole) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      text: "Hi! I'm Thomas from CoreSystems. How can I help you today?",
      sender: 'seller',
      senderName: 'Thomas',
      timestamp: new Date(Date.now() - 60000 * 2),
    },
  ]);

  const [buyerUnread, setBuyerUnread] = useState(0);
  const [sellerUnread, setSellerUnread] = useState(1); // seller has 0 unread at start, buyer has 1

  const sendMessage = useCallback((text: string, sender: SenderRole, senderName: string) => {
    const msg: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      text,
      sender,
      senderName,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, msg]);
    // Increment unread for the OTHER side
    if (sender === 'buyer') setSellerUnread(n => n + 1);
    if (sender === 'seller') setBuyerUnread(n => n + 1);
  }, []);

  const markAsRead = useCallback((role: SenderRole) => {
    if (role === 'buyer') setBuyerUnread(0);
    if (role === 'seller') setSellerUnread(0);
  }, []);

  return (
    <ChatContext.Provider value={{ messages, buyerUnread, sellerUnread, sendMessage, markAsRead }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside ChatProvider');
  return ctx;
};