import React, { useContext } from "react";
import { Container, Button } from "reactstrap";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";

export default function Contact() {
  const navigate = useNavigate();
  const { t, palette } = useContext(AppContext);

  return (
    <div className="spark-page-shell d-flex align-items-center">
      <Container className="text-center">
        <h1 style={{ color: palette.text, fontWeight: 700 }}>{t("contactUs")}</h1>
        <p className="mt-3 text-muted">
          {t("contactUs")} - SparkUp
        </p>

        <Button
          style={{ backgroundColor: "#1a73e8", border: "none", marginTop: 20 }}
          onClick={() => navigate("/")}
        >
          {t("back")}
        </Button>
      </Container>
    </div>
  );
}
