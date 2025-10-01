"use client";
import { useAuth } from "@clerk/nextjs";
import type { UserResource } from "@clerk/types";
import axios from "axios";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import toast from "react-hot-toast";
import { useUserSync } from "@/app/hooks/useUserSync";

interface Chat {
  _id: string;
  id: string;
  name: string;
  messages: Array<{
    role: string;
    content: string;
    timestamp: number;
  }>;
  userId: string;
  updatedAt: string;
  createdAt: string;
}

type AppContextType = {
  user: UserResource | null | undefined;
  chats: Chat[];
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  selectedChat: Chat | null;
  setSelectedChat: React.Dispatch<React.SetStateAction<Chat | null>>;
  fetchUserChats: () => Promise<void>;
  createNewChat: () => Promise<void>;
};

export const AppContext = createContext<AppContextType | null>(null);
export const useAppContext = () => useContext(AppContext);
export const AppContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useUserSync(); // Now using our custom hook
  const { getToken } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const fetchUserChats = useCallback(async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("api/chat/get", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setChats(data.data);
        // If the users have no chat, create a new chat
        if (data.data.length === 0) {
          // Create new chat inline to avoid circular dependency
          try {
            if (user) {
              const token = await getToken();
              await axios.post(
                "api/chat/create",
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
              // Recursively call fetchUserChats after creating
              const { data: newData } = await axios.get("api/chat/get", {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (newData.sucess) {
                setChats(newData.data);
                if (newData.data.length > 0) {
                  setSelectedChat(newData.data[0]);
                }
              }
            }
          } catch (createError) {
            toast.error(
              createError instanceof Error
                ? createError.message
                : "Failed to create chat"
            );
          }
        } else {
          // Sort chats by updatedAt
          data.data.sort(
            (a: Chat, b: Chat) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );

          // Set recently updated chat as selected chat
          setSelectedChat(data.data[0]);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  }, [getToken, user]);

  const createNewChat = useCallback(async () => {
    try {
      if (!user) return;
      const token = await getToken();
      await axios.post(
        "api/chat/create",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUserChats();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  }, [user, getToken, fetchUserChats]);
  useEffect(() => {
    if (user) {
      fetchUserChats();
    }
  }, [user, fetchUserChats]);
  const value = {
    user,
    chats,
    setChats,
    selectedChat,
    setSelectedChat,
    fetchUserChats,
    createNewChat,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
