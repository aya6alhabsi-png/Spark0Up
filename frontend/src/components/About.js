import React from "react";
import { Container, Row, Col, Button, Card, CardBody } from "reactstrap";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Tilt from "react-parallax-tilt";
import {
  FaArrowRight,
  FaShieldAlt,
  FaLightbulb,
  FaRobot,
  FaUsers,
  FaGlobeAsia,
  FaCalendarAlt,
  FaChartLine,
  FaHandshake,
  FaUserTie,
} from "react-icons/fa";

import ideaImg from "../image/a1.jpg";
import questionImg from "../image/a2.jpg";
import logo from "../image/logo2.png";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay, ease: "easeOut" },
  }),
};

const floatAnim = {
  y: [0, -14, 0],
  transition: {
    duration: 5,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

const features = [
  {
    icon: <FaShieldAlt />,
    title: "IP Protection",
    text: "Protects ideas through privacy controls and timestamped submission records.",
  },
  {
    icon: <FaHandshake />,
    title: "Trusted Connection",
    text: "Creates a safe bridge between innovators, administrators, and funders.",
  },
  {
    icon: <FaCalendarAlt />,
    title: "Innovation Events",
    text: "Shows workshops, hackathons, and programs that help users grow.",
  },
  {
    icon: <FaRobot />,
    title: "AI Guidance",
    text: "Supports users with chatbot-based help during their innovation journey.",
  },
];

const stats = [
  { value: "Secure", label: "idea sharing environment" },
  { value: "Admin-led", label: "review and presentation flow" },
  { value: "AI", label: "guidance and support" },
  { value: "Vision 2040", label: "aligned innovation purpose" },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(65,144,255,0.18), transparent 30%), radial-gradient(circle at bottom right, rgba(255,145,0,0.18), transparent 28%), linear-gradient(135deg, #edf5ff 0%, #f8fbff 50%, #fff6ed 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Floating background effects */}
      <motion.div
        animate={{ y: [0, 25, 0], x: [0, 12, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: 80,
          left: -70,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: "rgba(47,128,237,0.12)",
          filter: "blur(20px)",
        }}
      />
      <motion.div
        animate={{ y: [0, -20, 0], x: [0, -15, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          bottom: 60,
          right: -60,
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: "rgba(255,122,0,0.14)",
          filter: "blur(24px)",
        }}
      />

      <Container style={{ position: "relative", zIndex: 2, paddingTop: "70px", paddingBottom: "70px" }}>
        {/* HERO */}
        <Row className="align-items-center g-4 mb-5">
          <Col lg="6">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={0}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 18px",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.7)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.7)",
                  boxShadow: "0 8px 24px rgba(17, 38, 146, 0.08)",
                  marginBottom: "18px",
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(242,248,255,0.98))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 10px 22px rgba(30, 136, 229, 0.12)",
                    border: "1px solid rgba(30,136,229,0.10)",
                  }}
                >
                  <img
                    src={logo}
                    alt="SparkUp"
                    style={{ width: 24, height: 24, objectFit: "contain" }}
                  />
                </div>
                <span style={{ color: "#173b67", fontWeight: 700 }}>
                  About SparkUp
                </span>
              </div>

              <h1
                style={{
                  fontSize: "clamp(2.5rem, 5vw, 4.6rem)",
                  fontWeight: 900,
                  lineHeight: 1.05,
                  color: "#14365d",
                  marginBottom: "18px",
                  letterSpacing: "-1.5px",
                }}
              >
                Powering Omani ideas
                <br />
                into real impact.
              </h1>

              <p
                style={{
                  fontSize: "1.1rem",
                  lineHeight: 1.95,
                  color: "#5b7594",
                  maxWidth: "620px",
                  marginBottom: "26px",
                }}
              >
                SparkUp is a secure innovation platform designed to help
                innovators in Oman share ideas with confidence, protect their
                intellectual property, and connect with the right support
                through a trusted admin-mediated process. It also brings users
                closer to workshops, hackathons, innovation programs, and
                AI-powered guidance in one integrated experience.
              </p>

              <div className="d-flex flex-wrap gap-3">
                <Button
                  onClick={() => navigate("/")}
                  style={{
                    border: "none",
                    borderRadius: "16px",
                    padding: "14px 24px",
                    fontWeight: 800,
                    background: "linear-gradient(90deg, #2f80ed 0%, #ff7a00 100%)",
                    boxShadow: "0 16px 34px rgba(47,128,237,0.24)",
                  }}
                >
                  Back to Home <FaArrowRight className="ms-2" />
                </Button>

                <Button
                  outline
                  onClick={() => navigate("/register")}
                  style={{
                    borderRadius: "16px",
                    padding: "14px 24px",
                    fontWeight: 800,
                    border: "2px solid #d8e5f3",
                    color: "#173b67",
                    background: "rgba(255,255,255,0.5)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  Join SparkUp
                </Button>
              </div>
            </motion.div>
          </Col>

          <Col lg="6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            >
              <Row className="g-4">
                <Col md="6">
                  <motion.div animate={floatAnim}>
                    <Tilt
                      tiltMaxAngleX={10}
                      tiltMaxAngleY={10}
                      glareEnable={true}
                      glareMaxOpacity={0.18}
                      scale={1.02}
                      transitionSpeed={1800}
                      style={{
                        borderRadius: "28px",
                        overflow: "hidden",
                        boxShadow: "0 22px 55px rgba(19,54,93,0.12)",
                        background: "rgba(255,255,255,0.65)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255,255,255,0.65)",
                      }}
                    >
                      <img
                        src={ideaImg}
                        alt="Innovation"
                        style={{
                          width: "100%",
                          height: "420px",
                          objectFit: "cover",
                        }}
                      />
                    </Tilt>
                  </motion.div>
                </Col>

                <Col md="6" className="d-flex flex-column gap-4">
                  <motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 4.5, repeat: Infinity }}>
                    <Tilt
                      tiltMaxAngleX={12}
                      tiltMaxAngleY={12}
                      glareEnable={true}
                      glareMaxOpacity={0.16}
                      scale={1.02}
                      style={{
                        borderRadius: "28px",
                        overflow: "hidden",
                        boxShadow: "0 22px 55px rgba(19,54,93,0.12)",
                        background: "rgba(255,255,255,0.65)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255,255,255,0.65)",
                      }}
                    >
                      <img
                        src={questionImg}
                        alt="Guidance"
                        style={{
                          width: "100%",
                          height: "200px",
                          objectFit: "cover",
                        }}
                      />
                    </Tilt>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 5, repeat: Infinity }}
                    style={{
                      borderRadius: "28px",
                      padding: "26px",
                      background: "rgba(255,255,255,0.62)",
                      backdropFilter: "blur(16px)",
                      border: "1px solid rgba(255,255,255,0.72)",
                      boxShadow: "0 22px 55px rgba(19,54,93,0.11)",
                    }}
                  >
                    <div
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: "18px",
                        display: "grid",
                        placeItems: "center",
                        background: "linear-gradient(135deg, #2f80ed 0%, #ff7a00 100%)",
                        color: "#fff",
                        fontSize: "1.4rem",
                        marginBottom: "14px",
                      }}
                    >
                      <FaLightbulb />
                    </div>

                    <h4 style={{ color: "#173b67", fontWeight: 800, marginBottom: "8px" }}>
                      A safer path for ideas
                    </h4>
                    <p style={{ color: "#5f7897", margin: 0, lineHeight: 1.8 }}>
                      From submission and review to presentation and support,
                      SparkUp helps promising ideas move forward in a structured
                      and trusted way.
                    </p>
                  </motion.div>
                </Col>
              </Row>
            </motion.div>
          </Col>
        </Row>

        {/* STATS */}
        <Row className="g-4 mb-5">
          {stats.map((item, index) => (
            <Col md="6" lg="3" key={index}>
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={0.1 * index}
              >
                <Card
                  style={{
                    border: "1px solid rgba(255,255,255,0.7)",
                    borderRadius: "24px",
                    background: "rgba(255,255,255,0.58)",
                    backdropFilter: "blur(14px)",
                    boxShadow: "0 16px 40px rgba(19,54,93,0.08)",
                  }}
                >
                  <CardBody className="text-center p-4">
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 900,
                        color: "#173b67",
                        marginBottom: "6px",
                      }}
                    >
                      {item.value}
                    </div>
                    <div style={{ color: "#6983a1", lineHeight: 1.7 }}>
                      {item.label}
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>

        {/* INTRO + VISION */}
        <Row className="g-4 mb-5">
          <Col lg="7">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              <Card
                style={{
                  border: "1px solid rgba(255,255,255,0.72)",
                  borderRadius: "28px",
                  background: "rgba(255,255,255,0.62)",
                  backdropFilter: "blur(16px)",
                  boxShadow: "0 18px 45px rgba(19,54,93,0.09)",
                }}
              >
                <CardBody className="p-4 p-lg-5">
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 14px",
                      borderRadius: "999px",
                      background: "#fff7ef",
                      color: "#ff7a00",
                      fontWeight: 800,
                      marginBottom: "18px",
                    }}
                  >
                    <FaGlobeAsia />
                    Brief Introduction
                  </div>

                  <h2
                    style={{
                      color: "#173b67",
                      fontWeight: 900,
                      marginBottom: "16px",
                    }}
                  >
                    Who we are
                  </h2>

                  <p style={{ color: "#5e7898", lineHeight: 1.95, fontSize: "1.02rem" }}>
                    SparkUp is a full-stack web platform created to empower
                    innovators and entrepreneurs in Oman by providing a safe
                    digital space to showcase ideas, prove ownership, and reach
                    meaningful opportunities. The platform is designed to reduce
                    fear of idea theft, simplify access to innovation support,
                    and create a more reliable process for connecting promising
                    projects with investors and funders.
                  </p>

                  <p style={{ color: "#5e7898", lineHeight: 1.95, fontSize: "1.02rem", marginBottom: 0 }}>
                    Through structured admin review, event discovery,
                    AI-supported guidance, and a clear innovation journey,
                    SparkUp helps transform early concepts into real projects
                    that support creativity, entrepreneurship, and Oman Vision
                    2040.
                  </p>
                </CardBody>
              </Card>
            </motion.div>
          </Col>

          <Col lg="5">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={0.15}
            >
              <Card
                style={{
                  height: "100%",
                  border: "1px solid rgba(255,255,255,0.72)",
                  borderRadius: "28px",
                  background: "linear-gradient(145deg, rgba(47,128,237,0.92), rgba(255,122,0,0.92))",
                  boxShadow: "0 22px 55px rgba(47,128,237,0.22)",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: -30,
                    right: -30,
                    width: 140,
                    height: 140,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.14)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: -50,
                    left: -20,
                    width: 170,
                    height: 170,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.12)",
                  }}
                />
                <CardBody className="p-4 p-lg-5" style={{ position: "relative", zIndex: 2 }}>
                  <div
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: "20px",
                      display: "grid",
                      placeItems: "center",
                      background: "rgba(255,255,255,0.18)",
                      color: "#fff",
                      fontSize: "1.5rem",
                      marginBottom: "18px",
                    }}
                  >
                    <FaChartLine />
                  </div>

                  <h3 style={{ color: "#fff", fontWeight: 900, marginBottom: "14px" }}>
                    Our mission
                  </h3>
                  <p style={{ color: "rgba(255,255,255,0.92)", lineHeight: 1.9 }}>
                    To provide a trusted innovation environment where ideas are
                    protected, opportunities are visible, and meaningful
                    connections between innovators, administrators, and funders
                    can happen with clarity and confidence.
                  </p>

                  <h3 style={{ color: "#fff", fontWeight: 900, marginBottom: "14px", marginTop: "26px" }}>
                    Our vision
                  </h3>
                  <p style={{ color: "rgba(255,255,255,0.92)", lineHeight: 1.9, marginBottom: 0 }}>
                    To become a smart growth hub for innovation in Oman that
                    supports youth entrepreneurship, encourages collaboration,
                    and helps ideas grow into funded and impactful outcomes.
                  </p>
                </CardBody>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* FEATURES */}
        <div className="mb-4 text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "8px 16px",
                borderRadius: "999px",
                background: "#fff7ef",
                color: "#ff7a00",
                fontWeight: 800,
                marginBottom: "16px",
              }}
            >
              What makes SparkUp different
            </div>

            <h2
              style={{
                color: "#173b67",
                fontWeight: 900,
                marginBottom: "12px",
              }}
            >
              Designed for trust, growth, and action
            </h2>

            <p
              style={{
                color: "#6a819d",
                maxWidth: "760px",
                margin: "0 auto 26px",
                lineHeight: 1.9,
              }}
            >
              SparkUp is not only about posting ideas. It is about building a
              trusted system that protects innovators, guides decisions, and
              creates a structured path toward review, visibility, and support.
            </p>
          </motion.div>
        </div>

        <Row className="g-4 mb-5">
          {features.map((feature, index) => (
            <Col md="6" lg="3" key={index}>
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={0.08 * index}
              >
                <Tilt
                  tiltMaxAngleX={8}
                  tiltMaxAngleY={8}
                  scale={1.02}
                  transitionSpeed={1800}
                  style={{
                    height: "100%",
                    borderRadius: "24px",
                    background: "rgba(255,255,255,0.62)",
                    backdropFilter: "blur(14px)",
                    border: "1px solid rgba(255,255,255,0.72)",
                    boxShadow: "0 18px 45px rgba(19,54,93,0.08)",
                  }}
                >
                  <div className="p-4">
                    <div
                      style={{
                        width: 58,
                        height: 58,
                        borderRadius: "18px",
                        display: "grid",
                        placeItems: "center",
                        background: "linear-gradient(135deg, #2f80ed 0%, #ff7a00 100%)",
                        color: "#fff",
                        fontSize: "1.25rem",
                        marginBottom: "16px",
                      }}
                    >
                      {feature.icon}
                    </div>

                    <h5 style={{ color: "#173b67", fontWeight: 800, marginBottom: "10px" }}>
                      {feature.title}
                    </h5>
                    <p style={{ color: "#6a819d", lineHeight: 1.8, marginBottom: 0 }}>
                      {feature.text}
                    </p>
                  </div>
                </Tilt>
              </motion.div>
            </Col>
          ))}
        </Row>

        {/* TEAM */}
        <Row className="g-4 mb-5">
          <Col lg="12">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              <Card
                style={{
                  border: "1px solid rgba(255,255,255,0.72)",
                  borderRadius: "28px",
                  background: "rgba(255,255,255,0.62)",
                  backdropFilter: "blur(16px)",
                  boxShadow: "0 18px 45px rgba(19,54,93,0.09)",
                }}
              >
                <CardBody className="p-4 p-lg-5">
                  <div className="text-center mb-4">
                    <div
                      style={{
                        display: "inline-block",
                        padding: "8px 16px",
                        borderRadius: "999px",
                        background: "#edf5ff",
                        color: "#2f80ed",
                        fontWeight: 800,
                        marginBottom: "16px",
                      }}
                    >
                      Our Team
                    </div>
                    <h2 style={{ color: "#173b67", fontWeight: 900 }}>
                      Built by UTAS Muscat students
                    </h2>
                    <p
                      style={{
                        color: "#6a819d",
                        maxWidth: "760px",
                        margin: "10px auto 0",
                        lineHeight: 1.9,
                      }}
                    >
                      SparkUp was developed as an academic and practical project
                      to create a safer innovation ecosystem for Oman and help
                      promising ideas move forward with confidence.
                    </p>
                  </div>

                  <Row className="g-4 justify-content-center">
                    {[
                      "Aya Abdullah Al-Habsi",
                      "Al-Anood Said Al-Saadi",
                      "Namariq Saleh Al-Mashaikhi",
                    ].map((name, i) => (
                      <Col md="6" lg="4" key={i}>
                        <div
                          style={{
                            borderRadius: "22px",
                            padding: "24px",
                            background: "linear-gradient(180deg, #f7fbff 0%, #fff8f1 100%)",
                            border: "1px solid #e2edf8",
                            textAlign: "center",
                            height: "100%",
                          }}
                        >
                          <div
                            style={{
                              width: 72,
                              height: 72,
                              borderRadius: "22px",
                              margin: "0 auto 16px",
                              display: "grid",
                              placeItems: "center",
                              background: "linear-gradient(135deg, #2f80ed 0%, #ff7a00 100%)",
                              color: "#fff",
                              fontSize: "1.5rem",
                              boxShadow: "0 14px 28px rgba(47,128,237,0.18)",
                            }}
                          >
                            <FaUserTie />
                          </div>
                          <h5 style={{ color: "#173b67", fontWeight: 800, marginBottom: "8px" }}>
                            {name}
                          </h5>
                          <p style={{ color: "#7289a4", marginBottom: 0 }}>
                            SparkUp Project Team
                          </p>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </CardBody>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* CTA */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          <Card
            style={{
              border: "none",
              borderRadius: "30px",
              background: "linear-gradient(90deg, #153a66 0%, #224d7d 50%, #ff7a00 140%)",
              boxShadow: "0 24px 60px rgba(21,58,102,0.22)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -20,
                right: 60,
                width: 180,
                height: 180,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.08)",
              }}
            />
            <CardBody className="p-4 p-lg-5">
              <Row className="align-items-center">
                <Col lg="8">
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 14px",
                      borderRadius: "999px",
                      background: "rgba(255,255,255,0.12)",
                      color: "#fff",
                      fontWeight: 800,
                      marginBottom: "16px",
                    }}
                  >
                    <FaUsers />
                    Join the journey
                  </div>

                  <h2
                    style={{
                      color: "#fff",
                      fontWeight: 900,
                      marginBottom: "12px",
                    }}
                  >
                    Every great innovation starts with a spark.
                  </h2>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.9)",
                      lineHeight: 1.9,
                      marginBottom: 0,
                    }}
                  >
                    SparkUp exists to make sure that no valuable idea gets lost.
                    Share, protect, grow, and connect in one platform built for
                    the future of innovation in Oman.
                  </p>
                </Col>

                <Col lg="4" className="text-lg-end mt-4 mt-lg-0">
                  <Button
                    onClick={() => navigate("/register")}
                    style={{
                      border: "none",
                      borderRadius: "16px",
                      padding: "14px 24px",
                      fontWeight: 900,
                      background: "var(--surface-bg)",
                      color: "#173b67",
                    }}
                  >
                    Get Started <FaArrowRight className="ms-2" />
                  </Button>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </motion.div>
      </Container>
    </div>
  );
}