
import React, { useEffect, useMemo, useState } from "react";
import { Container, Card, CardBody, Button, Input, Alert, Spinner, Badge, Row, Col } from "reactstrap";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { api, authHeaders } from "./api";
import { FaArrowLeft, FaStar, FaRegStar, FaCommentDots, FaChartBar } from "react-icons/fa";

function StarPicker({ value, onChange }) {
  return (
    <div className="d-flex justify-content-center gap-2 my-4">
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
              background: "transparent",
              padding: 0,
              color: active ? "#ffcf4d" : "#d5dce8",
              fontSize: 40,
              cursor: "pointer",
              filter: active ? "drop-shadow(0 6px 10px rgba(255,207,77,0.3))" : "none",
            }}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}

function MetricCard({ label, value, accent }) {
  return (
    <Card className="border-0 shadow-sm h-100" style={{ borderRadius: 22, border: "1px solid #e2ebf8" }}>
      <CardBody className="p-4">
        <div style={{ color: "#6b85a5", fontWeight: 700, marginBottom: 8 }}>{label}</div>
        <div style={{ color: accent, fontWeight: 900, fontSize: "2rem", lineHeight: 1 }}>{value}</div>
      </CardBody>
    </Card>
  );
}

export default function FeedbackPage() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(4);
  const [summary, setSummary] = useState({ averageRating: 0, total: 0, feedback: [], eventSummaryReports: [], totalEventEvaluations: 0 });

  const loadAdminSummary = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await api.get("/admin/feedback/summary", { headers: authHeaders() });
      setSummary({
        averageRating: res.data?.averageRating || 0,
        total: res.data?.total || 0,
        feedback: res.data?.feedback || [],
        eventSummaryReports: res.data?.eventSummaryReports || [],
        totalEventEvaluations: res.data?.totalEventEvaluations || 0,
      });
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to load feedback summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (isAdmin) loadAdminSummary();
  }, [user, isAdmin, navigate]);

  const submit = async () => {
    setErr("");
    setOk("");
    if (!message.trim()) {
      setErr("Please write your feedback message");
      return;
    }
    try {
      await api.post(
        "/feedback",
        { message: message.trim(), rating: Number(rating) },
        { headers: authHeaders() }
      );
      setOk("Feedback submitted successfully. Thank you!");
      setMessage("");
      setRating(4);
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to submit feedback");
    }
  };

  const roleCounts = useMemo(() => {
    const counts = { innovator: 0, funder: 0, reviewer: 0 };
    for (const item of summary.feedback || []) {
      if (counts[item.role] != null) counts[item.role] += 1;
    }
    return counts;
  }, [summary.feedback]);

  const eventSummaryReports = summary.eventSummaryReports || [];
  const latest = (summary.feedback || []).slice(0, 12);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #dbe8ff 0%, #e7edff 55%, #f8e6ef 100%)" }}>
      <Container className="py-4">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <div style={{ color: "#6d84a4", fontWeight: 800, textTransform: "uppercase", fontSize: 12, letterSpacing: "0.08em" }}>
              Feedback center
            </div>
            <h2 className="m-0" style={{ color: "#102846", fontWeight: 900 }}>
              {isAdmin ? "Experience feedback summary" : "Rate your experience"}
            </h2>
          </div>
          <Button color="light" onClick={() => navigate(-1)} style={{ borderRadius: 14, fontWeight: 700 }}>
            <FaArrowLeft className="me-2" />
            Back
          </Button>
        </div>

        {err && <Alert color="danger">{err}</Alert>}
        {ok && <Alert color="success">{ok}</Alert>}

        {!isAdmin ? (
          <Row className="justify-content-center">
            <Col lg="6" xl="5">
              <Card
                className="border-0 shadow-lg"
                style={{
                  borderRadius: 28,
                  background: "rgba(255,255,255,0.52)",
                  backdropFilter: "blur(14px)",
                  border: "1px solid rgba(255,255,255,0.5)",
                }}
              >
                <CardBody className="p-4 p-md-5 text-center">
                  <h2 style={{ color: "#102846", fontWeight: 900, marginBottom: 16 }}>Rate your experience</h2>
                  <p style={{ color: "#6b7f98", lineHeight: 1.8, maxWidth: 430, margin: "0 auto" }}>
                    We highly value your feedback. Kindly take a moment to rate your experience and provide your valuable comment about SparkUp.
                  </p>

                  <StarPicker value={rating} onChange={setRating} />

                  <Input
                    type="textarea"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about your experience!"
                    style={{
                      minHeight: 130,
                      borderRadius: 20,
                      borderColor: "#d8e4f5",
                      boxShadow: "0 10px 22px rgba(16,40,70,0.06)",
                      background: "rgba(255,255,255,0.84)",
                    }}
                  />

                  <Button
                    onClick={submit}
                    style={{
                      marginTop: 22,
                      borderRadius: 999,
                      fontWeight: 800,
                      padding: "12px 34px",
                      background: "linear-gradient(135deg, #ffcf4d, #f2b705)",
                      border: "none",
                      color: "#5f4700",
                      boxShadow: "0 12px 24px rgba(242,183,5,0.24)",
                    }}
                  >
                    Send
                  </Button>
                </CardBody>
              </Card>
            </Col>
          </Row>
        ) : loading ? (
          <div className="text-center py-5"><Spinner /></div>
        ) : (
          <>
            <Row className="g-4 mb-4">
              <Col md="6" xl="3"><MetricCard label="Average Rating" value={summary.averageRating || 0} accent="#1e67c7" /></Col>
              <Col md="6" xl="3"><MetricCard label="Total Feedback" value={summary.total || 0} accent="#ff7a00" /></Col>
              <Col md="6" xl="3"><MetricCard label="Innovator Notes" value={roleCounts.innovator} accent="#1f8a5c" /></Col>
              <Col md="6" xl="3"><MetricCard label="Reviewer + Funder" value={roleCounts.reviewer + roleCounts.funder} accent="#7c3aed" /></Col>
              <Col md="6" xl="3"><MetricCard label="Event Evaluations" value={summary.totalEventEvaluations || 0} accent="#0f766e" /></Col>
            </Row>

            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 24, border: "1px solid #e2ebf8" }}>
              <CardBody className="p-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <FaChartBar style={{ color: "#0f766e" }} />
                  <div style={{ color: "#102846", fontWeight: 900 }}>Event summary reports</div>
                </div>
                {eventSummaryReports.length === 0 ? (
                  <Alert color="info" className="mb-0">No completed event evaluations yet.</Alert>
                ) : (
                  <Row className="g-3">
                    {eventSummaryReports.slice(0, 4).map((event) => (
                      <Col md="6" key={event.eventId}>
                        <div style={{ borderRadius: 18, background: "#fbfdff", border: "1px solid #e4edf8", padding: 16 }}>
                          <div style={{ color: "#102846", fontWeight: 900 }}>{event.title}</div>
                          <div style={{ color: "#6f88aa", fontSize: 13, marginTop: 4 }}>{event.organizationName}</div>
                          <div className="d-flex gap-2 flex-wrap mt-3">
                            <Badge pill style={{ background: "#eef5ff", color: "#1e67c7", padding: "8px 12px" }}>{event.registeredParticipants || 0} registered</Badge>
                            <Badge pill style={{ background: "#e8fff7", color: "#0f766e", padding: "8px 12px" }}>{event.certificatesIssued || 0} certificates</Badge>
                            <Badge pill style={{ background: "#fff6df", color: "#b78100", padding: "8px 12px" }}>{event.averageRating || 0}/5 rating</Badge>
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                )}
              </CardBody>
            </Card>

            <Row className="g-4">
              <Col lg="4">
                <Card className="border-0 shadow-sm h-100" style={{ borderRadius: 24, border: "1px solid #e2ebf8" }}>
                  <CardBody className="p-4">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <FaChartBar style={{ color: "#1e67c7" }} />
                      <div style={{ color: "#102846", fontWeight: 900 }}>Feedback overview</div>
                    </div>

                    <div className="d-grid gap-3">
                      {[
                        { role: "Innovators", count: roleCounts.innovator, bg: "#edf8ef", color: "#1f8a5c" },
                        { role: "Funders", count: roleCounts.funder, bg: "#fff1e7", color: "#ff7a00" },
                        { role: "Reviewers", count: roleCounts.reviewer, bg: "#eef5ff", color: "#1e67c7" },
                      ].map((item) => (
                        <div key={item.role} style={{ borderRadius: 18, background: item.bg, padding: 16 }}>
                          <div style={{ color: item.color, fontWeight: 900, fontSize: 18 }}>{item.count}</div>
                          <div style={{ color: "#5f7895", fontWeight: 700 }}>{item.role}</div>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </Col>

              <Col lg="8">
                <Card className="border-0 shadow-sm" style={{ borderRadius: 24, border: "1px solid #e2ebf8" }}>
                  <CardBody className="p-4">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <FaCommentDots style={{ color: "#ff7a00" }} />
                      <div style={{ color: "#102846", fontWeight: 900 }}>Latest feedback</div>
                    </div>

                    {latest.length === 0 ? (
                      <Alert color="info" className="mb-0">No feedback received yet.</Alert>
                    ) : (
                      <div style={{ display: "grid", gap: 14 }}>
                        {latest.map((f) => (
                          <div
                            key={f._id}
                            style={{
                              borderRadius: 20,
                              background: "#fbfdff",
                              border: "1px solid #e4edf8",
                              padding: 16,
                            }}
                          >
                            <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                              <div>
                                <div style={{ color: "#102846", fontWeight: 800 }}>
                                  {f.userId?.name || "User"}{" "}
                                  <span style={{ color: "#6c86a7", fontWeight: 600 }}>
                                    ({f.userId?.email || "No email"})
                                  </span>
                                </div>
                                <div style={{ color: "#7a8da8", fontSize: 13, marginTop: 4 }}>
                                  {new Date(f.createdAt).toLocaleString()}
                                </div>
                              </div>

                              <div className="d-flex gap-2 flex-wrap">
                                <Badge pill style={{ background: "#eef5ff", color: "#1e67c7", padding: "8px 12px" }}>
                                  {f.role}
                                </Badge>
                                <Badge pill style={{ background: "#fff6df", color: "#b78100", padding: "8px 12px" }}>
                                  {f.rating || 0} / 5
                                </Badge>
                              </div>
                            </div>

                            <div style={{ color: "#5e7899", lineHeight: 1.75, marginTop: 10 }}>
                              {f.message}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Container>
    </div>
  );
}
