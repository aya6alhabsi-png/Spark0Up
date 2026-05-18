import React, { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, CardBody, Container, Input, Label, Spinner } from "reactstrap";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaRegStar, FaStar, FaVenusMars, FaBirthdayCake, FaClipboardCheck, FaAward } from "react-icons/fa";
import { api, authHeaders } from "./api";

const fieldBox = {
  textAlign: "left",
  background: "#ffffff",
  border: "1px solid #dbe8f7",
  borderRadius: 18,
  padding: 14,
  boxShadow: "0 12px 28px rgba(16,40,70,0.06)",
};

const labelStyle = {
  color: "#102846",
  fontWeight: 900,
  fontSize: 13,
  marginBottom: 8,
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const inputStyle = {
  borderRadius: 14,
  borderColor: "#d9e5f5",
  minHeight: 48,
  color: "#375a84",
  fontWeight: 700,
};

function StarPicker({ value, onChange }) {
  return (
    <div className="d-flex justify-content-center gap-2 my-3">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;
        const Icon = active ? FaStar : FaRegStar;
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            style={{
              border: "none",
              background: active ? "rgba(255,191,47,0.14)" : "rgba(202,214,230,0.18)",
              color: active ? "#ffbf2f" : "#cad6e6",
              fontSize: 31,
              cursor: "pointer",
              padding: "8px 10px",
              borderRadius: 16,
              lineHeight: 1,
            }}
            aria-label={`Rate ${star} stars`}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}

export default function EventQrScanPage() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const { eventId, type, token } = useParams();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [rating, setRating] = useState(5);
  const [gender, setGender] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [message, setMessage] = useState("");
  const [certificate, setCertificate] = useState(null);
  const currentScanPath = `/event-check/${eventId}/${type}/${token}`;

  useEffect(() => {
    if (!user) {
      localStorage.setItem("sparkup_redirect_after_login", currentScanPath);
    }
  }, [user, currentScanPath]);

  const goToLoginForScan = () => {
    localStorage.setItem("sparkup_redirect_after_login", currentScanPath);
    navigate("/login", { state: { from: currentScanPath } });
  };

  const submitEvaluationAndGetCertificate = async () => {
    if (!user) {
      goToLoginForScan();
      return;
    }
    setErr("");
    setMsg("");
    if (!gender) {
      setErr("Please select your gender.");
      return;
    }
    if (!ageRange) {
      setErr("Please select your age group.");
      return;
    }
    if (!message.trim()) {
      setErr("Please write a short evaluation before getting your certificate.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(
        `/events/${eventId}/attendance/scan`,
        { type, token, rating: Number(rating), gender, ageRange, message: message.trim() },
        { headers: authHeaders() }
      );
      setMsg(res.data?.msg || "Evaluation submitted. Your certificate is now available.");
      setCertificate(res.data?.certificate || null);
      setMessage("");
    } catch (e) {
      setErr(e.response?.data?.msg || "Could not submit evaluation or issue certificate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at top left,#dff0ff 0,#f6fbff 34%,#fff8ef 100%)" }}>
      <Container className="py-5">
        <Card className="border-0 shadow-sm mx-auto" style={{ maxWidth: 780, borderRadius: 30, overflow: "hidden" }}>
          <div style={{ height: 10, background: "linear-gradient(90deg,#1e67c7,#16a3b8,#ffb443)" }} />
          <CardBody className="p-4 p-md-5 text-center">
            <div className="mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: 66, height: 66, borderRadius: 22, background: "linear-gradient(135deg,#1e67c7,#16a3b8)", color: "white", boxShadow: "0 18px 34px rgba(30,103,199,0.24)" }}>
              <FaAward size={30} />
            </div>
            <div style={{ color: "#1e67c7", fontWeight: 900, letterSpacing: "0.1em", fontSize: 12 }}>
              EVENT EVALUATION
            </div>
            <h3 className="fw-bold mb-2" style={{ color: "#102846" }}>SparkUp Attendance & Certificate</h3>
            <p style={{ color: "#6f88aa", lineHeight: 1.7, maxWidth: 580, margin: "0 auto" }}>
              Complete this short evaluation. Your gender and age group help the admin report, then your certificate will be released.
            </p>

            {err && <Alert color="danger" className="mt-4" style={{ borderRadius: 16 }}>{err}</Alert>}
            {msg && <Alert color="success" className="mt-4" style={{ borderRadius: 16 }}>{msg}</Alert>}

            {msg && certificate && (
              <div className="mt-4 p-4" style={{ borderRadius: 24, background: "linear-gradient(135deg,#f0fff8,#eef7ff)", border: "1px solid #d8f1e5" }}>
                <Badge pill color="success" className="mb-3" style={{ padding: "9px 14px" }}>Certificate Issued</Badge>
                <h4 className="fw-bold" style={{ color: "#102846" }}>{certificate.eventName || "Event Certificate"}</h4>
                <p className="mb-2" style={{ color: "#5e7899" }}>
                  Your certificate was created successfully. Open My Certificates to view, download, or print it.
                </p>
                <div className="small text-muted mb-3">Certificate ID: {certificate.code || certificate._id}</div>
                <Button color="success" onClick={() => navigate("/certificates")} style={{ borderRadius: 999, fontWeight: 900, padding: "11px 24px" }}>
                  Open / Download Certificate
                </Button>
              </div>
            )}

            {!msg && !user && (
              <div className="mt-4 p-4" style={{ borderRadius: 24, background: "linear-gradient(135deg,#fff8ef,#eef7ff)", border: "1px solid #d9e8fb" }}>
                <Badge pill color="warning" className="mb-3" style={{ padding: "9px 14px" }}>Login Required</Badge>
                <h5 className="fw-bold" style={{ color: "#102846" }}>Please login first</h5>
                <p style={{ color: "#5e7899", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 16px" }}>
                  To protect the certificate, SparkUp needs to know which participant scanned the QR code. After login, you will return to this evaluation page automatically.
                </p>
                <Button color="primary" onClick={goToLoginForScan} style={{ borderRadius: 999, fontWeight: 900, padding: "11px 24px" }}>
                  Login to Continue
                </Button>
              </div>
            )}

            {!msg && user && (
              <div className="mt-4">
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <div style={fieldBox}>
                      <Label style={labelStyle}><FaVenusMars color="#1e67c7" /> Gender</Label>
                      <Input type="select" value={gender} onChange={(e) => setGender(e.target.value)} style={inputStyle}>
                        <option value="">Select gender</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                      </Input>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div style={fieldBox}>
                      <Label style={labelStyle}><FaBirthdayCake color="#1e67c7" /> Age group</Label>
                      <Input type="select" value={ageRange} onChange={(e) => setAgeRange(e.target.value)} style={inputStyle}>
                        <option value="">Select age group</option>
                        <option value="under18">Under 18</option>
                        <option value="18-24">18–24</option>
                        <option value="25-34">25–34</option>
                        <option value="35plus">35+</option>
                      </Input>
                    </div>
                  </div>
                </div>

                <div style={{ ...fieldBox, padding: 18 }}>
                  <div style={{ color: "#102846", fontWeight: 900, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
                    <FaClipboardCheck color="#1e67c7" /> How was the event?
                  </div>
                  <StarPicker value={rating} onChange={setRating} />
                  <Input
                    type="textarea"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your opinion about the event, organization, activities, and what can be improved..."
                    style={{ minHeight: 130, borderRadius: 18, borderColor: "#d9e5f5", color: "#375a84", lineHeight: 1.6 }}
                  />
                </div>

                <Button
                  disabled={loading}
                  onClick={submitEvaluationAndGetCertificate}
                  className="mt-4"
                  style={{ borderRadius: 999, fontWeight: 900, padding: "13px 30px", background: "linear-gradient(135deg,#1e67c7,#16a3b8)", border: "none", boxShadow: "0 16px 28px rgba(30,103,199,0.22)" }}
                >
                  {loading ? <Spinner size="sm" /> : "Submit Evaluation & Get Certificate"}
                </Button>
              </div>
            )}

            <div className="d-flex gap-2 justify-content-center flex-wrap mt-4">
              <Button color="light" onClick={() => navigate("/events")} style={{ borderRadius: 14, fontWeight: 800 }}>Back to Events</Button>
              <Button color="success" onClick={() => navigate("/certificates")} style={{ borderRadius: 14, fontWeight: 800 }}>My Certificates</Button>
            </div>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}
