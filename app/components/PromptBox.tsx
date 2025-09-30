import { assets } from "@/assets/assets";
import Image from "next/image";
import React from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import axios from "axios";

interface SidebarProps {
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const PromptBox = ({ isLoading, setIsLoading }: SidebarProps) => {
  const [prompt, setPrompt] = React.useState("");
  const context = useAppContext();

  if (!context) {
    return null; // or some loading state
  }

  const { user, setChats, selectedChat, setSelectedChat } = context;
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendPrompt(e);
    }
  };

  const sendPrompt = async (e: React.FormEvent | React.KeyboardEvent) => {
    const promptCopy = prompt;
    try {
      e.preventDefault();
      if (!user) return toast.error("User not authenticated");
      if (!selectedChat) return toast.error("No chat selected");
      if (isLoading)
        return toast.error("Please wait for the previous prompt response");
      setIsLoading(true);
      setPrompt("");
      const userPrompt = {
        role: "user",
        content: prompt,
        timeStamp: Date.now(),
      };
      // Saving user prompt in chats array
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat._id === selectedChat._id
            ? { ...chat, messages: [...chat.messages, userPrompt] }
            : chat
        )
      );
      //saving user prompt in selected chat
      setSelectedChat((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, userPrompt],
        };
      });
      console.log("Selected chat:", selectedChat);
      const { data } = await axios.post("/api/chat/ai", {
        chatId: selectedChat._id,
        prompt,
      });
      console.log("Response from /api/chat/ai:", data);
      if (data.success) {
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat._id === selectedChat._id
              ? { ...chat, messages: [...chat.messages, data.data] }
              : chat
          )
        );
        const message = data.data.content;
        const messageTokens = message.split(" ");
        const assistantMessage = {
          role: "assistant",
          content: "",
          timeStamp: Date.now(),
        };
        setSelectedChat((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...prev.messages, assistantMessage],
          };
        });
        for (let i = 0; i < messageTokens.length; i++) {
          setTimeout(() => {
            assistantMessage.content = messageTokens.slice(0, i + 1).join(" ");
            setSelectedChat((prev) => {
              if (!prev) return prev;
              const updateMessages = [
                ...prev.messages.slice(0, -1),
                assistantMessage,
              ];
              return { ...prev, messages: updateMessages };
            });
          }, i * 100);
        }
      } else {
        toast.error(data.message);
        setPrompt(promptCopy);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
      setPrompt(promptCopy);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <form
      onSubmit={sendPrompt}
      className={`w-full ${
        (selectedChat?.messages?.length || 0) > 0 ? "max-w-3xl" : "max-w-2xl"
      } bg-[#404045] p-4 rounded-3xl mt-4 transition-all`}
    >
      <textarea
        onKeyDown={handleKeyDown}
        className="outline-none w-full resize-none overflow-hidden break-words bg-transparent"
        rows={2}
        placeholder="Message DeepSeek"
        required
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          setPrompt(e.target.value)
        }
        value={prompt}
      />
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <p className="flex items-center gap-2 text-xs border border-gray-300/40 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-500/20 transition">
            <Image className="h-5" src={assets.deepthink_icon} alt="" />
            DeepThink (R1)
          </p>
          <p className="flex items-center gap-2 text-xs border border-gray-300/40 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-500/20 transition">
            <Image className="h-5" src={assets.search_icon} alt="" />
            Search
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Image className="w-4 cursor-pointer" src={assets.pin_icon} alt="" />
          <button
            className={`${
              prompt ? "bg-primary" : "bg-[#71717a]"
            } rounded-full p-2 cursor-pointer`}
          >
            <Image
              className="w-3.5 aspect-square"
              src={prompt ? assets.arrow_icon : assets.arrow_icon_dull}
              alt=""
            />
          </button>
        </div>
      </div>
    </form>
  );
};

export default PromptBox;
