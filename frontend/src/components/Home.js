import React, { useContext, useEffect, useRef } from "react";
import { Container, Row, Col, Button, Card, CardBody } from "reactstrap";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FaArrowRight, FaLightbulb, FaUserShield, FaMoneyCheckAlt } from "react-icons/fa";
import logo from "../image/logo2.png";
import heroMain from "../image/h3.jpg";
import heroSecondary from "../image/home2.jpg";
import "./homePremium.css";
import { AppContext } from "../context/AppContext";
import GuidedTour from "./GuidedTour";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const navigate = useNavigate();
  const { t, lang } = useContext(AppContext);
  const rootRef = useRef(null);
  const navRef = useRef(null);
  const brandRef = useRef(null);
  const imageWrapRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(navRef.current, { y: -28, opacity: 0, duration: 0.85, ease: "power3.out" });
      gsap.from(brandRef.current, { scale: 0.86, opacity: 0, duration: 0.9, delay: 0.15, ease: "back.out(1.7)" });
      gsap.from(".spark-home-title", { y: 34, opacity: 0, duration: 0.95, delay: 0.12, ease: "power3.out" });
      gsap.from(".spark-home-text", { y: 24, opacity: 0, duration: 0.8, delay: 0.2, ease: "power3.out" });
      gsap.from(".spark-home-actions .btn", { y: 18, opacity: 0, stagger: 0.1, duration: 0.75, delay: 0.28, ease: "power3.out" });
      gsap.from(imageWrapRef.current, { x: 32, opacity: 0, scale: 0.96, duration: 1, delay: 0.18, ease: "power3.out" });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const copy = lang === "ar"
    ? {
        badge: "منصة ابتكار ذكية لعُمان",
        titleA: "حوّل الأفكار إلى",
        titleB: "تقدّم واضح",
        titleC: "وتمويل حقيقي.",
        desc: "SparkUp يحمي ويدعم رحلة الابتكار من الفكرة حتى التمويل عبر مسار واضح وآمن.",
        why: "لماذا SparkUp؟",
        spark: "ابتكر معنا",
        stats: [
          { value: "100+", label: "فكرة قيد المتابعة" },
          { value: "4", label: "أدوار مترابطة" },
          { value: "Live", label: "تحديثات مباشرة" },
        ],
        features: [
          { icon: <FaLightbulb />, title: "إرسال الأفكار بوضوح", text: "يمكن للمبتكرين إرسال الأفكار ورفع ملفات الملكية الفكرية بسهولة." },
          { icon: <FaUserShield />, title: "مركز تحكم للإدارة", text: "تستطيع الإدارة المراجعة والتعليق وتعيين المراجعين وعرض الأفكار على الممولين." },
          { icon: <FaMoneyCheckAlt />, title: "وضوح في التمويل", text: "تابع كل خطوة من الإرسال حتى التمويل بطريقة أوضح وأسهل." },
        ],
      }
    : {
        badge: "Smart innovation platform for Oman",
        titleA: "Turn ideas into",
        titleB: "clear progress",
        titleC: "and real funding.",
        desc: "SparkUp protects and supports the innovation journey from idea to funding through one safe and clear workflow.",
        why: "Why SparkUp ?",
        spark: "Spark With Us",
        stats: [
          { value: "100+", label: "Ideas tracked" },
          { value: "4 roles", label: "Connected workflow" },
          { value: "Live", label: "Status updates" },
        ],
        features: [
          { icon: <FaLightbulb />, title: "Submit ideas clearly", text: "Innovators can submit ideas and upload IP forms in a guided flow." },
          { icon: <FaUserShield />, title: "Admin control center", text: "Admins can review, comment, assign reviewers, and present ideas with clarity." },
          { icon: <FaMoneyCheckAlt />, title: "Funding visibility", text: "Track every step from submission to funding in one understandable path." },
        ],
      };

  return (
    <div className="spark-home-page" ref={rootRef}>
      <GuidedTour type="home" />
      <section className="spark-home-hero">
        <div className="spark-home-bg-blob spark-blob-left" />
        <div className="spark-home-bg-blob spark-blob-right" />

        <Container className="py-4 py-lg-5 position-relative">
          <nav className="spark-home-nav mb-4 mb-lg-5" ref={navRef}>
            <div className="spark-home-brand" onClick={() => navigate("/")} role="button" tabIndex={0} ref={brandRef}>
              <img src={logo} alt="SparkUp" className="spark-home-logo" />
            </div>

            <div className="spark-home-nav-links">
              <button onClick={() => navigate("/")}>{t("home")}</button>
              <button onClick={() => navigate("/about")}>{t("about")}</button>
              <button onClick={() => navigate("/contact")}>{t("contact")}</button>
              <button className="spark-nav-login" onClick={() => navigate("/login")}>{t("login")}</button>
            </div>
          </nav>

          <Row className="align-items-center g-4 g-lg-5">
            <Col lg="6">
              <div className="spark-home-copy">
                <div className="spark-home-badge">{copy.badge}</div>
                <h1 className="spark-home-title">{copy.titleA} <span>{copy.titleB}</span> {copy.titleC}</h1>
                <p className="spark-home-text">{copy.desc}</p>
                <div className="spark-home-actions">
                  <Button className="spark-home-primary" onClick={() => navigate("/register")}>
                    {t("getStarted")} <FaArrowRight className={lang === "ar" ? "me-2" : "ms-2"} />
                  </Button>
                </div>
                <div className="spark-home-mini-stats">
                  {copy.stats.map((item) => (
                    <div className="spark-home-mini-card" key={item.label}>
                      <strong>{item.value}</strong>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Col>

            <Col lg="6">
              <div className="spark-home-visual" ref={imageWrapRef}>
                <div className="spark-float-card spark-card-top">
                  <div className="spark-float-dot blue" />
                  <div><strong>{copy.spark}</strong></div>
                </div>
                <div className="spark-home-main-illustration"><img src={heroMain} alt="SparkUp platform illustration" /></div>
                <div className="spark-home-side-preview"><img src={heroSecondary} alt="SparkUp live dashboard preview" /></div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="spark-home-features py-5">
        <Container>
          <div className="spark-section-head text-center mb-5"><div className="spark-section-badge">{copy.why}</div></div>
          <Row className="g-4">
            {copy.features.map((item, index) => (
              <Col md="4" key={item.title}>
                <Card className="spark-feature-card border-0"><CardBody><div className="spark-feature-icon">{item.icon}</div><div className="spark-feature-number">0{index + 1}</div><h4>{item.title}</h4><p>{item.text}</p></CardBody></Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>
    </div>
  );
}
