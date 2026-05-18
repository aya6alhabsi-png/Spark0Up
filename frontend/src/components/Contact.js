import React, { useContext } from "react";
import { Container, Row, Col, Button } from "reactstrap";
import { useNavigate } from "react-router-dom";
import {
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaArrowLeft,
} from "react-icons/fa";
import { AppContext } from "../context/AppContext";

export default function Contact() {
  const navigate = useNavigate();
  const { t, palette } = useContext(AppContext);

  return (
    <div
      className="spark-page-shell"
      style={{
        minHeight: "100vh",
        background: palette.background,
        padding: "70px 0",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Container>
        {/* HEADER */}
        <div className="contact-header">
          <span className="contact-badge">SparkUp Support</span>

          <h1 style={{ color: palette.text }}>
            {t("contactUs")}
          </h1>

          <p>
            Connect with the SparkUp team for support, funding inquiries,
            innovation opportunities, and platform assistance.
          </p>
        </div>

        {/* CENTERED CARD */}
        <Row className="g-4 justify-content-center">
          <Col lg="8" md="10">
            <div className="contact-form-card">
              <h3>Contact Information</h3>

              <div className="simple-contact-wrapper">
                {/* EMAIL */}
                <div className="simple-contact-card">
                  <div className="simple-icon-box">
                    <FaEnvelope />
                  </div>

                  <div>
                    <h5>Email Address</h5>
                    <p>sparkupsparkup93@gmail.com</p>
                  </div>
                </div>

                {/* PHONE */}
                <div className="simple-contact-card">
                  <div className="simple-icon-box">
                    <FaPhoneAlt />
                  </div>

                  <div>
                    <h5>Phone Number</h5>
                    <p>+968 9437 3283</p>
                  </div>
                </div>

                {/* LOCATION */}
                <div className="simple-contact-card">
                  <div className="simple-icon-box">
                    <FaMapMarkerAlt />
                  </div>

                  <div>
                    <h5>Location</h5>
                    <p>UTAS Muscat, Oman</p>
                  </div>
                </div>
              </div>

              {/* BUTTON */}
              <div className="contact-actions">
                <Button
                  type="button"
                  className="back-btn"
                  onClick={() => navigate("/")}
                >
                  <FaArrowLeft />
                  {t("back")}
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      {/* STYLES */}
      <style>
        {`
          .contact-header {
            text-align: center;
            max-width: 760px;
            margin: 0 auto 50px;
          }

          .contact-badge {
            display: inline-block;
            padding: 10px 18px;
            border-radius: 999px;
            background: linear-gradient(135deg, #1a73e8, #f28b3c);
            color: white;
            font-weight: 700;
            font-size: 0.9rem;
            margin-bottom: 18px;
            box-shadow: 0 10px 25px rgba(26,115,232,0.18);
          }

          .contact-header h1 {
            font-size: 3rem;
            font-weight: 850;
            margin-bottom: 14px;
          }

          .contact-header p {
            color: #6b7a90;
            font-size: 1.05rem;
            line-height: 1.8;
            margin: 0;
          }

          .contact-form-card {
            border-radius: 32px;
            padding: 38px;
            background: rgba(255,255,255,0.85);
            border: 1px solid rgba(26,115,232,0.1);
            box-shadow: 0 20px 50px rgba(15,45,80,0.12);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
          }

          .contact-form-card h3 {
            text-align: center;
            font-size: 1.8rem;
            font-weight: 850;
            color: #14365c;
            margin-bottom: 30px;
          }

          .simple-contact-wrapper {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .simple-contact-card {
            display: flex;
            align-items: center;
            gap: 18px;
            padding: 24px;
            border-radius: 24px;
            background: #f8fbff;
            border: 1px solid rgba(26,115,232,0.08);
            transition: 0.3s ease;
          }

          .simple-contact-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 14px 30px rgba(26,115,232,0.08);
          }

          .simple-icon-box {
            width: 62px;
            height: 62px;
            min-width: 62px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg,#1a73e8,#f28b3c);
            color: white;
            font-size: 1.15rem;
            box-shadow: 0 10px 25px rgba(26,115,232,0.18);
          }

          .simple-contact-card h5 {
            margin: 0 0 6px;
            font-weight: 800;
            color: #14365c;
          }

          .simple-contact-card p {
            margin: 0;
            color: #6b7a90;
            font-size: 1rem;
          }

          .contact-actions {
            display: flex;
            justify-content: center;
            margin-top: 35px;
          }

          .back-btn {
            border: none !important;
            border-radius: 18px !important;
            padding: 14px 28px !important;
            background: linear-gradient(135deg,#1a73e8,#f28b3c) !important;
            color: white !important;
            font-weight: 800 !important;
            display: inline-flex !important;
            align-items: center;
            gap: 10px;
            box-shadow: 0 12px 28px rgba(26,115,232,0.22);
          }

          .back-btn:hover {
            transform: translateY(-2px);
          }

          @media (max-width: 768px) {
            .contact-header h1 {
              font-size: 2.2rem;
            }

            .contact-form-card {
              padding: 24px;
              border-radius: 24px;
            }

            .simple-contact-card {
              padding: 18px;
            }
          }
        `}
      </style>
    </div>
  );
}
