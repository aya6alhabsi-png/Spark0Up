import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  Col,
  Container,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  Spinner,
} from "reactstrap";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { api, API_URL, authHeaders } from "./api";

const sparkBlue = "#1d5fa8";
const sparkOrange = "#ff9f43";

const normalizeAssetUrl = (url) => {
  if (!url) return "";
  if (/^(https?:)?\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  return `${API_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

const formatDateRange = (start, end) => {
  const s = new Date(start);
  const e = new Date(end || start);
  if (Number.isNaN(s.getTime())) return "Date not available";

  const sameDay = s.toDateString() === e.toDateString();
  const dateText = s.toLocaleDateString([], {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  if (sameDay) return dateText;

  return `${dateText} → ${e.toLocaleDateString([], {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  })}`;
};

const formatTimeRange = (start, end) => {
  const s = new Date(start);
  const e = new Date(end || start);
  if (Number.isNaN(s.getTime())) return "Time not available";

  return `${s.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })} - ${e.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })}`;
};

const qrImageUrl = (value) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(value || "")}`;

export default function EventsPage() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const isAdmin = String(user?.role || "").toLowerCase() === "admin";

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [events, setEvents] = useState([]);

  const [q, setQ] = useState("");
  const [sort, setSort] = useState("date_desc");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [statusView, setStatusView] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "active",
    location: "",
    organizationName: "SparkUp",
    capacity: 0,
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceEvent, setAttendanceEvent] = useState(null);

  const queryParams = useMemo(() => {
    const params = {};
    if (q.trim()) params.q = q.trim();
    if (sort) params.sort = sort;
    if (year) params.year = year;
    if (month) params.month = month;
    if (isAdmin) params.showPast = "true";
    return params;
  }, [q, sort, year, month, isAdmin]);

  const fetchEvents = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await api.get("/events", { params: queryParams, headers: authHeaders() });
      setEvents(res.data?.events || []);
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const visibleEvents = useMemo(() => {
    if (!isAdmin) return events;
    if (statusView === "active") return events.filter((ev) => ev.status === "active" && !ev.isPast && new Date(ev.endDate) >= new Date());
    if (statusView === "draft") return events.filter((ev) => ev.status === "draft");
    if (statusView === "archived") return events.filter((ev) => ev.status === "archived" || ev.status === "disabled");
    return events;
  }, [events, isAdmin, statusView]);

  const upcomingCount = events.filter((ev) => new Date(ev.startDate) >= new Date() && ev.status === "active").length;
  const draftCount = events.filter((ev) => ev.status === "draft").length;
  const archivedCount = events.filter((ev) => ev.status === "archived" || ev.status === "disabled").length;
  const totalRegistrations = events.reduce((sum, ev) => sum + (ev.registrationCount || 0), 0);
  const nextEvent = [...events].filter((ev) => ev.status === "active" && new Date(ev.endDate) >= new Date()).sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0];

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      status: "active",
      location: "",
      organizationName: "SparkUp",
      capacity: 0,
    });
    setSelectedImage(null);
    setImagePreview("");
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (ev) => {
    setEditing(ev);
    setForm({
      title: ev.title || "",
      description: ev.description || "",
      startDate: ev.startDate ? new Date(ev.startDate).toISOString().slice(0, 16) : "",
      endDate: ev.endDate ? new Date(ev.endDate).toISOString().slice(0, 16) : "",
      status: ev.status || "active",
      location: ev.location || "",
      organizationName: ev.organizationName || "SparkUp",
      capacity: ev.capacity || 0,
    });
    setSelectedImage(null);
    setImagePreview(normalizeAssetUrl(ev.imageUrl));
    setModalOpen(true);
  };

  const onPickImage = (e) => {
    const file = e.target.files?.[0];
    setSelectedImage(file || null);
    if (!file) return;

    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
  };

  const saveEvent = async () => {
    setErr("");
    setOkMsg("");

    if (!form.title.trim() || !form.description.trim() || !form.startDate || !form.endDate || !form.location.trim() || !form.organizationName.trim()) {
      setErr("Please complete title, organization, description, date, time, and location.");
      return;
    }

    if (new Date(form.startDate) < new Date() && !editing) {
      setErr("Start date cannot be in the past.");
      return;
    }

    if (new Date(form.endDate) <= new Date(form.startDate)) {
      setErr("End time must be after the start time.");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("description", form.description.trim());
      formData.append("startDate", new Date(form.startDate).toISOString());
      formData.append("endDate", new Date(form.endDate).toISOString());
      formData.append("status", form.status || "active");
      formData.append("location", form.location.trim());
      formData.append("organizationName", form.organizationName.trim());
      formData.append("capacity", Number(form.capacity) || 0);
      if (selectedImage) formData.append("image", selectedImage);

      if (editing?._id) {
        await api.patch(`/events/${editing._id}`, formData, {
          headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
        });
        setOkMsg("Event updated successfully.");
      } else {
        await api.post("/events", formData, {
          headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
        });
        setOkMsg("Event created successfully.");
      }

      setModalOpen(false);
      resetForm();
      fetchEvents();
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  const updateEventStatus = async (id, status) => {
    setErr("");
    setOkMsg("");
    try {
      await api.patch(`/events/${id}`, { status }, { headers: authHeaders() });
      setOkMsg(status === "active" ? "Event enabled." : status === "draft" ? "Event moved to draft." : "Event hidden/disabled.");
      fetchEvents();
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to update event status");
    }
  };

  const registerForEvent = async (id) => {
    setErr("");
    setOkMsg("");
    try {
      await api.post(`/events/${id}/register`, {}, { headers: authHeaders() });
      setOkMsg("Registration completed successfully.");
      fetchEvents();
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to register");
    }
  };

  const openAttendance = async (eventId) => {
    setErr("");
    setAttendanceOpen(true);
    setAttendanceLoading(true);
    setAttendanceEvent(null);
    try {
      const res = await api.get(`/events/${eventId}/attendance`, { headers: authHeaders() });
      setAttendanceEvent(res.data?.event || null);
    } catch (e) {
      const status = e.response?.status;
      const msg = e.response?.data?.msg;
      setErr(
        status === 403
          ? "Forbidden: QR Attendance is admin-only. Please login again using the Admin account, then reopen Events."
          : msg || "Failed to load event attendance QR codes"
      );
      setAttendanceOpen(false);
    } finally {
      setAttendanceLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #eef6ff 0%, #f7fbff 45%, #fff8ef 100%)",
      }}
    >
      <Container className="py-4 py-lg-5 tour-events">
        <Card
          className="border-0 shadow-sm overflow-hidden mb-4"
          style={{
            borderRadius: 28,
            background: "linear-gradient(125deg, #0f2d52 0%, #1e5fa7 55%, #4ea3ff 100%)",
          }}
        >
          <CardBody style={{ padding: "32px 30px" }}>
            <Row className="align-items-center g-4">
              <Col lg="7">
                <Badge
                  pill
                  style={{
                    background: "rgba(255,255,255,0.16)",
                    color: "#fff",
                    padding: "8px 14px",
                    fontSize: 12,
                    letterSpacing: "0.08em",
                  }}
                >
                  SPARKUP EVENTS HUB
                </Badge>
                <h1 className="mt-3 mb-3" style={{ color: "#fff", fontWeight: 800 }}>
                  Beautiful event experiences for your innovation community.
                </h1>
                <p style={{ color: "#e2efff", fontSize: 16, lineHeight: 1.8, maxWidth: 700 }}>
                  Showcase every event with a strong visual cover, organization name, date, time, location, full description,
                  and a clear registration action that matches your SparkUp blue and orange brand.
                </p>
                <div className="d-flex gap-2 flex-wrap mt-4 tour-events">
                  <Button
                    onClick={() => navigate(-1)}
                    style={{
                      background: sparkOrange,
                      border: "none",
                      borderRadius: 14,
                      fontWeight: 700,
                      padding: "11px 18px",
                    }}
                  >
                    Back
                  </Button>
                  {isAdmin && (
                    <Button
                      onClick={openCreate}
                      style={{
                        background: "var(--surface-bg)",
                        color: sparkBlue,
                        border: "none",
                        borderRadius: 14,
                        fontWeight: 700,
                        padding: "11px 18px",
                      }}
                    >
                      + Create Event
                    </Button>
                  )}
                </div>
              </Col>

              <Col lg="5">
                <div
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    borderRadius: 24,
                    padding: 20,
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                  }}
                >
                  <Row className="g-3">
                    {[
                      { label: "Total Events", value: events.length },
                      { label: "Upcoming", value: upcomingCount },
                      { label: "Draft / Finished", value: draftCount },
                      { label: "Archived", value: archivedCount },
                      { label: "Registrations", value: totalRegistrations },
                      {
                        label: "Next Event",
                        value: nextEvent ? new Date(nextEvent.startDate).toLocaleDateString() : "—",
                      },
                    ].map((item) => (
                      <Col xs="6" key={item.label}>
                        <div
                          style={{
                            background: "rgba(255,255,255,0.12)",
                            borderRadius: 20,
                            padding: "18px 16px",
                            color: "#fff",
                            minHeight: 106,
                          }}
                        >
                          <div style={{ fontSize: 12, color: "#d6e8ff", marginBottom: 6 }}>{item.label}</div>
                          <div style={{ fontSize: 24, fontWeight: 800 }}>{item.value}</div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              </Col>
            </Row>
          </CardBody>
        </Card>

        {err && <Alert color="danger">{err}</Alert>}
        {okMsg && <Alert color="success">{okMsg}</Alert>}

        {isAdmin && (
          <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 22 }}>
            <CardBody style={{ padding: 18 }}>
              <div className="d-flex gap-2 flex-wrap align-items-center">
                <strong style={{ color: "#102846", marginRight: 8 }}>Admin Event View:</strong>
                {[
                  { key: "all", label: "All Events" },
                  { key: "active", label: "Active Events" },
                  { key: "draft", label: "Draft / Finished Events" },
                  { key: "archived", label: "Archived / Hidden Events" },
                ].map((tab) => (
                  <Button
                    key={tab.key}
                    onClick={() => setStatusView(tab.key)}
                    style={{
                      background: statusView === tab.key ? sparkBlue : "#edf4ff",
                      color: statusView === tab.key ? "#fff" : sparkBlue,
                      border: "1px solid #d7e6fb",
                      borderRadius: 999,
                      fontWeight: 800,
                      padding: "9px 16px",
                    }}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
              <div style={{ color: "#5d7598", marginTop: 10, fontSize: 14 }}>
                Finished events move automatically to Archive. Normal users only see upcoming active events.
              </div>
            </CardBody>
          </Card>
        )}

        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 24 }}>
          <CardBody style={{ padding: 22 }}>
            <Row className="g-3 align-items-end">
              <Col lg="4">
                <Label className="fw-bold mb-2">Search</Label>
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title, location, or description" />
              </Col>
              <Col md="3" lg="2">
                <Label className="fw-bold mb-2">Sort</Label>
                <Input type="select" value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="date_desc">Latest first</option>
                  <option value="date_asc">Earliest first</option>
                  <option value="title_asc">A to Z</option>
                  <option value="title_desc">Z to A</option>
                </Input>
              </Col>
              <Col md="2" lg="2">
                <Label className="fw-bold mb-2">Year</Label>
                <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="2026" />
              </Col>
              <Col md="2" lg="2">
                <Label className="fw-bold mb-2">Month</Label>
                <Input value={month} onChange={(e) => setMonth(e.target.value)} placeholder="1 - 12" />
              </Col>
              <Col md="2" lg="2">
                <Button
                  block
                  onClick={() => {
                    setQ("");
                    setSort("date_desc");
                    setYear("");
                    setMonth("");
                  }}
                  style={{
                    width: "100%",
                    background: "#edf4ff",
                    color: sparkBlue,
                    border: "1px solid #d7e6fb",
                    borderRadius: 14,
                    fontWeight: 700,
                  }}
                >
                  Reset
                </Button>
              </Col>
            </Row>
          </CardBody>
        </Card>

        {loading ? (
          <div className="text-center py-5"><Spinner /></div>
        ) : visibleEvents.length === 0 ? (
          <Alert color="info">No events found in this view.</Alert>
        ) : (
          <Row className="g-4">
            {visibleEvents.map((ev, index) => {
              const isRegistered = (ev.registrations || []).some((r) => String(r.userId) === String(user?._id));
              const isFull = ev.capacity > 0 && ev.registrationCount >= ev.capacity;
              const isFinished = ev.isPast || new Date(ev.endDate) < new Date();
              const canRegister = !isRegistered && !isFull && ev.status === "active" && !isFinished;
              const seatsLeft = ev.capacity > 0 ? Math.max(ev.capacity - ev.registrationCount, 0) : null;

              return (
                <Col lg="6" key={ev._id}>
                  <Card
                    className="border-0 shadow-sm h-100 overflow-hidden"
                    style={{ borderRadius: 26, border: "1px solid #e6eefb" }}
                  >
                    <div
                      style={{
                        position: "relative",
                        height: 260,
                        background: ev.imageUrl
                          ? `linear-gradient(180deg, rgba(8,20,41,0.10) 0%, rgba(8,20,41,0.62) 100%), url(${normalizeAssetUrl(ev.imageUrl)}) center/cover`
                          : "linear-gradient(135deg, #d7ebff 0%, #8ec5ff 45%, #ffc67f 100%)",
                      }}
                    >
                      <div style={{ position: "absolute", inset: 0, padding: 22, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div className="d-flex justify-content-between gap-2 flex-wrap">
                          <Badge pill style={{ background: "rgba(255,255,255,0.16)", color: "#fff", padding: "8px 12px" }}>
                            Event #{index + 1}
                          </Badge>
                          <Badge pill style={{ background: ev.status === "draft" ? "#6c757d" : ev.status === "active" ? "#198754" : "#d9534f", color: "#fff", padding: "8px 12px" }}>
                            {ev.status === "draft" ? "Draft / Finished" : ev.status === "active" ? "Active" : "Hidden"}
                          </Badge>
                          <Badge pill style={{ background: sparkOrange, color: "#fff", padding: "8px 12px" }}>
                            {ev.registrationCount || 0} Registered
                          </Badge>
                        </div>

                        <div>
                          <h3 style={{ color: "#fff", fontWeight: 800, marginBottom: 10 }}>{ev.title}</h3>
                          <div className="d-flex gap-2 flex-wrap">
                            <Badge pill style={{ background: "rgba(255,255,255,0.14)", color: "#fff", padding: "8px 12px" }}>
                              {formatDateRange(ev.startDate, ev.endDate)}
                            </Badge>
                            <Badge pill style={{ background: "rgba(255,255,255,0.14)", color: "#fff", padding: "8px 12px" }}>
                              {formatTimeRange(ev.startDate, ev.endDate)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <CardBody style={{ padding: 24 }}>
                      <div className="mb-3" style={{ color: "#5d7598", lineHeight: 1.8 }}>
                        {ev.description || "No description added yet."}
                      </div>

                      <Row className="g-3 mb-4">
                        {[
                          { label: "Organizer", value: ev.organizationName || "SparkUp" },
                          { label: "Location", value: ev.location || "Not set" },
                          { label: "Date", value: formatDateRange(ev.startDate, ev.endDate) },
                          { label: "Time", value: formatTimeRange(ev.startDate, ev.endDate) },
                          {
                            label: "Registration",
                            value: ev.capacity > 0 ? `${ev.registrationCount}/${ev.capacity}` : `${ev.registrationCount} joined`,
                          },
                        ].map((item) => (
                          <Col sm="6" key={item.label}>
                            <div
                              style={{
                                background: "#f7fbff",
                                border: "1px solid #e4eefb",
                                borderRadius: 18,
                                padding: "14px 16px",
                                minHeight: 88,
                              }}
                            >
                              <div style={{ color: "#6b88aa", fontSize: 12, marginBottom: 8, fontWeight: 700 }}>{item.label}</div>
                              <div style={{ color: "#102846", fontWeight: 800 }}>{item.value}</div>
                            </div>
                          </Col>
                        ))}
                      </Row>

                      {!isAdmin && (
                        <div
                          style={{
                            background: isRegistered ? "#eef8f2" : "#fff8ef",
                            border: `1px solid ${isRegistered ? "#d6efdf" : "#ffe3bf"}`,
                            borderRadius: 18,
                            padding: "14px 16px",
                            color: "#35506d",
                            marginBottom: 16,
                          }}
                        >
                          {isRegistered
                            ? "You are already registered for this event."
                            : ev.status === "draft" || isFinished
                            ? "This event is finished and moved to draft automatically."
                            : ev.status !== "active"
                            ? "Registration is hidden for this event."
                            : isFull
                            ? "This event is full right now."
                            : seatsLeft !== null
                            ? `${seatsLeft} seats left for registration.`
                            : "Registration is open now."}
                        </div>
                      )}

                      <div className="d-flex gap-2 flex-wrap">
                        {isAdmin ? (
                          <>
                            <Button
                              onClick={() => openEdit(ev)}
                              style={{ background: sparkBlue, border: "none", borderRadius: 14, fontWeight: 700 }}
                            >
                              Edit Event
                            </Button>
                            <Button
                              onClick={() => openAttendance(ev._id)}
                              style={{ background: sparkOrange, border: "none", borderRadius: 14, fontWeight: 700 }}
                            >
                              QR Attendance
                            </Button>
                            <Button
                              onClick={() => updateEventStatus(ev._id, ev.status === "active" ? "disabled" : "active")}
                              style={{ background: "var(--surface-bg)", color: ev.status === "active" ? "#d9534f" : "#198754", border: "1px solid #dbe5f1", borderRadius: 14, fontWeight: 700 }}
                            >
                              {ev.status === "active" ? "Disable / Hide" : ev.status === "draft" ? "Restore as Active" : "Enable"}
                            </Button>
                          </>
                        ) : (
                          <Button
                            disabled={!canRegister}
                            onClick={() => registerForEvent(ev._id)}
                            style={{
                              background: isRegistered ? "#dbe5f1" : sparkOrange,
                              border: "none",
                              color: isRegistered ? "#4e6687" : "#fff",
                              borderRadius: 14,
                              fontWeight: 800,
                              padding: "12px 18px",
                            }}
                          >
                            {isRegistered ? "Registered" : ev.status === "draft" || isFinished ? "Finished" : ev.status !== "active" ? "Hidden" : isFull ? "Event Full" : "Register Now"}
                          </Button>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Container>

      <Modal isOpen={attendanceOpen} toggle={() => setAttendanceOpen(!attendanceOpen)} size="lg" centered>
        <ModalHeader toggle={() => setAttendanceOpen(!attendanceOpen)}>QR Attendance & Certificate Control</ModalHeader>
        <ModalBody>
          {attendanceLoading ? (
            <div className="text-center py-4"><Spinner /></div>
          ) : attendanceEvent ? (
            <>
              <Alert color="info" className="mb-3">
                The attendance QR appears only <b>after the event finishes</b>. When registered users scan it, their certificate is released.
              </Alert>
              <Row className="g-3 mb-4 justify-content-center">
                <Col md="7" lg="6">
                  <Card className="border-0 shadow-sm h-100" style={{ borderRadius: 18 }}>
                    <CardBody className="text-center">
                      <h5 className="fw-bold">Attendance QR - Release Certificate</h5>
                      {attendanceEvent.qrAvailable && (attendanceEvent.attendanceUrl || attendanceEvent.checkInUrl) ? (
                        <>
                          <img alt="Attendance QR" src={qrImageUrl(attendanceEvent.attendanceUrl || attendanceEvent.checkInUrl)} style={{ width: 240, height: 240 }} />
                          <div className="small text-muted mt-2">Event finished. Registered users can scan this QR to mark attendance and receive their certificate.</div>
                        </>
                      ) : (
                        <Alert color="warning" className="mb-0">
                          QR code is hidden now. It will appear automatically after the event finishes.
                        </Alert>
                      )}
                    </CardBody>
                  </Card>
                </Col>
              </Row>
              <h5 className="fw-bold mb-3">Registered Users Attendance</h5>
              {(attendanceEvent.registrations || []).length === 0 ? (
                <Alert color="warning">No registered users yet.</Alert>
              ) : (
                (attendanceEvent.registrations || []).map((r) => (
                  <div key={r.userId?._id || r.userId} className="d-flex justify-content-between align-items-center p-3 mb-2" style={{ border: "1px solid #e6eefb", borderRadius: 14 }}>
                    <div>
                      <div className="fw-bold">{r.userId?.name || "User"}</div>
                      <div className="small text-muted">{r.userId?.email}</div>
                    </div>
                    <Badge color={r.attendanceStatus === "completed" ? "success" : r.attendanceStatus === "checked_in" ? "warning" : "secondary"}>
                      {r.attendanceStatus || "registered"}
                    </Badge>
                  </div>
                ))
              )}
            </>
          ) : null}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setAttendanceOpen(false)}>Close</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} size="lg" centered>
        <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
          {editing ? "Edit SparkUp Event" : "Create SparkUp Event"}
        </ModalHeader>
        <ModalBody>
          <Row className="g-3">
            <Col md="6">
              <Label className="fw-bold mb-2">Event Title</Label>
              <Input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Innovation Summit 2026" />
            </Col>
            <Col md="6">
              <Label className="fw-bold mb-2">Location</Label>
              <Input value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} placeholder="Muscat, Oman" />
            </Col>
            <Col md="6">
              <Label className="fw-bold mb-2">Organization Name</Label>
              <Input value={form.organizationName} onChange={(e) => setForm((prev) => ({ ...prev, organizationName: e.target.value }))} placeholder="SparkUp / UTAS / Company name" />
            </Col>

            <Col md="6">
              <Label className="fw-bold mb-2">Start Date & Time</Label>
              <Input type="datetime-local" min={new Date().toISOString().slice(0, 16)} value={form.startDate} onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))} />
            </Col>
            <Col md="6">
              <Label className="fw-bold mb-2">End Date & Time</Label>
              <Input type="datetime-local" min={form.startDate || new Date().toISOString().slice(0, 16)} value={form.endDate} onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))} />
            </Col>

            <Col md="6">
              <Label className="fw-bold mb-2">Event Status</Label>
              <Input type="select" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
                <option value="active">Active / visible</option>
                <option value="disabled">Disabled / hidden</option>
                <option value="archived">Archived</option>
                <option value="draft">Draft / finished automatically</option>
              </Input>
            </Col>
            <Col md="6">
              <Label className="fw-bold mb-2">Capacity</Label>
              <Input type="number" min="0" value={form.capacity} onChange={(e) => setForm((prev) => ({ ...prev, capacity: e.target.value }))} placeholder="0 = unlimited" />
            </Col>
            <Col md="6">
              <Label className="fw-bold mb-2">Event Image From Device</Label>
              <Input type="file" accept="image/*" onChange={onPickImage} />
            </Col>

            <Col xs="12">
              <Label className="fw-bold mb-2">Description</Label>
              <Input type="textarea" rows="5" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Describe the event, speakers, activities, and registration value..." />
            </Col>

            {imagePreview ? (
              <Col xs="12">
                <div
                  style={{
                    borderRadius: 20,
                    overflow: "hidden",
                    border: "1px solid #e3edf8",
                    background: "#f6faff",
                  }}
                >
                  <img src={imagePreview} alt="Event preview" style={{ width: "100%", maxHeight: 280, objectFit: "cover" }} />
                </div>
              </Col>
            ) : null}
          </Row>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button disabled={saving} onClick={saveEvent} style={{ background: sparkBlue, border: "none" }}>
            {saving ? "Saving..." : editing ? "Update Event" : "Create Event"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
