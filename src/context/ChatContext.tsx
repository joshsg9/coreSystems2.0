// src/context/ChatContext.tsx
import React, { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type SenderRole = 'buyer' | 'seller';

export interface ChatMessage {
  id:         string;
  text:       string;
  sender:     SenderRole;
  senderName: string;
  timestamp:  Date;
}

interface ChatState {
  messages:     ChatMessage[];
  buyerUnread:  number;
  sellerUnread: number;
}

type ChatAction =
  | { type: 'SET_MESSAGES';         messages: ChatMessage[] }
  | { type: 'ADD_MESSAGE';          message:  ChatMessage }
  | { type: 'MARK_READ';            role: SenderRole }
  | { type: 'INCREMENT_BUYER_UNREAD' }
  | { type: 'INCREMENT_SELLER_UNREAD' };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_MESSAGES':
      return { ...state, messages: action.messages };
    case 'ADD_MESSAGE':
      if (state.messages.some(m => m.id === action.message.id)) return state;
      return { ...state, messages: [...state.messages, action.message] };
    case 'MARK_READ':
      return action.role === 'buyer'
        ? { ...state, buyerUnread: 0 }
        : { ...state, sellerUnread: 0 };
    case 'INCREMENT_BUYER_UNREAD':
      return { ...state, buyerUnread: state.buyerUnread + 1 };
    case 'INCREMENT_SELLER_UNREAD':
      return { ...state, sellerUnread: state.sellerUnread + 1 };
    default:
      return state;
  }
}

type Row = Record<string, unknown>;

function mapRow(row: Row): ChatMessage {
  return {
    id:         row.id         as string,
    text:       row.text       as string,
    sender:     row.sender_role as SenderRole,
    senderName: row.sender_name as string,
    timestamp:  new Date(row.created_at as string),
  };
}

interface ChatContextValue {
  messages:    ChatMessage[];
  buyerUnread: number;
  sellerUnread: number;
  sendMessage: (text: string, sender: SenderRole, senderName: string) => Promise<void>;
  markAsRead:  (role: SenderRole) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state,  dispatch]  = useReducer(chatReducer, { messages: [], buyerUnread: 0, sellerUnread: 0 });
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });

    // Load recent messages
    supabase.from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (data?.length) {
          dispatch({ type: 'SET_MESSAGES', messages: data.map(mapRow) });
        }
      });

    // Realtime subscription
    const channel = supabase.channel('chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, payload => {
        const msg = mapRow(payload.new as Row);
        dispatch({ type: 'ADD_MESSAGE', message: msg });
        if (msg.sender === 'buyer')  dispatch({ type: 'INCREMENT_SELLER_UNREAD' });
        if (msg.sender === 'seller') dispatch({ type: 'INCREMENT_BUYER_UNREAD' });
      })
      .subscribe();

    return () => {
      authSub.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  const sendMessage = useCallback(async (text: string, sender: SenderRole, senderName: string) => {
    if (!userId) return;
    await supabase.from('chat_messages').insert({
      sender_id:   userId,
      sender_name: senderName,
      sender_role: sender,
      text,
    });
  }, [userId]);

  const markAsRead = useCallback((role: SenderRole) => {
    dispatch({ type: 'MARK_READ', role });
  }, []);

  return (
    <ChatContext.Provider value={{
      messages:     state.messages,
      buyerUnread:  state.buyerUnread,
      sellerUnread: state.sellerUnread,
      sendMessage,
      markAsRead,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside ChatProvider');
  return ctx;
};
