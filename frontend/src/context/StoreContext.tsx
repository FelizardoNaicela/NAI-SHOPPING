import { createContext, useContext, useState } from "react";

type StoreContextType = {
  store: any;
  stats: any;
  viewer: any;
  sidebarFeeds: any[];

  isFollowing: boolean;
  setIsFollowing: (v: boolean) => void;
};

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: {
    store: any;
    stats: any;
    viewer: any;
    sidebarFeeds: any[];
  };
}) {
  const [isFollowing, setIsFollowing] = useState(false);

  return (
    <StoreContext.Provider
      value={{
        ...value,
        isFollowing,
        setIsFollowing,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}