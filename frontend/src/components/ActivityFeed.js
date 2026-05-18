import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Container, Card, CardBody, Badge, Button, Spinner, Alert } from "reactstrap";
import { FaBolt, FaCalendarCheck, FaCommentDots, FaLightbulb, FaSyncAlt, FaUsers, FaArrowLeft, FaWifi } from "react-icons/fa";
import { io } from "socket.io-client";
import { api, API_URL, authHeaders } from "./api";

const typeIcon = (type) => {
  if ((type || "").includes("EVENT")) return <FaCalendarCheck />;
  if ((type || "").includes("FEEDBACK") || (type || "").includes("FORUM")) return <FaCommentDots />;
  if ((type || "").includes("REVIEWER") || (type || "").includes("ASSIGNED")) return <FaUsers />;
  return <FaLightbulb />;
};

const typeTone = (type) => {
  if ((type || "").includes("EVENT")) return { badge: "info", bg: "rgba(47,128,237,.12)", color: "#184f89" };
  if ((type || "").includes("FEEDBACK") || (type || "").includes("FORUM")) return { badge: "warning", bg: "rgba(255,122,0,.13)", color: "#9a4a00" };
  if ((type || "").includes("FUNDING")) return { badge: "success", bg: "rgba(15,118,110,.12)", color: "#0f766e" };
  if ((type || "").includes("REVIEWER")) return { badge: "primary", bg: "rgba(24,79,137,.12)", color: "#184f89" };
  return { badge: "secondary", bg: "rgba(18,47,76,.10)", color: "#122f4c" };
};

export default function ActivityFeed() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [connected, setConnected] = useState(false);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    return {
      total: activities.length,
      today: activities.filter((a) => new Date(a.createdAt).toDateString() === today).length,
      events: activities.filter((a) => (a.type || "").includes("EVENT")).length,
      community: activities.filter((a) => (a.type || "").includes("FORUM")).length,
    };
  }, [activities]);

  const fetchActivities = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await api.get("/activity", { headers: authHeaders() });
      setActivities(res.data?.activities || []);
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to load activity feed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return undefined;
    }
    fetchActivities();
    const socket = io(API_URL, { transports: ["websocket", "polling"], autoConnect: true });
    socketRef.current = socket;
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("activity:new", (incoming) => {
      if (!incoming?._id) return;
      const isForMyRole = incoming.audienceRoles?.includes(user.role);
      const isForMe = incoming.audienceUsers?.map(String).includes(String(user._id));
      const isMine = String(incoming.actorId || "") === String(user._id);
      if (user.role !== "admin" && !isForMe && !isMine) return;
      if (user.role === "admin" && !isForMyRole) return;
      setActivities((prev) => [incoming, ...prev.filter((a) => a._id !== incoming._id)].slice(0, 80));
    });
    return () => socket.disconnect();
  }, [navigate, user]);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#f5f8fc 0%,#eef4fb 100%)" }}>
      <Container className="py-4 py-lg-5">
        <div
          className="mb-4 p-4 p-lg-5 text-white"
          style={{ borderRadius: 30, background: "linear-gradient(135deg,#123b73 0%,#184f89 52%,#ff7a00 100%)", boxShadow: "0 24px 55px rgba(18,59,115,.22)" }}
        >
          <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <FaBolt />
                <Badge color={connected ? "success" : "secondary"} pill>
                  <FaWifi className="me-1" /> {connected ? "Live" : "Offline"}
                </Badge>
              </div>
              <h2 className="m-0 fw-bold">Real-time Activity Feed</h2>
              <p className="mb-0 mt-2" style={{ maxWidth: 760, color: "rgba(255,255,255,.86)" }}>
                Professional live timeline for ideas, reviews, funding actions, events, feedback, and community discussions.
              </p>
            </div>
            <div className="d-flex gap-2">
              <Button color="light" onClick={fetchActivities} style={{ borderRadius: 14, fontWeight: 800 }}>
                <FaSyncAlt className="me-2" /> Refresh
              </Button>
              <Button outline color="light" onClick={() => navigate(-1)} style={{ borderRadius: 14, fontWeight: 800 }}>
                <FaArrowLeft className="me-2" /> Back
              </Button>
            </div>
          </div>
        </div>

        <div className="row g-3 mb-4">
          {[
            ["Total updates", stats.total],
            ["Today", stats.today],
            ["Event updates", stats.events],
            ["Community", stats.community],
          ].map(([label, value]) => (
            <div className="col-6 col-lg-3" key={label}>
              <Card className="border-0 h-100" style={{ borderRadius: 24, boxShadow: "0 16px 34px rgba(17,52,90,.08)" }}>
                <CardBody>
                  <div className="text-muted small fw-bold text-uppercase">{label}</div>
                  <div style={{ fontSize: 38, fontWeight: 900, color: "#123b73" }}>{value}</div>
                </CardBody>
              </Card>
            </div>
          ))}
        </div>

        {err && <Alert color="danger">{err}</Alert>}
        {loading ? (
          <div className="text-center py-5"><Spinner /></div>
        ) : activities.length === 0 ? (
          <Alert color="info" style={{ borderRadius: 18 }}>No activity yet. New platform actions will appear here automatically.</Alert>
        ) : (
          <div className="d-flex flex-column gap-3">
            {activities.map((a) => {
              const tone = typeTone(a.type);
              return (
                <Card key={a._id} className="border-0" style={{ borderRadius: 24, boxShadow: "0 14px 32px rgba(17,52,90,.08)" }}>
                  <CardBody className="d-flex gap-3 align-items-start p-4">
                    <div className="d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 50, height: 50, borderRadius: 18, background: tone.bg, color: tone.color, fontSize: 20 }}>
                      {typeIcon(a.type)}
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                        <Badge color={tone.badge} pill>{a.type}</Badge>
                        <span className="fw-bold" style={{ color: "#122f4c" }}>{a.title}</span>
                      </div>
                      <div style={{ color: "#334155", lineHeight: 1.7 }}>{a.message}</div>
                      <div className="text-muted small mt-2">By {a.actorName || a.actorRole || "System"} • {new Date(a.createdAt).toLocaleString()}</div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
