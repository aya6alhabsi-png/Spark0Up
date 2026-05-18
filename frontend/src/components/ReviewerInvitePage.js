import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Button, Spinner } from "reactstrap";
import { api } from "./api";
import "./reviewerInvite.css";

export default function ReviewerInvitePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const action = params.get("action") || "";

  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const maskedEmail = useMemo(() => {
    if (!email || !email.includes("@")) return email;
    const [name, domain] = email.split("@");
    return `${name.slice(0, 2)}${"•".repeat(Math.max(2, name.length - 2))}@${domain}`;
  }, [email]);

  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setError("Invitation token is missing.");
        setLoading(false);
        return;
      }
      try {
        const res = await api.get("/reviewers/invite/validate", { params: { token } });
        setEmail(res.data?.email || "");
        if (action === "reject") {
          await rejectInvite(true);
        }
      } catch (e) {
        setError(e.response?.data?.msg || "This invitation is invalid or expired.");
      } finally {
        setLoading(false);
      }
    };
    validate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, action]);

  const acceptInvite = () => {
    navigate(`/reviewer-register?token=${encodeURIComponent(token)}`);
  };

  const rejectInvite = async (silent = false) => {
    setRejecting(true);
    setError("");
    try {
      const res = await api.patch("/reviewers/invite/reject", { token });
      setMessage(res.data?.msg || "Invitation rejected.");
      if (!silent) setEmail("");
    } catch (e) {
      setError(e.response?.data?.msg || "Could not reject invitation.");
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <main className="ri-page">
        <section className="ri-card ri-center">
          <Spinner />
          <p>Checking your SparkUp invitation...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="ri-page">
      <section className="ri-card">
        <div className="ri-badge">SparkUp Reviewer Invitation</div>
        <h1>Join SparkUp as a Reviewer</h1>
        <p className="ri-subtitle">
          Hello, this is the SparkUp team. We would like you to join our team as a reviewer and help evaluate innovator ideas professionally.
        </p>

        {error && <Alert color="danger">{error}</Alert>}
        {message && <Alert color="success">{message}</Alert>}

        {!message && !error && (
          <>
            <div className="ri-info-grid">
              <div>
                <span>Invited email</span>
                <strong>{maskedEmail}</strong>
              </div>
              <div>
                <span>Next step</span>
                <strong>Complete reviewer profile</strong>
              </div>
              <div>
                <span>Reviewer details</span>
                <strong>Specialisation, experience, contact</strong>
              </div>
            </div>

            <div className="ri-actions">
              <Button className="ri-accept" onClick={acceptInvite}>Accept & Continue</Button>
              <Button className="ri-reject" disabled={rejecting} onClick={() => rejectInvite(false)}>
                {rejecting ? "Rejecting..." : "Reject Invitation"}
              </Button>
            </div>
            <p className="ri-note">Accepting will open the reviewer registration form. The admin will still approve your account before you can review ideas.</p>
          </>
        )}

        {(message || error) && (
          <Button className="ri-home" onClick={() => navigate("/")}>Back to Home</Button>
        )}
      </section>
    </main>
  );
}
