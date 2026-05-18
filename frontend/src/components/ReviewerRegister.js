import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Form,
  FormGroup,
  Input,
  Button,
  Alert,
  Spinner,
} from "reactstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const API_URL = "http://localhost:5000";

export default function ReviewerRegister() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const token = useMemo(() => params.get("token") || "", [params]);

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [organization, setOrganization] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const run = async () => {
      setErr("");
      setMsg("");
      if (!token) {
        setErr("Missing invitation token.");
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/reviewers/invite/validate`, {
          params: { token },
        });
        setEmail(res.data?.email || "");
      } catch (e) {
        setErr(e.response?.data?.msg || "Invalid or expired invitation link.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      const res = await axios.post(`${API_URL}/reviewers/register`, {
        token,
        name,
        password,
        specialization,
        organization,
        experienceYears,
        linkedin,
        phone,
      });
      setMsg(res.data?.msg || "Registered. Waiting admin approval.");
      // optional: auto redirect to login after short time
      setTimeout(() => navigate("/login"), 1200);
    } catch (e2) {
      setErr(e2.response?.data?.msg || "Registration failed");
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--app-bg)" }} className="d-flex align-items-center">
      <Container>
        <Row className="justify-content-center">
          <Col md="7" lg="5">
            <Card className="shadow border-0">
              <CardBody className="p-4 p-md-5">
                <h3 className="fw-bold" style={{ color: "var(--text)" }}>
                  Reviewer Registration
                </h3>
                <p className="text-muted small mb-4">
                  Complete your registration using the invitation link.
                </p>

                {loading ? (
                  <div className="d-flex align-items-center gap-2 text-muted">
                    <Spinner size="sm" /> Validating invitation...
                  </div>
                ) : (
                  <>
                    {err && <Alert color="danger" className="py-2">{err}</Alert>}
                    {msg && <Alert color="success" className="py-2">{msg}</Alert>}

                    {!err && (
                      <Form onSubmit={handleSubmit}>
                        <FormGroup className="mb-3">
                          <label className="small text-muted">Invited Email</label>
                          <Input value={email} disabled />
                        </FormGroup>

                        <FormGroup className="mb-3">
                          <label className="small text-muted">Full Name</label>
                          <Input value={name} onChange={(e) => setName(e.target.value)} required />
                        </FormGroup>

                        <FormGroup className="mb-4">
                          <label className="small text-muted">Password</label>
                          <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </FormGroup>

                        <FormGroup className="mb-3">
                          <label className="small text-muted">Specialization</label>
                          <Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="e.g. AI, Cybersecurity" />
                        </FormGroup>

                        <FormGroup className="mb-3">
                          <label className="small text-muted">Organization</label>
                          <Input value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Company / University" />
                        </FormGroup>

                        <Row className="g-2">
                          <Col md="6">
                            <FormGroup className="mb-3">
                              <label className="small text-muted">Years of Experience</label>
                              <Input type="number" min="0" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup className="mb-3">
                              <label className="small text-muted">Phone</label>
                              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+968..." />
                            </FormGroup>
                          </Col>
                        </Row>

                        <FormGroup className="mb-4">
                          <label className="small text-muted">LinkedIn (optional)</label>
                          <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." />
                        </FormGroup>

                        <div className="d-grid">
                          <Button
                            type="submit"
                            style={{
                              background:
                                "linear-gradient(135deg, #1a73e8 0%, #4f9cf9 50%, #ff9f43 100%)",
                              border: "none",
                              borderRadius: "999px",
                            }}
                          >
                            Create Reviewer Account
                          </Button>
                        </div>

                        <div className="mt-3 small">
                          Already have an account? <Link to="/login">Login</Link>
                        </div>
                      </Form>
                    )}
                  </>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
