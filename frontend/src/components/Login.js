import React, { useState } from "react";
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
} from "reactstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../store/authSlice";
import { useNavigate, Link } from "react-router-dom";
import { FaArrowRight, FaEnvelope, FaLock } from "react-icons/fa";
import logo from "../image/logo2.png";
import auth from "../image/auth.png";
import "./authElegant.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { status, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    dispatch(login({ email, password }))
      .unwrap()
      .then((user) => {
        if (user.role === "admin") navigate("/admin");
        else if (user.role === "innovator") navigate("/innovator");
        else if (user.role === "funder") navigate("/funder");
        else if (user.role === "reviewer") navigate("/reviewer");
        else navigate("/dashboard");
      })
      .catch(() => {});
  };

  return (
    <div className="spark-auth-page">
      <div className="spark-auth-bg-shape spark-auth-shape-one" />
      <div className="spark-auth-bg-shape spark-auth-shape-two" />

      <Container className="py-5">
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col lg="10" xl="9">
            <Card className="spark-auth-card-clean border-0">
              <CardBody className="p-0">
                <Row className="g-0">
                  <Col lg="5" className="spark-auth-side">
                    <div className="spark-auth-left-logo">
                      <img src={logo} alt="logo" className="spark-auth-logo" />
                    </div>

                    <div className="spark-auth-side-copy">
                      <img
                        src={auth}
                        alt="auth"
                        className="spark-auth-side-image"
                      />
                    </div>

                    <div className="spark-auth-side-mini">
                      
                    </div>
                  </Col>

                  <Col lg="7" className="spark-auth-form-wrap">
                    <div className="spark-auth-form-box">
                      <h3>Login</h3>
                      <p className="spark-auth-muted">
                        Use your registered account details.
                      </p>

                      {error && (
                        <Alert color="danger" className="rounded-4">
                          {error}
                        </Alert>
                      )}

                      <Form onSubmit={handleSubmit}>
                        <FormGroup className="mb-3">
                          <label className="spark-auth-input-label">Email</label>
                          <div className="spark-auth-input-group">
                            <FaEnvelope />
                            <Input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="you@example.com"
                              required
                            />
                          </div>
                        </FormGroup>

                        <FormGroup className="mb-3">
                          <label className="spark-auth-input-label">Password</label>
                          <div className="spark-auth-input-group">
                            <FaLock />
                            <Input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Password"
                              required
                            />
                          </div>
                        </FormGroup>

                        <div className="spark-auth-links mb-4">
                          <span>
                            Don&apos;t have an account?{" "}
                            <Link to="/register">Register</Link>
                          </span>
                          <Link to="/forgetpass">Forget Password?</Link>
                        </div>

                        <Button
                          type="submit"
                          className="spark-auth-btn"
                          disabled={status === "loading"}
                        >
                          {status === "loading" ? "Logging in..." : "Login"}
                          <FaArrowRight className="ms-2" />
                        </Button>
                      </Form>
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Login;