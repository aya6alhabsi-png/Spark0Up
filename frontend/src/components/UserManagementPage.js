import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Input, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import AddAdminModal from "./AddAdminModal";
import { api, authHeaders } from "./api";
import "./adminUsers.css";

const statusClass = (status = "active") => `aum-pill ${String(status).toLowerCase()}`;

function initials(name = "?") {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function PersonCard({ person, onApprove, onReject }) {
  const isReviewer = person.role === "reviewer";
  return (
    <div className="aum-person-card">
      <div className="aum-person-main">
        <div className={`aum-initial ${person.role}`}>{initials(person.name || person.email)}</div>
        <div>
          <h5>{person.name || "Pending reviewer"}</h5>
          <p>{person.email}</p>
        </div>
      </div>
      <div className="aum-person-meta">
        <span>Role</span>
        <strong>{person.role}</strong>
      </div>
      <div className="aum-person-meta">
        <span>Specialisation</span>
        <strong>{isReviewer ? person.specialization || "Not added yet" : "Management"}</strong>
      </div>
      <div className="aum-person-meta">
        <span>Experience</span>
        <strong>{isReviewer ? `${person.experienceYears || 0} years` : "Admin"}</strong>
      </div>
      <div className="aum-person-actions">
        <span className={statusClass(person.status)}>{person.status || "active"}</span>
        {isReviewer && person.status === "pending" && (
          <div className="aum-action-buttons">
            <Button className="aum-approve" size="sm" onClick={() => onApprove(person._id)}>Approve</Button>
            <Button className="aum-block" size="sm" onClick={() => onReject(person._id)}>Reject</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function InviteCard({ invite }) {
  const isExpired = invite.expiresAt && new Date(invite.expiresAt) < new Date() && invite.status === "pending";
  const status = isExpired ? "expired" : invite.status;
  return (
    <div className="aum-invite-card">
      <div>
        <strong>{invite.email}</strong>
        <p>Sent {invite.createdAt ? new Date(invite.createdAt).toLocaleString() : "recently"}</p>
      </div>
      <span className={statusClass(status)}>{status}</span>
    </div>
  );
}

export default function UserManagementPage() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("reviewers");
  const [search, setSearch] = useState("");

  const [admins, setAdmins] = useState([]);
  const [users, setUsers] = useState([]);
  const [invites, setInvites] = useState([]);

  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setErr("");
    try {
      const [adminRes, userRes, inviteRes] = await Promise.all([
        api.get("/admin/admins", { headers: authHeaders() }),
        api.get("/admin/users", { headers: authHeaders() }),
        api.get("/admin/reviewer-invites", { headers: authHeaders() }).catch(() => ({ data: { invites: [] } })),
      ]);
      setAdmins(adminRes.data?.admins || []);
      setUsers(userRes.data?.users || []);
      setInvites(inviteRes.data?.invites || []);
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to load user management data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return navigate("/login", { replace: true });
    if (user.role !== "admin") return navigate(-1);
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const people = useMemo(() => {
    const base = activeTab === "admins" ? admins : users.filter((u) => u.role === activeTab.slice(0, -1));
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter((p) => [p.name, p.email, p.role, p.status, p.specialization, p.organization].join(" ").toLowerCase().includes(q));
  }, [admins, users, activeTab, search]);

  const counts = {
    admins: admins.length,
    reviewers: users.filter((u) => u.role === "reviewer").length,
    funders: users.filter((u) => u.role === "funder").length,
    pending: users.filter((u) => u.status === "pending").length + invites.filter((i) => i.status === "pending").length,
  };

  const sendInvite = async () => {
    setErr("");
    setSuccess("");
    if (!reviewerEmail.trim()) return setErr("Enter reviewer email");
    setInviteLoading(true);
    try {
      const res = await api.post("/admin/reviewers/invite", { email: reviewerEmail.trim() }, { headers: authHeaders() });
      setSuccess(res.data?.msg || "Invitation sent with Accept/Reject options");
      setReviewerEmail("");
      setInviteModalOpen(false);
      loadAll();
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to send invitation");
    } finally {
      setInviteLoading(false);
    }
  };

  const updateReviewerStatus = async (id, status) => {
    setErr("");
    try {
      await api.patch(`/admin/reviewers/${id}/status`, { status }, { headers: authHeaders() });
      setSuccess(`Reviewer ${status}`);
      loadAll();
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to update reviewer");
    }
  };

  return (
    <main className="aum-page elegant">
      <div className="elegant-shell">
        <header className="aum-header">
          <div>
            <p className="aum-kicker">SparkUp Admin Center</p>
            <h1>User Management</h1>
            <p className="aum-subtitle">Manage admins, reviewer invitations, reviewer specialisations, and funder approvals in one clear workspace.</p>
          </div>
          <div className="aum-header-actions">
            <Button color="light" onClick={() => navigate("/notifications")}>Notifications</Button>
            <Button color="dark" onClick={() => navigate(-1)}>Back</Button>
          </div>
        </header>

        {err && <Alert color="danger">{err}</Alert>}
        {success && <Alert color="success">{success}</Alert>}

        <section className="aum-quick-actions">
          <button onClick={() => setAddAdminOpen(true)}><span>+</span><div><strong>Add Admin</strong><small>Create a manager account</small></div></button>
          <button onClick={() => setInviteModalOpen(true)}><span>✉</span><div><strong>Invite Reviewer</strong><small>Email has Accept / Reject buttons</small></div></button>
          <button onClick={loadAll}><span>↻</span><div><strong>Refresh</strong><small>Update all lists</small></div></button>
        </section>

        <section className="aum-stats-row">
          <div><span>Admins</span><strong>{counts.admins}</strong></div>
          <div><span>Reviewers</span><strong>{counts.reviewers}</strong></div>
          <div><span>Funders</span><strong>{counts.funders}</strong></div>
          <div><span>Pending</span><strong>{counts.pending}</strong></div>
        </section>

        <section className="aum-directory-card">
          <div className="aum-toolbar">
            <div className="aum-tabs">
              <button className={activeTab === "admins" ? "active" : ""} onClick={() => setActiveTab("admins")}>Admins</button>
              <button className={activeTab === "reviewers" ? "active" : ""} onClick={() => setActiveTab("reviewers")}>Reviewers</button>
              <button className={activeTab === "funders" ? "active" : ""} onClick={() => setActiveTab("funders")}>Funders</button>
            </div>
            <div className="aum-search"><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, specialisation..." /></div>
          </div>

          {loading ? <div className="aum-loading"><Spinner /> Loading users...</div> : (
            <>
              <div className="aum-list-head"><span>Name / Email</span><span>Role</span><span>Specialisation</span><span>Experience</span><span>Status / Action</span></div>
              {people.length === 0 ? <div className="aum-empty">No {activeTab} found.</div> : people.map((p) => (
                <PersonCard key={p._id} person={p} onApprove={(id) => updateReviewerStatus(id, "active")} onReject={(id) => updateReviewerStatus(id, "rejected")} />
              ))}
            </>
          )}
        </section>

        <section className="aum-invites-panel">
          <div className="aum-section-title"><h2>Reviewer Invitations</h2><p>Reviewers see a professional Accept / Reject invitation page before registration.</p></div>
          {invites.length === 0 ? <div className="aum-empty">No reviewer invitations yet.</div> : invites.slice(0, 8).map((invite) => <InviteCard key={invite._id} invite={invite} />)}
        </section>
      </div>

      <AddAdminModal isOpen={addAdminOpen} toggle={() => setAddAdminOpen((o) => !o)} />

      <Modal isOpen={inviteModalOpen} toggle={() => setInviteModalOpen(false)} centered>
        <ModalHeader toggle={() => setInviteModalOpen(false)}>Invite Reviewer</ModalHeader>
        <ModalBody>
          <p className="text-muted">The reviewer will receive a beautiful SparkUp email with two clear buttons: Accept Invitation and Reject.</p>
          <Input value={reviewerEmail} onChange={(e) => setReviewerEmail(e.target.value)} placeholder="reviewer@email.com" />
          <div className="aum-email-preview">
            <strong>Email preview</strong>
            <p>Hello, this is the SparkUp team. We would like you to join our team as a reviewer.</p>
            <div><span className="accept">Accept Invitation</span><span className="reject">Reject</span></div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setInviteModalOpen(false)}>Cancel</Button>
          <Button color="warning" disabled={inviteLoading} onClick={sendInvite}>{inviteLoading ? "Sending..." : "Send Invite"}</Button>
        </ModalFooter>
      </Modal>
    </main>




  );
}
