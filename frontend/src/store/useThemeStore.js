import { create } from 'zustand'

export const useThemeStore = create((set) => ({
    theme: localStorage.getItem("TalkStream-theme") || "coffee",
    setTheme: (theme)=> {
        localStorage.setItem("TalkStream-theme", theme);
         set({theme});
         },
}))
