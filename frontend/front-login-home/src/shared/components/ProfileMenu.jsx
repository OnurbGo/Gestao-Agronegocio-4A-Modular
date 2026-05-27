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
    <div className="profile-menu" ref={menuRef}>
      <button
        className="profile-trigger"
        type="button"
        aria-label="Abrir menu de perfil"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {usuario?.imagem_perfil_url ? (
          <img src={usuario.imagem_perfil_url} alt="" />
        ) : (
          <span>{getInitials(usuario?.nome)}</span>
        )}
      </button>

      {open ? (
        <div className="profile-popover">
          <strong>{usuario?.nome}</strong>
          <span>{usuario?.email}</span>
          <button type="button" onClick={() => navigate("profile")}>
            Meu perfil
          </button>
          {canManage ? (
            <button type="button" onClick={() => navigate("admin")}>
              Menu Admin
            </button>
          ) : null}
          <button type="button" onClick={onLogout}>
            Sair
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default ProfileMenu;
