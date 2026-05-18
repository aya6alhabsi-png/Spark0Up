import React from "react";
import logo from "../image/logo2.png";

export default function AppHeader({ subtitle }) {
  return (
    <div className="d-flex align-items-center gap-3 mb-4 tour-home">
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(242,248,255,0.98))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 14px 30px rgba(30, 136, 229, 0.14), inset 0 1px 0 rgba(255,255,255,0.92)",
          border: "1px solid rgba(30,136,229,0.10)",
        }}
      >
        <img
          src={logo}
          alt="SparkUp"
          style={{ width: "72%", height: "72%", objectFit: "contain" }}
        />
      </div>
      <div>
        <div
          style={{
            fontWeight: 900,
            fontSize: "1.28rem",
            letterSpacing: "0.2px",
            background: "linear-gradient(90deg, #184f89 0%, #2f80ed 45%, #ff7a00 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          SparkUp
        </div>
        <div className="text-muted small">{subtitle}</div>
      </div>
    </div>
  );
}
