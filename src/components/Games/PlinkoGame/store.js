import { create } from "zustand";

const usePlinkoStore = create((set) => ({
  currentBinIndex: null,
  landNonce: 0,
  setCurrentBinIndex: (index) =>
    set((state) => ({
      currentBinIndex: index,
      landNonce: state.landNonce + 1,
    })),
}));

// const useStore = create((set, get) => ({
//   lang: 'javascript',
//   setLang: (lang) => set(() => ({ lang })),
//   getCode: () =>
//     get().lang === 'javascript' ? javascriptCode : typescriptCode,
// }))

export default usePlinkoStore;