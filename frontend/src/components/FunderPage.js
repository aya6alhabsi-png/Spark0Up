import React, { useContext, useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";
import {
  FaUserCircle,
  FaEnvelope,
  FaPhone,
  FaKey,
  FaCalendarAlt,
  FaClipboardList,
  FaRobot,
  FaHandHoldingUsd,
  FaEdit,
  FaLanguage,
  FaMoon,
  FaSun,
  FaBell,
  FaCommentDots,
  FaCertificate,
  FaBolt,
  FaComments,
} from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import logo from "../image/logo2.png";
import { ResetPasswordModal } from "./ResetPass";
import { logout, updateUser } from "../store/authSlice";
import ProfileEditModal from "./ProfileEditModal";
import FeedbackPopup from "./FeedbackPopup";
import { AppContext } from "../context/AppContext";
import GuidedTour from "./GuidedTour";

function SidebarRow({ icon, text, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="d-flex align-items-center mb-3 w-100"
      style={{
        border: "none",
        background: "transparent",
        padding: 0,
        color: "#fff",
        fontSize: "0.95rem",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span className="me-2" style={{ width: 18, display: "inline-flex", justifyContent: "center" }}>
        {icon}
      </span>
      <span>{text}</span>
    </button>
  );
}


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

function FunderPage() {
  const { user } = useSelector((state) => state.auth);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [resetOpen, setResetOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { theme, lang, toggleTheme, toggleLang, t } = useContext(AppContext);

  const toggleReset = () => setResetOpen((o) => !o);
  const toggleAiModal = () => setAiModalOpen((o) => !o);
  const toggleProfileModal = () => setProfileModalOpen((o) => !o);
  const toggleFeedback = () => setFeedbackOpen((o) => !o);

  const phone = user?.phone || user?.phoneNumber || user?.mobile || "+000 00000000";

  const handleLogout = () => {
    dispatch(logout());
    navigate("/", { replace: true });
  };

  const funderName = user?.name || "Funder";

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
  const getProfileImageSrc = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API_URL}${url}`;
  };

  const mainCards = [
    {
      key: "ideasPresented",
      title: lang === "ar" ? "أفكار معروضة علي" : "Ideas Presented to Me",
      text: lang === "ar" ? "عرض الأفكار المعتمدة من الأدمن المرتبطة بك." : "View all admin-approved ideas mapped to you with summary and status.",
      icon: <FaHandHoldingUsd size={40} />,
      bg: "#123b73",
    },
    {
      key: "updateStatus",
      title: lang === "ar" ? "تحديث حالة الفكرة" : "Update Idea Status",
      text: lang === "ar" ? "تغيير الحالة وإضافة ملاحظات." : "Set ideas to Pending, In Progress, or Resolved and add internal notes.",
      icon: <FaClipboardList size={38} />,
      bg: "#133a63",
    },
    {
      key: "reports",
      title: lang === "ar" ? "تقارير الممول" : "Funder Reports",
      text: lang === "ar" ? "إحصائيات أفكارك وقراراتك." : "See how many ideas you reviewed, approved, rejected, or kept in progress.",
      icon: <FaClipboardList size={36} />,
      bg: "#133a63",
    },
    {
      key: "events",
      title: lang === "ar" ? "فعاليات العرض والاستثمار" : "Pitch & Demo Events",
      text: lang === "ar" ? "استعرض فعاليات البيتش والديمو." : "Browse pitch days, demo days, and investment-related events.",
      icon: <FaCalendarAlt size={40} />,
      bg: "#133a63",
    },
    {
      key: "certificates",
      title: lang === "ar" ? "شهاداتي" : "My Certificates",
      text: lang === "ar" ? "حمّل شهادات حضور الفعاليات بعد مسح QR الحضور." : "Download event certificates after your QR attendance is confirmed.",
      icon: <FaCertificate size={36} />,
      bg: "#133a63",
    },
    {
      key: "feedback",
      title: lang === "ar" ? "التقييم والملاحظات" : "Feedback",
      text: lang === "ar" ? "أرسل رأيك في المنصة من خلال نافذة سريعة." : "Send your feedback using a quick popup.",
      icon: <FaCommentDots size={36} />,
      bg: "#133a63",
    },

    {
      key: "activity",
      title: lang === "ar" ? "التحديثات المباشرة" : "Real-time Activity Feed",
      text: lang === "ar" ? "تابع آخر التحديثات فور حدوثها." : "See live updates for ideas, funding decisions, events, feedback, and discussions.",
      icon: <FaBolt size={36} />,
      bg: "#133a63",
    },
    {
      key: "forum",
      title: lang === "ar" ? "مجتمع النقاش" : "Community Forum",
      text: lang === "ar" ? "شارك في نقاشات التمويل والابتكار." : "Join professional discussions about ideas and funding.",
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
    if (key === "ideasPresented" || key === "updateStatus") navigate("/ideas");
    if (key === "reports") navigate("/funding");
    if (key === "certificates") navigate("/certificates");
    if (key === "feedback") toggleFeedback();
    if (key === "activity") navigate("/activity");
    if (key === "forum") navigate("/forum");
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--app-bg)" }} className="d-flex align-items-stretch">
      <GuidedTour type="funder" />
      <Container fluid className="py-4">
        <Row className="h-100 flex-row-reverse">
          {/* Sidebar */}
          <Col md="3" lg="2" className="d-flex flex-column" style={{ maxWidth: 260 }}>
            <Card className="h-100 shadow border-0" style={{ backgroundColor: "#f59c32", color: "#fff" }}>
              <CardBody className="d-flex flex-column p-3 p-md-4">
                <div className="d-flex flex-column align-items-center mb-4">
                  {user?.imageUrl ? (
                    <img
                      src={getProfileImageSrc(user.imageUrl)}
                      alt="Profile"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                      style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }}
                    />
                  ) : (
                    <FaUserCircle size={48} />
                  )}

                  <div className="d-flex align-items-center gap-2 mt-2">
                    <span className="fw-semibold">
                      {t("hi")} {funderName}
                    </span>
                    <button
                      type="button"
                      onClick={toggleProfileModal}
                      style={{
                        border: "none",
                        background: "transparent",
                        padding: 0,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <FaEdit size={16} />
                    </button>
                  </div>

                  {user?.bio ? (
                    <div className="mt-2 text-center" style={{ maxWidth: 260, fontSize: "0.85rem", opacity: 0.95 }}>
                      {user.bio}
                    </div>
                  ) : null}
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

                  <SidebarRow icon={<FaKey />} text={t("resetPassword")} onClick={toggleReset} />
                  <SidebarRow icon={<FaLanguage />} text={t("language")} onClick={toggleLang} />
                  <SidebarRow icon={theme === "light" ? <FaMoon /> : <FaSun />} text={t("theme")} onClick={toggleTheme} />
                  <SidebarRow
                    icon={<NotificationIcon count={unreadNotifications} />}
                    text={lang === "ar" ? "الإشعارات" : "Notifications"}
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
                    fontWeight: 600,
                    borderRadius: "999px",
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
            

            <Row className="gy-4">
              {mainCards.map((card) => (
                <Col key={card.key} sm="6" lg="4">
                  <Card
                    className="shadow border-0 h-100"
                    style={{ backgroundColor: card.bg, color: "#fff", borderRadius: "18px", cursor: "pointer" }}
                    onClick={() => handleCardClick(card.key)}
                  >
                    <CardBody className="d-flex flex-column justify-content-between p-4">
                      <div>
                        <div className="mb-3">{card.icon}</div>
                        <h5 className="fw-bold mb-2">{card.title}</h5>
                        <p className="small mb-0">{card.text}</p>
                      </div>
                      <div className="mt-3 text-end">
                        <Button size="sm" color="light">
                          {lang === "ar" ? "فتح" : "Open"}
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

      <Modal isOpen={aiModalOpen} toggle={toggleAiModal} centered>
        <ModalHeader toggle={toggleAiModal}>AI Helper</ModalHeader>
        <ModalBody />
        <ModalFooter>
          <Button color="secondary" onClick={toggleAiModal}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      <FeedbackPopup isOpen={feedbackOpen} toggle={toggleFeedback} />

      <ProfileEditModal
        isOpen={profileModalOpen}
        toggle={toggleProfileModal}
        user={user}
        onSaved={(u) => dispatch(updateUser(u))}
      />
    </div>
  );
}

export default FunderPage;






