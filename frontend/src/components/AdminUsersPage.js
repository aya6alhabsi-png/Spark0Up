import React, { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, CardBody, Col, Container, Input, Modal, ModalBody, ModalFooter, ModalHeader, Row, Spinner } from "reactstrap";
import { FaEnvelope, FaPhone, FaPlus, FaSearch, FaShieldAlt, FaSyncAlt, FaUserCheck, FaUserTie, FaUsers } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import logo from "../image/logo2.png";
import "./adminUsers.css";

const API_URL = "http://localhost:5000";

const statusColor = (status = "active") => {
  if (status === "active") return "success";
  if (status === "pending") return "warning";
  if (status === "blocked" || status === "rejected") return "danger";
  return "secondary";
};

function PersonCard({ person, type, onStatus }) {
  const isAdmin = type === "admin";
  const specialization = isAdmin ? "Platform Management" : person.specialization || person.organization || "Not added yet";
  const experience = person.experienceYears ? `${person.experienceYears} years` : "-";

  return (
    <div className="aum-person-card">
      <div className="aum-person-main">
        <div className={`aum-initial ${isAdmin ? "admin" : type}`}>{(person.name || person.email || "U").charAt(0).toUpperCase()}</div>
        <div>
          <h5>{person.name || "Unnamed user"}</h5>
          <p><FaEnvelope /> {person.email || "No email"}</p>
          <p><FaPhone /> {person.phone || "No phone"}</p>
        </div>
      </div>

      <div className="aum-person-meta">
        <span className="aum-meta-label">Role</span>
        <strong>{isAdmin ? "Admin" : person.role}</strong>
      </div>
      <div className="aum-person-meta">
        <span className="aum-meta-label">Specialisation</span>
        <strong>{specialization}</strong>
      </div>
      <div className="aum-person-meta">
        <span className="aum-meta-label">Experience</span>
        <strong>{experience}</strong>
      </div>
      <div className="aum-person-actions">
        <Badge color={statusColor(person.status)} pill className="px-3 py-2 text-capitalize">{person.status || "active"}</Badge>
        {!isAdmin && (
          <div className="aum-action-buttons">
            <Button size="sm" className="aum-approve" onClick={() => onStatus(person, "active")}>Accept</Button>
            <Button size="sm" className="aum-block" onClick={() => onStatus(person, "blocked")}>Block</Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth || {});
  const [tab, setTab] = useState("reviewers");
  const [admins, setAdmins] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [funders, setFunders] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  const token = localStorage.getItem("token") || "";
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4200);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [adminRes, reviewerRes, funderRes] = await Promise.allSettled([
        axios.get(`${API_URL}/admin/admins`, { headers: authHeaders }),
        axios.get(`${API_URL}/admin/users?role=reviewer`, { headers: authHeaders }),
        axios.get(`${API_URL}/admin/users?role=funder`, { headers: authHeaders }),
      ]);

      const adminList = adminRes.status === "fulfilled" ? adminRes.value.data?.admins || [] : [];
      setAdmins(adminList.length ? adminList : user ? [{ ...user, role: "admin", status: "active" }] : []);
      setReviewers(reviewerRes.status === "fulfilled" ? reviewerRes.value.data?.users || [] : []);
      setFunders(funderRes.status === "fulfilled" ? funderRes.value.data?.users || funderRes.value.data?.funders || [] : []);
    } catch (err) {
      showMessage("danger", err.response?.data?.msg || "Could not load user management data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const list = useMemo(() => {
    const source = tab === "admins" ? admins : tab === "funders" ? funders : reviewers;
    const term = q.trim().toLowerCase();
    if (!term) return source;
    return source.filter((p) => `${p.name || ""} ${p.email || ""} ${p.specialization || ""} ${p.organization || ""} ${p.status || ""}`.toLowerCase().includes(term));
  }, [tab, admins, funders, reviewers, q]);

  const updateStatus = async (person, status) => {
    try {
      setBusy(true);
      const endpoint = person.role === "funder" ? `/admin/funders/${person._id}/status` : `/admin/reviewers/${person._id}/status`;
      await axios.patch(`${API_URL}${endpoint}`, { status }, { headers: authHeaders });
      showMessage("success", `${person.name || person.email} is now ${status}.`);
      loadUsers();
    } catch (err) {
      showMessage("danger", err.response?.data?.msg || "Status update failed.");
    } finally {
      setBusy(false);
    }
  };

  const sendReviewerInvite = async () => {
    if (!reviewerEmail.trim()) return showMessage("warning", "Please enter reviewer email.");
    try {
      setBusy(true);
      await axios.post(`${API_URL}/admin/reviewers/invite`, { email: reviewerEmail.trim() }, { headers: authHeaders });
      setReviewerEmail("");
      setInviteOpen(false);
      showMessage("success", "Reviewer invitation sent: Hello, this is the SparkUp team. We would like you to join our team as a reviewer.");
    } catch (err) {
      showMessage("danger", err.response?.data?.msg || "Failed to send invitation.");
    } finally {
      setBusy(false);
    }
  };

  const createAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) return showMessage("warning", "Name, email, and password are required.");
    try {
      setBusy(true);
      await axios.post(`${API_URL}/admin/create-admin`, newAdmin, { headers: authHeaders });
      setNewAdmin({ name: "", email: "", password: "" });
      setAdminOpen(false);
      showMessage("success", "New admin created successfully.");
      loadUsers();
    } catch (err) {
      showMessage("danger", err.response?.data?.msg || "Could not create admin.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="aum-page elegant">
      <Container fluid className="aum-shell elegant-shell">
        <div className="aum-header">
          <div className="aum-brand"><img src={logo} alt="SparkUp" /><span>Admin Workspace</span></div>
          <div className="aum-header-actions">
            <Button outline color="secondary" onClick={() => navigate(-1)}>Back</Button>
            <Button color="primary" onClick={() => setAdminOpen(true)}><FaPlus className="me-2" />Add Admin</Button>
            <Button color="warning" onClick={() => setInviteOpen(true)}><FaUserCheck className="me-2" />Invite Reviewer</Button>
          </div>
        </div>

        <section className="aum-hero-card">
          <div>
            <p className="aum-kicker">CAT A User Management</p>
            <h1>Manage admins, reviewers, and funders</h1>
            <p>Clear professional directory with reviewer specialisation, approval status, and fast account actions.</p>
          </div>
          <Button className="aum-refresh" onClick={loadUsers}><FaSyncAlt className="me-2" />Refresh</Button>
        </section>

        {message && <Alert color={message.type}>{message.text}</Alert>}

        <Row className="g-3 mb-4">
          <Col md="4"><Card className="aum-stat"><CardBody><FaShieldAlt /><div><span>Admins</span><strong>{admins.length}</strong></div></CardBody></Card></Col>
          <Col md="4"><Card className="aum-stat"><CardBody><FaUserTie /><div><span>Reviewers</span><strong>{reviewers.length}</strong></div></CardBody></Card></Col>
          <Col md="4"><Card className="aum-stat"><CardBody><FaUsers /><div><span>Funders</span><strong>{funders.length}</strong></div></CardBody></Card></Col>
        </Row>

        <Card className="aum-directory-card">
          <CardBody>
            <div className="aum-toolbar">
              <div className="aum-tabs">
                <button className={tab === "admins" ? "active" : ""} onClick={() => setTab("admins")}>Admins</button>
                <button className={tab === "reviewers" ? "active" : ""} onClick={() => setTab("reviewers")}>Reviewers</button>
                <button className={tab === "funders" ? "active" : ""} onClick={() => setTab("funders")}>Funders</button>
              </div>
              <div className="aum-search"><FaSearch /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, specialisation, status..." /></div>
            </div>

            <div className="aum-list-head">
              <span>User</span><span>Role</span><span>Specialisation</span><span>Experience</span><span>Status / Actions</span>
            </div>

            {loading ? <div className="aum-loading"><Spinner /> Loading users...</div> : list.length === 0 ? <div className="aum-empty">No records found.</div> : list.map((person) => <PersonCard key={person._id || person.email} person={person} type={tab === "admins" ? "admin" : person.role} onStatus={updateStatus} />)}
          </CardBody>
        </Card>
      </Container>

      <Modal isOpen={inviteOpen} toggle={() => setInviteOpen(false)} centered>
        <ModalHeader toggle={() => setInviteOpen(false)}>Invite Reviewer</ModalHeader>
        <ModalBody>
          <p className="text-muted">The reviewer receives a SparkUp invitation with Accept / Reject registration flow.</p>
          <Input type="email" value={reviewerEmail} onChange={(e) => setReviewerEmail(e.target.value)} placeholder="reviewer@example.com" />
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setInviteOpen(false)}>Close</Button>
          <Button color="warning" onClick={sendReviewerInvite} disabled={busy}>{busy ? "Sending..." : "Send Invite"}</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={adminOpen} toggle={() => setAdminOpen(false)} centered>
        <ModalHeader toggle={() => setAdminOpen(false)}>Add New Admin</ModalHeader>
        <ModalBody className="d-grid gap-3">
          <Input value={newAdmin.name} onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })} placeholder="Admin name" />
          <Input type="email" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} placeholder="Admin email" />
          <Input type="password" value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} placeholder="Temporary password" />
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setAdminOpen(false)}>Close</Button>
          <Button color="primary" onClick={createAdmin} disabled={busy}>{busy ? "Creating..." : "Create Admin"}</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
