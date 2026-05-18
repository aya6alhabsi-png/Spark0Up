import React, { useContext, useEffect, useState } from "react";
import { Container, Card, CardBody, Button, Badge, Spinner, Alert } from "reactstrap";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { api, authHeaders } from "./api";
import { AppContext } from "../context/AppContext";

export default function NotificationsPage() {
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
      const res = await api.get("/notifications", { headers: authHeaders() });
      setList(res.data?.notifications || []);
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to load notifications");
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

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`, {}, { headers: authHeaders() });
      fetchList();
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to update");
    }
  };

  const viewReviewerApplication = async (n) => {
    try {
      if (!n?._id) return;
      if (!n.read) await api.patch(`/notifications/${n._id}/read`, {}, { headers: authHeaders() });
    } catch (e) {
    } finally {
      const reviewerId = n?.meta?.reviewerId;
      navigate(reviewerId ? `/admin?reviewerId=${reviewerId}` : "/admin");
    }
  };

  return (
    <div className="spark-page-shell">
      <Container className="py-4 tour-notifications">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h3 className="m-0">{t("notifications")}</h3>
          <Button color="secondary" onClick={() => navigate(-1)}>{t("back")}</Button>
        </div>

        {err && <Alert color="danger">{err}</Alert>}
        {loading ? (
          <div className="text-center py-5"><Spinner /></div>
        ) : list.length === 0 ? (
          <Alert color="info">No notifications yet.</Alert>
        ) : (
          list.map((n) => (
            <Card key={n._id} className="shadow-sm border-0 mb-2 spark-surface-card">
              <CardBody className="d-flex align-items-start justify-content-between">
                <div style={{ maxWidth: 850 }}>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <Badge color={n.read ? "secondary" : "primary"}>{n.type || "GENERAL"}</Badge>
                    {!n.read && <Badge color="warning">NEW</Badge>}
                  </div>
                  <div className="fw-semibold">{n.message}</div>
                  <div className="text-muted small">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
                {n.type === "REVIEWER_APPLICATION" ? (
                  <div className="d-flex gap-2">
                    <Button size="sm" color="primary" onClick={() => viewReviewerApplication(n)}>View</Button>
                    {!n.read && <Button size="sm" color="success" onClick={() => markRead(n._id)}>Mark as read</Button>}
                  </div>
                ) : (!n.read && <Button size="sm" color="success" onClick={() => markRead(n._id)}>Mark as read</Button>)}
              </CardBody>
            </Card>
          ))
        )}
      </Container>
    </div>
  );
}
