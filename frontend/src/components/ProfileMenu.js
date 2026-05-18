import React, { useContext, useState } from "react";
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from "reactstrap";
import { FaUserCircle, FaMoon, FaSun, FaLanguage } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../store/authSlice";
import { AppContext } from "../context/AppContext";

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((o) => !o);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const { theme, lang, toggleTheme, toggleLang, t, palette } = useContext(AppContext);

  if (!user) return null;

  const handleLogout = () => {
    dispatch(logout());
    setOpen(false);
    navigate("/", { replace: true });
  };

  return (
    <Dropdown isOpen={open} toggle={toggle}>
      <DropdownToggle
        caret
        className="border-0 d-flex align-items-center gap-2"
        style={{
          background: palette.btnBg,
          color: palette.text,
          borderRadius: 12,
          border: `1px solid ${palette.border}`,
        }}
      >
        <FaUserCircle size={24} />
        <span className="d-none d-sm-inline">{user.name || "Profile"}</span>
      </DropdownToggle>

      <DropdownMenu
        end
        style={{
          background: palette.surface,
          color: palette.text,
          border: `1px solid ${palette.border}`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <DropdownItem
          onClick={() => {
            navigate("/profile");
            setOpen(false);
          }}
          style={{ color: palette.text }}
        >
          My Profile
        </DropdownItem>

        <DropdownItem divider />

        {/* THEME */}
        <DropdownItem
          onClick={() => {
            toggleTheme();
            setOpen(false);
          }}
          className="d-flex align-items-center gap-2"
          style={{ color: palette.text }}
        >
          {theme === "light" ? <FaMoon /> : <FaSun />}
          <span>{t("theme")}</span>
        </DropdownItem>

        {/* LANGUAGE */}
        <DropdownItem
          onClick={() => {
            toggleLang();
            setOpen(false);
          }}
          className="d-flex align-items-center gap-2"
          style={{ color: palette.text }}
        >
          <FaLanguage />
          <span>
            {t("language")}: {lang === "en" ? "العربية" : "English"}
          </span>
        </DropdownItem>

        <DropdownItem divider />

        <DropdownItem
          onClick={() => {
            navigate("/resetpass");
            setOpen(false);
          }}
          style={{ color: palette.text }}
        >
          {t("resetPassword")}
        </DropdownItem>

        <DropdownItem divider />

        <DropdownItem onClick={handleLogout} style={{ color: palette.text }}>
          {t("logout")}
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}