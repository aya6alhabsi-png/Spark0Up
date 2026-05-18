import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Alert,
  Spinner,
  Badge,
} from "reactstrap";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaChartBar, FaCommentDots, FaStar } from "react-icons/fa";
import { api, authHeaders } from "./api";

function MetricCard({ label, value, accent = "#1e67c7" }) {
  return (
    <Card
      className="border-0 shadow-sm h-100"
      style={{
        borderRadius: 20,
        background: "var(--surface-bg)",
        border: "1px solid #dfeaf8",
      }}
    >
      <CardBody className="p-4">
        <div style={{ color: "#6f88aa", fontWeight: 700, marginBottom: 10 }}>{label}</div>
        <div style={{ color: accent, fontWeight: 900, fontSize: "2rem", lineHeight: 1 }}>
          {value}
        </div>
      </CardBody>
    </Card>
  );
}

function DonutCard({ title, value, tone = "#1e67c7" }) {
  const pct = Math.max(0, Math.min(100, Number(value || 0)));
  return (
    <Card
      className="border-0 shadow-sm h-100"
      style={{
        borderRadius: 20,
        background: "var(--surface-bg)",
        border: "1px solid #dfeaf8",
      }}
    >
      <CardBody className="p-4 d-flex align-items-center justify-content-between">
        <div>
          <div style={{ color: "#102846", fontWeight: 800, marginBottom: 8 }}>{title}</div>
          <div style={{ color: "#6f88aa", lineHeight: 1.7 }}>
            Live summary from admin reports and feedback.
          </div>
        </div>

        <div
          style={{
            width: 94,
            height: 94,
            borderRadius: "50%",
            background: `conic-gradient(${tone} ${pct}%, #eef3fa ${pct}% 100%)`,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 66,
              height: 66,
              borderRadius: "50%",
              background: "var(--surface-bg)",
              display: "grid",
              placeItems: "center",
              color: "#102846",
              fontWeight: 900,
              fontSize: 22,
            }}
          >
            {pct}%
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default function ReportsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [reportStats, setReportStats] = useState(null);
  const [feedbackSummary, setFeedbackSummary] = useState({
    averageRating: 0,
    total: 0,
    feedback: [],
    eventSummaryReports: [],
    totalEventEvaluations: 0,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr("");
      try {
        const [reportsRes, feedbackRes] = await Promise.all([
          api.get("/reports/admin", { headers: authHeaders() }),
          api.get("/admin/feedback/summary", { headers: authHeaders() }),
        ]);

        setReportStats(reportsRes.data?.stats || null);
        setFeedbackSummary({
          averageRating: feedbackRes.data?.averageRating || 0,
          total: feedbackRes.data?.total || 0,
          feedback: feedbackRes.data?.feedback || [],
          eventSummaryReports: feedbackRes.data?.eventSummaryReports || [],
          totalEventEvaluations: feedbackRes.data?.totalEventEvaluations || 0,
        });
      } catch (e) {
        setErr(e.response?.data?.msg || "Failed to load reports and feedback");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const roleCounts = useMemo(() => {
    const counts = { innovator: 0, funder: 0, reviewer: 0 };
    for (const item of feedbackSummary.feedback) {
      if (item.role === "innovator") counts.innovator += 1;
      if (item.role === "funder") counts.funder += 1;
      if (item.role === "reviewer") counts.reviewer += 1;
    }
    return counts;
  }, [feedbackSummary.feedback]);

  const maxFeedbackCount = Math.max(
    roleCounts.innovator,
    roleCounts.funder,
    roleCounts.reviewer,
    1
  );

  const breakdownBars = [
    {
      label: "Innovator",
      value: roleCounts.innovator,
      pct: Math.round((roleCounts.innovator / maxFeedbackCount) * 100),
      color: "#1e67c7",
    },
    {
      label: "Funder",
      value: roleCounts.funder,
      pct: Math.round((roleCounts.funder / maxFeedbackCount) * 100),
      color: "#17b8c4",
    },
    {
      label: "Reviewer",
      value: roleCounts.reviewer,
      pct: Math.round((roleCounts.reviewer / maxFeedbackCount) * 100),
      color: "#2f4058",
    },
  ];

  const eventSummaryReports = feedbackSummary.eventSummaryReports || reportStats?.eventSummaryReports || [];
  const latestFeedback = feedbackSummary.feedback.slice(0, 8);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--app-bg)" }}>
      <Container fluid className="py-4 px-3 px-md-4">
        <Card
          className="border-0 shadow-sm mb-4"
          style={{
            borderRadius: 24,
            overflow: "hidden",
            background: "linear-gradient(135deg, #214f8f 0%, #2f66b0 100%)",
            color: "#fff",
          }}
        >
          <CardBody className="p-4 p-md-5">
            <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", opacity: 0.9 }}>
                  REPORTS & FEEDBACK
                </div>
                <h2 className="fw-bold mb-2" style={{ fontSize: "2rem" }}>
                  Admin analytics and user feedback
                </h2>
                <div style={{ opacity: 0.9, maxWidth: 760, lineHeight: 1.7 }}>
                  View live platform stats plus feedback submitted by innovators, funders, and reviewers in one dashboard.
                </div>
              </div>

              <Button
                color="light"
                onClick={() => navigate("/admin")}
                style={{ borderRadius: 14, fontWeight: 800 }}
              >
                <FaArrowLeft className="me-2" />
                Back to Admin
              </Button>
            </div>
          </CardBody>
        </Card>

        {err && <Alert color="danger">{err}</Alert>}

        {loading ? (
          <div className="text-center py-5">
            <Spinner />
          </div>
        ) : (
          <>
            <Row className="g-3 mb-4">
              <Col md="6" xl="3">
                <MetricCard label="Average Rating" value={feedbackSummary.averageRating || 0} accent="#1e67c7" />
              </Col>
              <Col md="6" xl="3">
                <MetricCard label="Total Feedback" value={feedbackSummary.total || 0} accent="#ff7a00" />
              </Col>
              <Col md="6" xl="3">
                <MetricCard label="Total Users" value={reportStats?.totalUsers || 0} accent="#17b8c4" />
              </Col>
              <Col md="6" xl="3">
                <MetricCard label="Total Ideas" value={reportStats?.totalIdeas || 0} accent="#2f4058" />
              </Col>
              <Col md="6" xl="3">
                <MetricCard label="Event Evaluations" value={reportStats?.totalEventEvaluations || feedbackSummary.totalEventEvaluations || 0} accent="#7c3aed" />
              </Col>
              <Col md="6" xl="3">
                <MetricCard label="Event Certificates" value={reportStats?.totalCertificatesIssuedForEvents || 0} accent="#1f8a5c" />
              </Col>
            </Row>

            <Row className="g-4 mb-4">
              <Col lg="6">
                <Card
                  className="border-0 shadow-sm h-100"
                  style={{ borderRadius: 22, background: "var(--surface-bg)", border: "1px solid #dfeaf8" }}
                >
                  <CardBody className="p-4">
                    <div className="d-flex align-items-center justify-content-between mb-4">
                      <div style={{ fontWeight: 900, color: "#102846", fontSize: 22 }}>
                        Feedback Distribution
                      </div>
                      <FaChartBar style={{ color: "#6f88aa" }} />
                    </div>

                    <Row className="g-3 align-items-stretch">
                      <Col md="5">
                        <div
                          style={{
                            borderRadius: 18,
                            background: "#f5f9ff",
                            border: "1px solid #e3eefb",
                            padding: 18,
                            height: "100%",
                          }}
                        >
                          <div style={{ color: "#6f88aa", fontWeight: 700, marginBottom: 8 }}>
                            Total Feedback Entries
                          </div>
                          <div style={{ color: "#102846", fontWeight: 900, fontSize: "2rem" }}>
                            {feedbackSummary.total || 0}
                          </div>
                          <div style={{ color: "#6f88aa", marginTop: 10, lineHeight: 1.6 }}>
                            From innovators, funders, and reviewers.
                          </div>

                          <div className="mt-4 d-grid gap-3">
                            <div>
                              <div style={{ color: "#102846", fontWeight: 800 }}>{roleCounts.innovator}</div>
                              <div style={{ color: "#6f88aa", fontSize: 13 }}>Innovator feedback</div>
                            </div>
                            <div>
                              <div style={{ color: "#102846", fontWeight: 800 }}>{roleCounts.funder}</div>
                              <div style={{ color: "#6f88aa", fontSize: 13 }}>Funder feedback</div>
                            </div>
                            <div>
                              <div style={{ color: "#102846", fontWeight: 800 }}>{roleCounts.reviewer}</div>
                              <div style={{ color: "#6f88aa", fontSize: 13 }}>Reviewer feedback</div>
                            </div>
                          </div>
                        </div>
                      </Col>

                      <Col md="7">
                        <div
                          style={{
                            borderRadius: 18,
                            background: "#fbfdff",
                            border: "1px solid #e7eef8",
                            padding: 18,
                            height: "100%",
                          }}
                        >
                          <div style={{ color: "#102846", fontWeight: 800, marginBottom: 16 }}>
                            Role distribution
                          </div>

                          <div style={{ display: "grid", gap: 18 }}>
                            {breakdownBars.map((item) => (
                              <div key={item.label}>
                                <div className="d-flex justify-content-between mb-1">
                                  <span style={{ color: "#4d6687", fontWeight: 700 }}>{item.label}</span>
                                  <span style={{ color: "#102846", fontWeight: 800 }}>{item.value}</span>
                                </div>
                                <div
                                  style={{
                                    height: 18,
                                    borderRadius: 999,
                                    background: "#eef3fa",
                                    overflow: "hidden",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${item.pct}%`,
                                      height: "100%",
                                      background: item.color,
                                      borderRadius: 999,
                                      transition: "width 0.35s ease",
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 d-flex flex-wrap gap-2">
                            {breakdownBars.map((item) => (
                              <Badge
                                key={item.label}
                                pill
                                style={{
                                  background: `${item.color}18`,
                                  color: item.color,
                                  padding: "8px 12px",
                                  fontWeight: 800,
                                }}
                              >
                                {item.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </CardBody>
                </Card>
              </Col>

              <Col lg="6">
                <Card
                  className="border-0 shadow-sm h-100"
                  style={{ borderRadius: 22, background: "var(--surface-bg)", border: "1px solid #dfeaf8" }}
                >
                  <CardBody className="p-4">
                    <div className="d-flex align-items-center justify-content-between mb-4">
                      <div style={{ fontWeight: 900, color: "#102846", fontSize: 22 }}>
                        Platform Snapshot
                      </div>
                      <FaStar style={{ color: "#6f88aa" }} />
                    </div>

                    <Row className="g-3">
                      <Col md="6">
                        <DonutCard title="Active Funders" value={reportStats?.activeFunders || 0} tone="#1e67c7" />
                      </Col>
                      <Col md="6">
                        <DonutCard title="Total Events" value={reportStats?.totalEvents || 0} tone="#17b8c4" />
                      </Col>
                      <Col md="6">
                        <DonutCard title="Total Contracts" value={reportStats?.totalContracts || 0} tone="#2f4058" />
                      </Col>
                      <Col md="6">
                        <DonutCard title="Funding Programs" value={reportStats?.totalFundingPrograms || 0} tone="#ff7a00" />
                      </Col>
                    </Row>
                  </CardBody>
                </Card>
              </Col>
            </Row>



            <Card
              className="border-0 shadow-sm mb-4"
              style={{ borderRadius: 22, background: "var(--surface-bg)", border: "1px solid #dfeaf8" }}
            >
              <CardBody className="p-4">
                <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
                  <div>
                    <div style={{ fontWeight: 900, color: "#102846", fontSize: 22 }}>
                      Participant Demographic Analytics
                    </div>
                    <div style={{ color: "#6f88aa", lineHeight: 1.7 }}>
                      CAT A M9 report data from user profiles: gender, age range, and field/specialization.
                    </div>
                  </div>
                </div>

                <Row className="g-3">
                  <Col lg="4">
                    <div style={{ borderRadius: 18, background: "#fbfdff", border: "1px solid #e4edf8", padding: 18, height: "100%" }}>
                      <div style={{ color: "#102846", fontWeight: 900, marginBottom: 12 }}>Gender</div>
                      {Object.entries(reportStats?.genderBreakdown || {}).map(([key, value]) => (
                        <div key={key} className="d-flex justify-content-between mb-2" style={{ color: "#5e7899" }}>
                          <span>{key === "female" ? "Female" : "Male"}</span><strong>{value}</strong>
                        </div>
                      ))}
                    </div>
                  </Col>

                  <Col lg="4">
                    <div style={{ borderRadius: 18, background: "#fbfdff", border: "1px solid #e4edf8", padding: 18, height: "100%" }}>
                      <div style={{ color: "#102846", fontWeight: 900, marginBottom: 12 }}>Age Groups</div>
                      {Object.entries(reportStats?.ageBreakdown || {}).map(([key, value]) => (
                        <div key={key} className="d-flex justify-content-between mb-2" style={{ color: "#5e7899" }}>
                          <span>{key.replace("under18", "Under 18").replace("age18to24", "18–24").replace("age25to34", "25–34").replace("age35plus", "35+")}</span><strong>{value}</strong>
                        </div>
                      ))}
                    </div>
                  </Col>

                  <Col lg="4">
                    <div style={{ borderRadius: 18, background: "#fbfdff", border: "1px solid #e4edf8", padding: 18, height: "100%" }}>
                      <div style={{ color: "#102846", fontWeight: 900, marginBottom: 12 }}>Fields</div>
                      {Object.entries(reportStats?.fieldBreakdown || {}).slice(0, 8).map(([key, value]) => (
                        <div key={key} className="d-flex justify-content-between mb-2" style={{ color: "#5e7899" }}>
                          <span>{key}</span><strong>{value}</strong>
                        </div>
                      ))}
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>

            <Card
              className="border-0 shadow-sm mb-4"
              style={{ borderRadius: 22, background: "var(--surface-bg)", border: "1px solid #dfeaf8" }}
            >
              <CardBody className="p-4">
                <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
                  <div>
                    <div style={{ fontWeight: 900, color: "#102846", fontSize: 22 }}>
                      Event Summary Reports
                    </div>
                    <div style={{ color: "#6f88aa", lineHeight: 1.7 }}>
                      Automatically created after finished events when participants scan the QR, evaluate the event, and receive certificates.
                    </div>
                  </div>
                  <Badge pill style={{ background: "#eef5ff", color: "#1e67c7", padding: "8px 12px" }}>
                    {eventSummaryReports.length} finished events
                  </Badge>
                </div>

                {eventSummaryReports.length === 0 ? (
                  <Alert color="info" className="mb-0">
                    No event summary reports yet. They will appear after an event finishes and participants complete the QR evaluation.
                  </Alert>
                ) : (
                  <Row className="g-3">
                    {eventSummaryReports.map((event) => (
                      <Col lg="6" key={event.eventId}>
                        <div style={{ borderRadius: 18, background: "#fbfdff", border: "1px solid #e4edf8", padding: 18, height: "100%" }}>
                          <div className="d-flex justify-content-between gap-2 flex-wrap mb-2">
                            <div style={{ color: "#102846", fontWeight: 900, fontSize: 18 }}>{event.title}</div>
                            <Badge pill style={{ background: "#fff6df", color: "#b78100", padding: "8px 12px" }}>
                              {event.averageRating || 0} / 5
                            </Badge>
                          </div>
                          <div style={{ color: "#6f88aa", fontSize: 13, marginBottom: 14 }}>
                            {event.organizationName} • {event.endDate ? new Date(event.endDate).toLocaleDateString() : "No date"}
                          </div>

                          <Row className="g-2 mb-3">
                            <Col xs="6" md="3"><MetricCard label="Registered" value={event.registeredParticipants || 0} accent="#1e67c7" /></Col>
                            <Col xs="6" md="3"><MetricCard label="Completed" value={event.completedParticipants || 0} accent="#17b8c4" /></Col>
                            <Col xs="6" md="3"><MetricCard label="Certificates" value={event.certificatesIssued || 0} accent="#1f8a5c" /></Col>
                            <Col xs="6" md="3"><MetricCard label="Evaluations" value={event.evaluationCount || 0} accent="#7c3aed" /></Col>
                          </Row>

                          <Row className="g-2 mb-3">
                            <Col xs="6">
                              <div style={{ background: "#f5f9ff", borderRadius: 14, padding: 12, color: "#5e7899" }}>
                                <strong style={{ color: "#102846" }}>Gender</strong>
                                <div className="d-flex justify-content-between mt-2"><span>Female</span><b>{event.evaluationGenderBreakdown?.female || 0}</b></div>
                                <div className="d-flex justify-content-between"><span>Male</span><b>{event.evaluationGenderBreakdown?.male || 0}</b></div>
                              </div>
                            </Col>
                            <Col xs="6">
                              <div style={{ background: "#f5f9ff", borderRadius: 14, padding: 12, color: "#5e7899" }}>
                                <strong style={{ color: "#102846" }}>Age</strong>
                                <div className="d-flex justify-content-between mt-2"><span>Under 18</span><b>{event.evaluationAgeBreakdown?.under18 || 0}</b></div>
                                <div className="d-flex justify-content-between"><span>18–24</span><b>{event.evaluationAgeBreakdown?.age18to24 || 0}</b></div>
                                <div className="d-flex justify-content-between"><span>25–34</span><b>{event.evaluationAgeBreakdown?.age25to34 || 0}</b></div>
                                <div className="d-flex justify-content-between"><span>35+</span><b>{event.evaluationAgeBreakdown?.age35plus || 0}</b></div>
                              </div>
                            </Col>
                          </Row>

                          {(event.latestComments || []).slice(0, 2).map((comment) => (
                            <div key={comment._id} style={{ background: "#ffffff", border: "1px solid #e4edf8", borderRadius: 14, padding: 12, marginTop: 8, color: "#5e7899", lineHeight: 1.6 }}>
                              <strong style={{ color: "#102846" }}>{comment.rating || 0}/5</strong>
                              <span style={{ color: "#8aa0ba", fontSize: 12 }}> • {comment.gender === "female" ? "Female" : comment.gender === "male" ? "Male" : "Gender not set"} • {comment.ageRange || "Age not set"}</span>
                              <div>{comment.message}</div>
                            </div>
                          ))}
                        </div>
                      </Col>
                    ))}
                  </Row>
                )}
              </CardBody>
            </Card>

            <Card
              className="border-0 shadow-sm"
              style={{ borderRadius: 22, background: "var(--surface-bg)", border: "1px solid #dfeaf8" }}
            >
              <CardBody className="p-4">
                <div className="d-flex align-items-center gap-2 mb-4">
                  <FaCommentDots style={{ color: "#1e67c7" }} />
                  <div style={{ fontWeight: 900, color: "#102846", fontSize: 22 }}>
                    Latest Feedback
                  </div>
                </div>

                {latestFeedback.length === 0 ? (
                  <Alert color="info" className="mb-0">
                    No feedback submitted yet.
                  </Alert>
                ) : (
                  <Row className="g-3">
                    {latestFeedback.map((item) => (
                      <Col md="6" xl="4" key={item._id}>
                        <div
                          style={{
                            borderRadius: 18,
                            background: "#fbfdff",
                            border: "1px solid #e4edf8",
                            padding: 16,
                            height: "100%",
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-start gap-2 mb-3 flex-wrap">
                            <div>
                              <div style={{ color: "#102846", fontWeight: 800 }}>
                                {item.userId?.name || "User"}
                              </div>
                              <div style={{ color: "#6f88aa", fontSize: 13 }}>
                                {item.userId?.email || "No email"}
                              </div>
                            </div>

                            <div className="d-flex gap-2 flex-wrap">
                              <Badge pill style={{ background: "#eef5ff", color: "#1e67c7", padding: "8px 12px" }}>
                                {item.role}
                              </Badge>
                              <Badge pill style={{ background: "#fff6df", color: "#b78100", padding: "8px 12px" }}>
                                {item.rating || 0} / 5
                              </Badge>
                            </div>
                          </div>

                          <div style={{ color: "#5e7899", lineHeight: 1.75 }}>{item.message}</div>

                          <div style={{ color: "#97a8bc", fontSize: 12, marginTop: 12 }}>
                            {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                )}
              </CardBody>
            </Card>
          </>
        )}
      </Container>
    </div>
  );
}
