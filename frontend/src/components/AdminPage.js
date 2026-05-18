import React, { useContext, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";
import {
  FaUserShield,
  FaEnvelope,
  FaPhone,
  FaKey,
  FaLightbulb,
  FaCalendarCheck,
  FaClipboardList,
  FaRobot,
  FaUsers,
  FaMoneyCheckAlt,
  FaCertificate,
  FaEdit,
  FaLanguage,
  FaMoon,
  FaSun,
  FaBolt,
  FaComments,
  FaBell,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";

import logo from "../image/logo2.png";
import { ResetPasswordModal } from "./ResetPass";
import { logout, updateUser } from "../store/authSlice";
import ProfileEditModal from "./ProfileEditModal";
import AddAdminModal from "./AddAdminModal";
import { AppContext } from "../context/AppContext";
import GuidedTour from "./GuidedTour";


function NotificationIcon({ count = 0 }) {
  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <FaBell />
      {count > 0 && (
        <span
          style={{
            position: "absolute",
            top: -9,
            right: -14,
            minWidth: 18,
            height: 18,
            padding: "0 5px",
            borderRadius: 999,
            background: "#ff3b1f",
            color: "#fff",
            fontSize: 11,
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid #fff",
            lineHeight: 1,
            zIndex: 5,
          }}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </span>
  );
}

function AdminPage() {
  const { user } = useSelector((state) => state.auth);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const [resetOpen, setResetOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [addAdminOpen, setAddAdminOpen] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { theme, lang, toggleTheme, toggleLang, t, palette } =
    useContext(AppContext);

  const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");

function getAuthToken(user) {
  const directToken =
    localStorage.getItem("token") ||
    localStorage.getItem("userToken") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("jwt") ||
    user?.token;

  if (directToken) return directToken;

  try {
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");
    return savedUser?.token || savedUser?.accessToken || "";
  } catch (error) {
    return "";
  }
}

function getUnreadCount(data) {
  return Number(
    data?.count ??
      data?.unreadCount ??
      data?.totalUnread ??
      data?.unread ??
      0
  );
}


  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      try {
        const token = getAuthToken(user);

        if (!token) {
          setUnreadNotifications(0);
          return;
        }

        const requestOptions = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const urls = [
          `${API_URL}/api/notifications/unread-count`,
          `${API_URL}/notifications/unread-count`,
        ];

        let data = null;

        for (const url of urls) {
          const res = await fetch(url, requestOptions);
          if (res.ok) {
            data = await res.json();
            break;
          }
        }

        if (!data) {
          setUnreadNotifications(0);
          return;
        }

        setUnreadNotifications(getUnreadCount(data));
      } catch (error) {
        console.log("Failed to load unread notification count", error);
      }
    };

    if (user) {
      fetchUnreadNotifications();
      const interval = setInterval(fetchUnreadNotifications, 8000);
      return () => clearInterval(interval);
    }

    return undefined;
  }, [user]);

  const toggleReset = () => setResetOpen((o) => !o);
  const toggleAiModal = () => setAiModalOpen((o) => !o);
  const toggleProfileModal = () => setProfileModalOpen((o) => !o);
  const toggleAddAdmin = () => setAddAdminOpen((o) => !o);

  const phone =
    user?.phone || user?.phoneNumber || user?.mobile || "+000 00000000";

  const adminName = user?.name || "Admin";

  const handleLogout = () => {
    dispatch(logout());
    navigate("/", { replace: true });
  };

  const getImgSrc = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API_URL}${url}`;
  };

  const mainCards = [
    {
      key: "ideas",
      title: lang === "ar" ? "مراجعة الأفكار" : "Review Ideas",
      text:
        lang === "ar"
          ? "راجع الأفكار الجديدة وحدث حالتها."
          : "Check new ideas, update status, and prepare them for funders.",
      icon: <FaLightbulb size={40} />,
      bg: "#133a63",
    },
    {
      key: "events",
      title: lang === "ar" ? "إدارة الفعاليات" : "Events Management",
      text:
        lang === "ar"
          ? "إنشاء وإدارة الورش والهاكاثونات."
          : "Create and manage workshops, hackathons, and demo days.",
      icon: <FaCalendarCheck size={40} />,
      bg: "#133a63",
    },
    {
      key: "reports",
      title: lang === "ar" ? "التقارير والتغذية" : "Report & Feedback",
      text:
        lang === "ar"
          ? "عرض التقارير والملاحظات."
          : "View reports, analytics, and feedback summaries.",
      icon: <FaClipboardList size={38} />,
      bg: "#133a63",
    },
    {
      key: "users",
      title: lang === "ar" ? "إدارة المستخدمين" : "User Management",
      text:
        lang === "ar"
          ? "إدارة الممولين والمراجعين والمبتكرين والأدمن في مكان واحد."
          : "Manage funders, reviewers, innovators, and admins in one advanced control center.",
      icon: <FaUsers size={36} />,
      bg: "#133a63",
    },
    {
      key: "funding",
      title: lang === "ar" ? "إدارة التمويل" : "Funding Management",
      text:
        lang === "ar"
          ? "متابعة برامج التمويل."
          : "Configure funding programs and track funding cycles.",
      icon: <FaMoneyCheckAlt size={36} />,
      bg: "#133a63",
    },
    {
      key: "certificates",
      title: lang === "ar" ? "الشهادات" : "Certificates",
      text:
        lang === "ar"
          ? "إصدار الشهادات الرقمية."
          : "Issue digital certificates for events and completed ideas.",
      icon: <FaCertificate size={36} />,
      bg: "#133a63",
    },

    {
      key: "activity",
      title: lang === "ar" ? "التحديثات المباشرة" : "Real-time Activity Feed",
      text: lang === "ar" ? "شاهد آخر الأفكار والفعاليات والتقييمات فور حدوثها." : "See live updates for ideas, reviews, feedback, events, and forum discussions.",
      icon: <FaBolt size={36} />,
      bg: "#133a63",
    },
    {
      key: "forum",
      title: lang === "ar" ? "مجتمع النقاش" : "Community Forum",
      text: lang === "ar" ? "تابع نقاشات المبتكرين والمراجعين والممولين." : "Monitor community discussions between innovators, reviewers, and funders.",
      icon: <FaComments size={36} />,
      bg: "#133a63",
    },
  ];

  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  const handleCardClick = (key) => {
    if (key === "events") navigate("/events");
    if (key === "ideas") navigate("/ideas");
    if (key === "reports") navigate("/reports");
    if (key === "users") navigate("/admin/users");
    if (key === "funding") navigate("/funding");
    if (key === "certificates") navigate("/certificates");
    if (key === "activity") navigate("/activity");
    if (key === "forum") navigate("/forum");
  };

  const SideRow = ({ icon, label, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "none",
        background: "transparent",
        padding: 0,
        width: "100%",
        color: "#fff",
        textAlign: "left",
        cursor: "pointer",
      }}
      className="d-flex align-items-center mb-3"
    >
      <span className="me-2">{icon}</span>
      <span style={{ fontSize: "0.95rem" }}>{label}</span>
    </button>
  );

  const brandTextStyle = {
    fontSize: "1.8rem",
    fontWeight: 900,
    letterSpacing: "0.2px",
    lineHeight: 1,
            zIndex: 5,
    background: "linear-gradient(90deg, #184f89 0%, #2f80ed 45%, #ff7a00 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: palette.bg,
        color: palette.text,
      }}
      className="d-flex align-items-stretch"
    >
      <GuidedTour type="admin" />
      <Container fluid className="py-4">
        <Row className="h-100 flex-row-reverse">
          {/* Sidebar */}
          <Col
            md="3"
            lg="2"
            className="d-flex flex-column"
            style={{ maxWidth: 260 }}
          >
            <Card
              className="h-100 shadow border-0"
              style={{ backgroundColor: "#f59c32", color: "#fff", borderRadius: 24 }}
            >
              <CardBody className="d-flex flex-column p-3 p-md-4">
                <div className="d-flex flex-column align-items-center mb-4">
                  {user?.imageUrl ? (
                    <img
                      src={getImgSrc(user.imageUrl)}
                      alt="Profile"
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <FaUserShield size={48} />
                  )}

                  <div className="d-flex align-items-center gap-2 mt-2">
                    <span className="fw-semibold">
                      {t("hi")} {adminName}
                    </span>
                    <button
                      type="button"
                      onClick={toggleProfileModal}
                      style={{
                        border: "none",
                        background: "transparent",
                        padding: 0,
                        color: "#fff",
                      }}
                    >
                      <FaEdit size={16} />
                    </button>
                  </div>

                  <Badge
                    pill
                    color="light"
                    className="mt-1 text-uppercase"
                    style={{
                      fontSize: "0.6rem",
                      letterSpacing: "0.06em",
                      color: "#f57c00",
                    }}
                  >
                    Admin
                  </Badge>
                </div>

                <div className="small mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <FaEnvelope className="me-2" />
                    <span className="text-truncate">{user?.email}</span>
                  </div>

                  <div className="d-flex align-items-center mb-3">
                    <FaPhone className="me-2" />
                    <span>{phone}</span>
                  </div>

                  <SideRow
                    icon={<FaKey />}
                    label={t("resetPassword")}
                    onClick={toggleReset}
                  />
                  <SideRow
                    icon={<FaLanguage />}
                    label={t("language")}
                    onClick={toggleLang}
                  />
                  <SideRow
                    icon={theme === "light" ? <FaMoon /> : <FaSun />}
                    label={t("theme")}
                    onClick={toggleTheme}
                  />
                  <SideRow
                    icon={<NotificationIcon count={unreadNotifications} />}
                    label={lang === "ar" ? "الإشعارات" : "Notifications"}
                    onClick={() => {
                      navigate("/notifications");
                    }}
                  />
                </div>

                <Button
                  color="light"
                  size="sm"
                  className="w-100 mb-3"
                  style={{
                    color: "#f57c00",
                    fontWeight: 700,
                    borderRadius: 999,
                  }}
                  onClick={handleLogout}
                >
                  {t("logout")}
                </Button>

                <div className="flex-grow-1" />

                <div className="d-flex justify-content-center">
                  
                </div>
              </CardBody>
            </Card>
          </Col>

          {/* Main */}
          <Col md="9" lg="10" className="mt-4 mt-md-0">
           
            {/* Main cards */}
            <Row className="gy-4">
              {mainCards.map((card) => (
                <Col key={card.key} sm="6" lg="4">
                  <Card
                    className="shadow border-0 h-100"
                    style={{
                      backgroundColor: card.bg,
                      color: "#fff",
                      borderRadius: 20,
                      cursor: "pointer",
                      border: palette.isDark
                        ? `1px solid ${palette.border}`
                        : "none",
                    }}
                    onClick={() => handleCardClick(card.key)}
                  >
                    <CardBody className="d-flex flex-column justify-content-between p-4">
                      <div>
                        <div className="mb-3">{card.icon}</div>
                        <h5 className="fw-bold mb-2">{card.title}</h5>
                        <p className="small mb-0">{card.text}</p>
                      </div>

                      <div className="mt-3 text-end">
                        <Button
                          size="sm"
                          color="light"
                          style={{ borderRadius: 999, fontWeight: 700 }}
                        >
                          {t("open")}
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </Container>

      <ResetPasswordModal isOpen={resetOpen} toggle={toggleReset} />
      <AddAdminModal isOpen={addAdminOpen} toggle={toggleAddAdmin} />

      <Modal isOpen={aiModalOpen} toggle={toggleAiModal} centered>
        <ModalHeader
          toggle={toggleAiModal}
          style={{
            background: palette.surface,
            color: palette.text,
            borderBottom: `1px solid ${palette.border}`,
          }}
        >
          {lang === "ar" ? "مساعد الإدارة" : "Admin AI Assistant"}
        </ModalHeader>
        <ModalBody
          style={{ background: palette.surface, color: palette.text }}
        />
        <ModalFooter
          style={{
            background: palette.surface,
            borderTop: `1px solid ${palette.border}`,
          }}
        >
          <Button color="secondary" onClick={toggleAiModal}>
            {t("close")}
          </Button>
        </ModalFooter>
      </Modal>

      <ProfileEditModal
        isOpen={profileModalOpen}
        toggle={toggleProfileModal}
        user={user}
        onSaved={(u) => dispatch(updateUser(u))}
      />
    </div>
  );
}

export default AdminPage;
