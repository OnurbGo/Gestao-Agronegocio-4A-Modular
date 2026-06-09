import { useEffect, useRef, useState } from "react";

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) {
    return "U";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function ProfileMenu({ usuario, onNavigate, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const canManage = usuario?.possuiAdmin || usuario?.possuiGerente;

  useEffect(() => {
    function handleClick(event) {
      if (!menuRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function navigate(target) {
    setOpen(false);
    onNavigate(target);
  }

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        className="grid h-11 w-11 place-items-center overflow-hidden rounded-full border border-emerald-200 bg-white p-0 text-sm font-bold text-emerald-900 shadow-sm transition hover:bg-emerald-50"
        type="button"
        aria-label="Abrir menu de perfil"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {usuario?.imagem_perfil_url ? (
          <img className="h-full w-full object-cover" src={usuario.imagem_perfil_url} alt="" />
        ) : (
          <span className="grid h-full w-full place-items-center bg-emerald-50">
            {getInitials(usuario?.nome)}
          </span>
        )}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.625rem)] z-30 grid w-[min(280px,calc(100vw-2rem))] gap-1 rounded-lg border border-emerald-100 bg-white p-3 text-sm shadow-xl">
          <strong className="break-words text-slate-950">{usuario?.nome}</strong>
          <span className="mb-1 break-words text-xs text-slate-500">{usuario?.email}</span>
          <button
            className="rounded-md px-3 py-2 text-left font-bold text-emerald-900 transition hover:bg-emerald-50"
            type="button"
            onClick={() => navigate("profile")}
          >
            Meu perfil
          </button>
          {canManage ? (
            <button
              className="rounded-md px-3 py-2 text-left font-bold text-emerald-900 transition hover:bg-emerald-50"
              type="button"
              onClick={() => navigate("admin")}
            >
              Menu Admin
            </button>
          ) : null}
          <button
            className="rounded-md px-3 py-2 text-left font-bold text-red-700 transition hover:bg-red-50"
            type="button"
            onClick={onLogout}
          >
            Sair
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default ProfileMenu;
