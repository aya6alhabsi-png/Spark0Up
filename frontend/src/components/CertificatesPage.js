import React, { useContext, useEffect, useState } from "react";
import { Container, Card, CardBody, Alert, Spinner, Button, Badge, Row, Col } from "reactstrap";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { api, authHeaders } from "./api";
import { AppContext } from "../context/AppContext";

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getCertificateData(c, currentUser) {
  return {
    platformName: c.platformName || "SparkUp Platform",
    userName: c.userName || c.userId?.name || currentUser?.name || "Participant",
    eventName: c.eventName || c.eventId?.title || c.ideaId?.title || "SparkUp Achievement",
    organizationName: c.organizationName || c.eventId?.organizationName || "SparkUp",
    eventDate: c.eventDate || c.eventId?.startDate || c.issuedAt,
    thankYouMessage:
      c.thankYouMessage ||
      "Thank you for being part of SparkUp and contributing to innovation, creativity, and future ideas.",
    code: c.code,
    issuedAt: c.issuedAt,
  };
}

function openCertificatePrint(c, currentUser) {
  const data = getCertificateData(c, currentUser);
  const html = `
    <!doctype html>
    <html>
      <head>
        <title>${data.platformName} Certificate</title>
        <style>
          @page { size: A4 landscape; margin: 0; }
          body {
            margin: 0;
            background: #eef2f7;
            font-family: Georgia, 'Times New Roman', serif;
          }
          .page {
            width: 297mm;
            height: 210mm;
            background: #ffffff;
            position: relative;
            overflow: hidden;
            box-sizing: border-box;
            padding: 22mm;
          }
          .border1 { position: absolute; inset: 12mm; border: 8px solid #0f2747; }
          .border2 { position: absolute; inset: 17mm; border: 3px solid #1e67c7; }
          .orange1 {
            position: absolute; right: -20mm; top: 0;
            width: 28mm; height: 220mm;
            background: #f59c32;
            transform: rotate(24deg);
          }
          .orange2 {
            position: absolute; left: -22mm; bottom: -20mm;
            width: 25mm; height: 170mm;
            background: #f59c32;
            transform: rotate(50deg);
          }
          .blueSlash {
            position: absolute; right: 8mm; top: -20mm;
            width: 18mm; height: 160mm;
            background: #0f2747;
            transform: rotate(24deg);
          }
          .content {
            position: relative;
            z-index: 2;
            height: 100%;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }
          .platform { color: #0f2747; font-weight: 700; font-size: 18px; letter-spacing: 4px; text-transform: uppercase; }
          h1 { margin: 10px 0 0; font-size: 45px; letter-spacing: 8px; color: #1f2937; font-weight: 500; }
          .sub { font-size: 17px; color: #0f2747; letter-spacing: 3px; font-weight: 700; margin-bottom: 22px; }
          .presented { font-size: 14px; color: #475569; margin-top: 10px; }
          .name { font-size: 48px; font-style: italic; color: #111827; margin: 12px 0; border-bottom: 2px solid #0f2747; padding: 0 35px 8px; }
          .eventText { max-width: 720px; font-size: 16px; color: #334155; line-height: 1.7; }
          .eventName { font-size: 25px; color: #0f2747; font-weight: 800; margin: 10px 0; }
          .thanks { max-width: 760px; font-size: 15px; line-height: 1.7; color: #475569; margin-top: 14px; }
          .footer { display: flex; justify-content: space-between; align-items: flex-end; width: 78%; margin-top: 38px; color: #334155; font-size: 12px; }
          .line { border-top: 1.5px solid #0f2747; padding-top: 7px; width: 170px; }
          .seal {
            width: 78px; height: 78px; border-radius: 50%;
            background: linear-gradient(135deg,#0f2747,#1e67c7);
            color: white; display: flex; align-items: center; justify-content: center;
            font-size: 11px; font-weight: 800; border: 5px solid #f59c32;
          }
          @media print { body { background: white; } }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="orange1"></div>
          <div class="orange2"></div>
          <div class="blueSlash"></div>
          <div class="border1"></div>
          <div class="border2"></div>
          <div class="content">
            <div class="platform">${data.platformName}</div>
            <h1>CERTIFICATE</h1>
            <div class="sub">OF PARTICIPATION</div>
            <div class="presented">This certificate is proudly presented to</div>
            <div class="name">${data.userName}</div>
            <div class="eventText">for successfully participating in</div>
            <div class="eventName">${data.eventName}</div>
            <div class="eventText">Organized by <b>${data.organizationName}</b></div>
            <div class="eventText">Held on ${formatDate(data.eventDate)}</div>
            <div class="thanks">${data.thankYouMessage}</div>
            <div class="footer">
              <div class="line">Certificate ID: ${data.code}</div>
              <div class="seal">SPARK<br/>UP</div>
              <div class="line">Issued by ${data.organizationName}</div>
            </div>
          </div>
        </div>
        <script>window.onload = () => window.print();</script>
      </body>
    </html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
}

function CertificatePreview({ certificate, currentUser }) {
  const data = getCertificateData(certificate, currentUser);

  return (
    <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 24, overflow: "hidden" }}>
      <CardBody className="p-0">
        <div
          style={{
            position: "relative",
            background: "#fff",
            minHeight: 360,
            padding: "34px 40px",
            border: "10px solid #0f2747",
            outline: "3px solid #1e67c7",
            outlineOffset: "-18px",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", right: -30, top: -20, width: 60, height: 460, background: "#f59c32", transform: "rotate(25deg)" }} />
          <div style={{ position: "absolute", right: 20, top: -40, width: 35, height: 300, background: "#0f2747", transform: "rotate(25deg)" }} />
          <div style={{ position: "absolute", left: -45, bottom: -50, width: 60, height: 300, background: "#f59c32", transform: "rotate(45deg)" }} />

          <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
            <div style={{ letterSpacing: 4, color: "#0f2747", fontWeight: 900, textTransform: "uppercase" }}>
              {data.platformName}
            </div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 42, letterSpacing: 7, color: "#1f2937", marginTop: 8 }}>
              CERTIFICATE
            </div>
            <div style={{ color: "#0f2747", fontWeight: 800, letterSpacing: 2 }}>OF PARTICIPATION</div>

            <div style={{ color: "#64748b", marginTop: 24 }}>This certificate is proudly presented to</div>
            <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 42, color: "#111827", margin: "8px auto", borderBottom: "2px solid #0f2747", display: "inline-block", padding: "0 28px 6px" }}>
              {data.userName}
            </div>

            <div style={{ color: "#475569", marginTop: 12 }}>for successfully participating in</div>
            <div style={{ color: "#0f2747", fontWeight: 900, fontSize: 24, marginTop: 6 }}>{data.eventName}</div>
            <div style={{ color: "#475569", marginTop: 6 }}>Organized by <strong>{data.organizationName}</strong></div>
            <div style={{ color: "#475569", marginTop: 6 }}>Held on {formatDate(data.eventDate)}</div>
            <div style={{ maxWidth: 700, margin: "18px auto 0", color: "#64748b", lineHeight: 1.7 }}>
              {data.thankYouMessage}
            </div>

            <div className="d-flex justify-content-between align-items-end mt-4 mx-auto" style={{ maxWidth: 720 }}>
              <div style={{ borderTop: "1px solid #0f2747", paddingTop: 6, color: "#475569", fontSize: 12 }}>ID: {data.code}</div>
              <Badge color="success">Valid</Badge>
              <div style={{ borderTop: "1px solid #0f2747", paddingTop: 6, color: "#475569", fontSize: 12 }}>Issued by {data.organizationName}</div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center p-3 bg-light flex-wrap gap-2">
          <div className="small text-muted">Issued: {new Date(data.issuedAt).toLocaleString()}</div>
          <Button color="primary" onClick={() => openCertificatePrint(certificate, currentUser)}>
            Download / Print Certificate
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

export default function CertificatesPage() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const { t } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [list, setList] = useState([]);

  const fetchList = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await api.get("/certificates", { headers: authHeaders() });
      setList(res.data?.certificates || []);
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    fetchList();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#eef6ff,#fff8ef)" }}>
      <Container className="py-4">
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="m-0 fw-bold" style={{ color: "#0f2747" }}>{t("certificates")}</h3>
            <div className="text-muted small">Certificates are available for innovators, reviewers, and funders after scanning the event attendance QR.</div>
          </div>
          <div className="d-flex gap-2">
            <Button color="info" onClick={() => navigate("/notifications")}>{t("notifications")}</Button>
            <Button color="secondary" onClick={() => navigate(-1)}>{t("back")}</Button>
          </div>
        </div>

        {err && <Alert color="danger">{err}</Alert>}
        {loading ? (
          <div className="text-center py-5"><Spinner /></div>
        ) : list.length === 0 ? (
          <Alert color="info">No certificates yet. Register for an event and scan the admin QR to release your certificate.</Alert>
        ) : (
          <Row>
            <Col lg="12">
              {list.map((c) => (
                <CertificatePreview key={c._id} certificate={c} currentUser={user} />
              ))}
            </Col>
          </Row>
        )}
      </Container>
    </div>
  );
}

