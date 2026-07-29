import { createContext, useContext, useState, type ReactNode } from "react";

// Tracks whether the page header's logo is currently on screen. The Header
// reports it (via an IntersectionObserver); the Sidebar reveals its own logo
// only once the header's has scrolled out of view.
const HeaderLogoContext = createContext<{
  visible: boolean;
  setVisible: (v: boolean) => void;
}>({ visible: true, setVisible: () => {} });

export function HeaderLogoProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true);
  return (
    <HeaderLogoContext.Provider value={{ visible, setVisible }}>
      {children}
    </HeaderLogoContext.Provider>
  );
}

export function useHeaderLogo() {
  return useContext(HeaderLogoContext);
}
