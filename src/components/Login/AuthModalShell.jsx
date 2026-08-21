import { motion } from "framer-motion";
import { IoClose } from "react-icons/io5";

export const authLabelClass =
  "text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary";

export const authInputClass =
  "w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm font-medium text-white outline-none placeholder:text-text-muted transition hover:border-white/20 focus:border-brand-primary/60";

export const authPrimaryButtonClass =
  "flex h-11 w-full items-center justify-center rounded-2xl bg-brand-primary text-sm font-bold text-text-inverse transition hover:bg-interactive-primaryHover disabled:cursor-not-allowed disabled:opacity-50";

export const authSecondaryButtonClass =
  "flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10";

export const authLinkClass =
  "font-semibold text-brand-primary transition hover:text-white";

export const AuthSpinner = () => (
  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80" />
);

export const NestedAuthDialog = ({ children, onClose }) => (
  <div
    className="fixed inset-0 z-[121] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    onClick={onClose}
  >
    <div
      className="w-full max-w-sm rounded-[28px] border border-white/10 bg-background-secondary p-5 text-white shadow-[0_20px_80px_rgba(0,0,0,0.35)] md:p-6"
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </div>
  </div>
);

const AuthModalShell = ({ children, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Close"
        className="fixed right-4 top-4 z-[121] rounded-full border border-white/10 bg-black/45 p-2 text-white transition hover:bg-white/10"
        onClick={onClose}
      >
        <IoClose size={18} />
      </button>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.25 }}
        className="relative my-auto w-full max-w-md max-h-[84vh] overflow-y-auto rounded-[28px] border border-white/10 bg-background-secondary p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] md:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default AuthModalShell;
