"use client";
import { useUser } from "@clerk/nextjs";
import { createContext, useContext } from "react";

type AppContextType = {
  user: ReturnType<typeof useUser>["user"];
};

export const AppContext = createContext<AppContextType | null>(null);
export const useAppContext = () => useContext(AppContext);
export const AppContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useUser();
  const value = { user };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
