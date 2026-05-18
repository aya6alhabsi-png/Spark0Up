import React, { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, CardBody, Col, Container, FormGroup, Input, Label, Row, Spinner } from "reactstrap";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaBriefcase, FaCamera, FaEnvelope, FaIdBadge, FaLinkedin, FaPhone, FaSave, FaShieldAlt, FaStar, FaUserCircle } from "react-icons/fa";
import { api, API_URL, authHeaders } from "./api";
import { updateUser } from "../store/authSlice";
import "./profilePage.css";

const safeImage = (url) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
  return `${API_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

const roleLabel = (role) => {
  if (role === "reviewer") return "Reviewer";
  if (role === "funder") return "Funder";
  if (role === "admin") return "Admin";
  return "Innovator";
};

export default function ProfilePage() {
  const { user: storeUser } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [form, setForm] = useState({});
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const role = form?.role || storeUser?.role || "innovator";
  const isReviewer = role === "reviewer";
  const isFunder = role === "funder";

  const stats = useMemo(() => {
    if (isReviewer) return ["Expert review profile", "Specialisation visible to admin", "Assignment-ready account"];
    if (isFunder) return ["Funding partner profile", "Organisation details", "Decision workflow access"];
    return ["Innovator profile", "Idea submission access", "Progress tracking ready"];
  }, [isReviewer, isFunder]);

  useEffect(() => {
    if (!storeUser) {
      navigate("/login", { replace: true });
      return;
    }
    const load = async () => {
      try {
        const res = await api.get("/users/me", { headers: authHeaders() });
        const u = res.data?.user || storeUser;
        setForm({
          name: u.name || "",
          email: u.email || "",
          role: u.role || "innovator",
          phone: u.phone || "",
          bio: u.bio || "",
          specialization: u.specialization || "",
          organization: u.organization || "",
          experienceYears: u.experienceYears || 0,
          linkedin: u.linkedin || "",
          imageUrl: u.imageUrl || "",
        });
        setPreview(safeImage(u.imageUrl));
        dispatch(updateUser(u));
      } catch {
        setForm(storeUser || {});
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dispatch, navigate, storeUser]);

  const setField = (name, value) => setForm((old) => ({ ...old, [name]: value }));

  const onImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const data = new FormData();
      ["name", "phone", "bio", "specialization", "organization", "experienceYears", "linkedin"].forEach((key) => {
        data.append(key, form[key] ?? "");
      });
      if (image) data.append("image", image);
      const res = await api.patch("/users/me", data, { headers: { ...authHeaders(), "Content-Type": "multipart/form-data" } });
      const updated = res.data.user;
      dispatch(updateUser(updated));
      setForm((old) => ({ ...old, ...updated }));
      setPreview(safeImage(updated.imageUrl));
      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch (e) {
      setMessage({ type: "danger", text: e.response?.data?.msg || "Could not update profile." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="profile-page tour-profile"><Spinner color="primary" /></div>;
  }

  return (
    <div className="profile-page">
      <Container fluid className="profile-container tour-profile">
        <div className="profile-topbar">
          <Button color="light" className="profile-back" onClick={() => navigate(-1)}><FaArrowLeft /> Back</Button>
          <div>
            <div className="profile-kicker">SparkUp Professional Profile</div>
            <h1>My Profile</h1>
            <p>Keep your details clear so admins can assign, contact, and evaluate users correctly.</p>
          </div>
        </div>

        {message && <Alert color={message.type}>{message.text}</Alert>}

        <Row className="g-4">
          <Col lg="4">
            <Card className="profile-card profile-identity">
              <CardBody>
                <div className="profile-avatar-wrap">
                  {preview ? <img src={preview} alt="Profile" /> : <FaUserCircle size={104} />}
                  <label className="profile-camera">
                    <FaCamera />
                    <input type="file" accept="image/*" onChange={onImageChange} hidden />
                  </label>
                </div>
                <h2>{form.name || "User"}</h2>
                <Badge pill className="profile-role-badge">{roleLabel(role)}</Badge>
                {isReviewer && <div className="profile-special-badge"><FaStar /> {form.specialization || "Add specialisation"}</div>}
                <p className="profile-bio-preview">{form.bio || "Write a short professional bio so your profile does not look empty."}</p>

                <div className="profile-mini-list">
                  <span><FaEnvelope /> {form.email || "No email"}</span>
                  <span><FaPhone /> {form.phone || "No phone"}</span>
                  <span><FaBriefcase /> {form.organization || (isReviewer ? "Reviewer organisation" : "Organisation")}</span>
                </div>
              </CardBody>
            </Card>
          </Col>

          <Col lg="8">
            <Card className="profile-card">
              <CardBody className="p-4 p-lg-5">
                <div className="section-title"><FaIdBadge /> Basic Information</div>
                <Row className="g-3">
                  <Col md="6"><FormGroup><Label>Full name</Label><Input value={form.name || ""} onChange={(e) => setField("name", e.target.value)} /></FormGroup></Col>
                  <Col md="6"><FormGroup><Label>Email</Label><Input value={form.email || ""} disabled /></FormGroup></Col>
                  <Col md="6"><FormGroup><Label>Phone</Label><Input value={form.phone || ""} onChange={(e) => setField("phone", e.target.value)} placeholder="Example: 91234567" /></FormGroup></Col>
                  <Col md="6"><FormGroup><Label>Role</Label><Input value={roleLabel(role)} disabled /></FormGroup></Col>
                  <Col xs="12"><FormGroup><Label>Short bio</Label><Input type="textarea" rows="3" value={form.bio || ""} onChange={(e) => setField("bio", e.target.value)} placeholder="Write a short profile summary..." /></FormGroup></Col>
                </Row>

                {(isReviewer || isFunder) && <>
                  <div className="section-title mt-4"><FaShieldAlt /> {isReviewer ? "Reviewer Expertise" : "Funder Organisation"}</div>
                  <Row className="g-3">
                    <Col md="6"><FormGroup><Label>{isReviewer ? "Specialisation" : "Funding field"}</Label><Input value={form.specialization || ""} onChange={(e) => setField("specialization", e.target.value)} placeholder="AI, Cybersecurity, UI/UX, Business..." /></FormGroup></Col>
                    <Col md="6"><FormGroup><Label>Organisation</Label><Input value={form.organization || ""} onChange={(e) => setField("organization", e.target.value)} placeholder="Company / University / Institution" /></FormGroup></Col>
                    <Col md="6"><FormGroup><Label>Experience years</Label><Input type="number" min="0" value={form.experienceYears || 0} onChange={(e) => setField("experienceYears", e.target.value)} /></FormGroup></Col>
                    <Col md="6"><FormGroup><Label><FaLinkedin className="me-2" /> LinkedIn / portfolio</Label><Input value={form.linkedin || ""} onChange={(e) => setField("linkedin", e.target.value)} placeholder="https://..." /></FormGroup></Col>
                  </Row>
                </>}

                <div className="profile-checklist mt-4">
                  {stats.map((s) => <div key={s}><FaStar /> {s}</div>)}
                </div>

                <div className="d-flex justify-content-end mt-4">
                  <Button color="primary" className="profile-save" disabled={saving} onClick={saveProfile}>{saving ? "Saving..." : <><FaSave /> Save Profile</>}</Button>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
