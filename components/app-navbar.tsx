interface AppNavbarProps {
  onAdminClick: () => void;
}

export function AppNavbar({ onAdminClick }: AppNavbarProps) {
  return (
    <nav className="fixed top-0 z-10 flex w-full max-w-[375px] items-center justify-between bg-primary px-4 py-4 text-white">
      <h1 className="font-brand text-2xl tracking-wide">CH GROUP</h1>
      <button
        type="button"
        onClick={onAdminClick}
        className="rounded-button border border-white/20 px-3 py-1 text-sm hover:bg-white/10"
      >
        Admin
      </button>
    </nav>
  );
}
