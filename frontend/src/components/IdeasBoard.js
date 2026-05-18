import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Container,
  Card,
  CardBody,
  Button,
  Input,
  Row,
  Col,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Alert,
  Spinner,
  Form,
  FormGroup,
  Label,
} from "reactstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { api, API_URL, authHeaders } from "./api";
import ideaBoardBg from "../image/idea_board_bg.jpg";
import { io } from "socket.io-client";
import "./theme_updated.css";
import GuidedTour from "./GuidedTour";

const STATUS_LABELS = {
  submitted: "Submitted to Admin",
  admin_changes_requested: "Admin Asked for Changes",
  with_reviewer: "With Reviewer",
  reviewer_changes_requested: "Reviewer Asked for Changes",
  reviewer_approved: "Reviewer Approved",
  presented_to_funders: "Presented to Funder",
  funding_pending: "Funding Pending",
  contract_drafted: "Contract Drafted",
  contract_signed: "Contract Signed",
  in_progress: "In Progress",
  resolved: "Funded / Completed",
  rejected: "Rejected",
  under_review: "Under Review",
  approved: "Approved",
};

const statusFlow = [
  "submitted",
  "with_reviewer",
  "reviewer_approved",
  "presented_to_funders",
  "funding_pending",
  "contract_drafted",
  "contract_signed",
  "in_progress",
  "resolved",
];

const statusColor = (s) => {
  switch (s) {
    case "submitted":
      return "secondary";
    case "admin_changes_requested":
    case "reviewer_changes_requested":
    case "under_review":
      return "warning";
    case "reviewer_approved":
    case "approved":
      return "success";
    case "rejected":
      return "danger";
    case "with_reviewer":
    case "presented_to_funders":
      return "primary";
    case "funding_pending":
      return "info";
    case "contract_drafted":
      return "warning";
    case "contract_signed":
      return "primary";
    case "in_progress":
      return "dark";
    case "resolved":
      return "success";
    default:
      return "secondary";
  }
};

const getProgressPercent = (status) => {
  if (status === "rejected") return 15;
  if (status === "admin_changes_requested") return 25;
  if (status === "reviewer_changes_requested") return 45;
  if (status === "funding_pending") return 78;
  if (status === "contract_drafted") return 84;
  if (status === "contract_signed") return 88;
  if (status === "in_progress") return 93;
  if (status === "approved") return 60;
  if (status === "under_review") return 40;
  const idx = statusFlow.indexOf(status);
  if (idx === -1) return 0;
  return Math.round((idx / (statusFlow.length - 1)) * 100);
};

const getNextStepText = (idea, role) => {
  switch (idea.status) {
    case "submitted":
      return role === "innovator"
        ? "Waiting for admin review."
        : "Admin should review this idea and either comment or send it to a reviewer.";
    case "admin_changes_requested":
      return role === "innovator"
        ? "Update your idea based on the admin comment, then resubmit it."
        : "Waiting for the innovator to update and resubmit the idea.";
    case "with_reviewer":
    case "under_review":
      return role === "innovator"
        ? "Your idea is with the reviewer."
        : "Reviewer should accept it or request changes.";
    case "reviewer_changes_requested":
      return role === "innovator"
        ? "Reviewer requested changes. Wait for the admin note, then update and resubmit."
        : "Admin should review the reviewer comment and send the required updates to the innovator.";
    case "reviewer_approved":
    case "approved":
      return role === "innovator"
        ? "Reviewer approved your idea. Waiting for admin to present it to a funder."
        : "Admin can now present this idea to a funder.";
    case "presented_to_funders":
      return role === "innovator"
        ? "Your idea is now visible to funders."
        : "Funder can review the idea and contact details.";
    case "funding_pending":
      return "Funder accepted. Funding communication room is open for budget, documents, conditions, and milestones.";
    case "contract_drafted":
      return "Funding details are agreed. Contract is drafted and waiting for review/signature.";
    case "contract_signed":
      return "Contract is signed. Project is ready to start implementation.";
    case "in_progress":
      return "Funding is in progress.";
    case "resolved":
      return "This idea is complete.";
    case "rejected":
      return "This idea was rejected.";
    default:
      return "Follow the next workflow step.";
  }
};

const normalizeAssetUrl = (url) => {
  if (!url) return "";
  if (/^(https?:)?\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  return `${API_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

const formatIdeaDate = (value) => {
  if (!value) return "Recently updated";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "Recently updated";
  return dt.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};


const REVIEWER_DECISION_META = {
  accepted: {
    label: "Approve",
    color: "#1f8a5c",
    soft: "rgba(31,138,92,0.12)",
    helper: "Move the idea forward as reviewer approved.",
  },
  changes_requested: {
    label: "Request Changes",
    color: "#d88718",
    soft: "rgba(216,135,24,0.14)",
    helper: "Ask for improvements before it can move on.",
  },
  rejected: {
    label: "Reject",
    color: "#c84545",
    soft: "rgba(200,69,69,0.14)",
    helper: "Stop the idea at reviewer stage with a clear reason.",
  },
};

const getReviewerDecisionMeta = (decision) =>
  REVIEWER_DECISION_META[decision] || REVIEWER_DECISION_META.accepted;


const getInnovatorTrackerStep = (status) => {
  const normalized =
    status === "funding_pending"
      ? "presented_to_funders"
      : status === "in_progress"
      ? "resolved"
      : status === "admin_changes_requested"
      ? "submitted"
      : status === "reviewer_changes_requested"
      ? "with_reviewer"
      : status === "under_review"
      ? "with_reviewer"
      : status === "approved"
      ? "reviewer_approved"
      : status;

  const idx = statusFlow.indexOf(normalized);
  return idx === -1 ? 1 : idx + 1;
};


function InnovatorTrackingCard({ idea, index, onOpenDetail, onOpenResubmit, canOpenFundingRoom, onOpenFundingRoom }) {
  const currentStep = getInnovatorTrackerStep(idea.status);
  const progressWidth = `${Math.max(8, ((currentStep - 1) / (statusFlow.length - 1)) * 100)}%`;
  const latestAdminComment =
    idea.adminComments?.length
      ? idea.adminComments[idea.adminComments.length - 1]?.comment
      : "";
  const recommendationTone =
    idea.status === "reviewer_changes_requested" || idea.status === "admin_changes_requested"
      ? "#ff9f43"
      : idea.status === "reviewer_approved" || idea.status === "approved"
      ? "#1f8a5c"
      : "#1e63c6";

  const milestones = [
    "Initial Review",
    "Reviewer Check",
    "Approval",
    "Funding View",
    "Completed",
  ];

  return (
    <Card
      key={idea._id}
      className="border-0 shadow-sm"
      style={{
        borderRadius: 26,
        overflow: "hidden",
        background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
        border: "1px solid #dfeaf8",
        cursor: "pointer",
      }}
      onClick={(e) => {
        e.stopPropagation();
        onOpenDetail(idea);
      }}
    >
      <CardBody style={{ padding: 0 }}>
        <div
          style={{
            background: "linear-gradient(135deg, #0f2747 0%, #18457f 50%, #1e67c7 100%)",
            color: "#fff",
            padding: "24px 28px",
          }}
        >
          <div className="d-flex align-items-start justify-content-between gap-4 flex-wrap tour-ideas">
            <div style={{ minWidth: 260 }}>
              <div
                style={{
                  color: "rgba(255,255,255,0.78)",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontSize: 12,
                  marginBottom: 10,
                }}
              >
                Tracking dashboard
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 900, lineHeight: 1.1 }}>
                {idea.title || `Idea ${index + 1}`}
              </div>
              <div style={{ marginTop: 10, color: "rgba(255,255,255,0.84)", lineHeight: 1.7, maxWidth: 580 }}>
                Follow your idea from admin review to funding in one cleaner space with clear milestones, recommendation cards, and file access.
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(120px, 1fr))",
                gap: 12,
                minWidth: 360,
                maxWidth: 460,
                width: "100%",
              }}
            >
              <div style={trackingMetricBoxStyle}>
                <div style={trackingMetricLabelStyle}>Idea No.</div>
                <div style={trackingMetricValueStyle}>{index + 1}</div>
              </div>
              <div style={trackingMetricBoxStyle}>
                <div style={trackingMetricLabelStyle}>Progress</div>
                <div style={trackingMetricValueStyle}>{getProgressPercent(idea.status)}%</div>
              </div>
              <div style={trackingMetricBoxStyle}>
                <div style={trackingMetricLabelStyle}>Current Stage</div>
                <div style={trackingMetricValueStyleSmall}>{currentStep}/5</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: 24 }}>
          <div className="row g-4">
            <div className="col-lg-8">
              <div
                style={{
                  background: "var(--surface-bg)",
                  borderRadius: 24,
                  border: "1px solid #e2ebf8",
                  padding: 24,
                  boxShadow: "0 16px 34px rgba(15, 39, 71, 0.06)",
                }}
              >
                <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
                  <div>
                    <div style={{ color: "#102846", fontWeight: 900, fontSize: "1.8rem", lineHeight: 1.1 }}>
                      Flow of your idea
                    </div>
                    <div style={{ color: "#6c86a7", marginTop: 6 }}>
                      Expected next move: {getNextStepText(idea, "innovator")}
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#eef5ff",
                      color: "#1f5fa7",
                      borderRadius: 999,
                      padding: "9px 14px",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {STATUS_LABELS[idea.status] || idea.status}
                  </div>
                </div>

                <div style={{ height: 8, background: "#e8f0fb", borderRadius: 999, overflow: "hidden", marginBottom: 18 }}>
                  <div
                    style={{
                      width: progressWidth,
                      height: "100%",
                      borderRadius: 999,
                      background: "linear-gradient(90deg, #ff7a00 0%, #1e67c7 100%)",
                      transition: "width 0.35s ease",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, minmax(90px, 1fr))",
                    gap: 12,
                  }}
                >
                  {milestones.map((label, stepIndex) => {
                    const active = stepIndex + 1 <= currentStep;
                    return (
                      <div key={label} style={{ textAlign: "center" }}>
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: "50%",
                            margin: "0 auto 10px",
                            display: "grid",
                            placeItems: "center",
                            background: active
                              ? "linear-gradient(135deg, #ff7a00, #ffb067)"
                              : "#edf2f8",
                            color: active ? "#fff" : "#6783a7",
                            fontWeight: 900,
                            boxShadow: active ? "0 12px 24px rgba(255, 122, 0, 0.22)" : "none",
                          }}
                        >
                          {stepIndex + 1}
                        </div>
                        <div style={{ color: "#173b67", fontWeight: 700, fontSize: 13, lineHeight: 1.35 }}>{label}</div>
                      </div>
                    );
                  })}
                </div>

                <div
                  style={{
                    marginTop: 22,
                    borderRadius: 20,
                    background: "#f8fbff",
                    border: "1px solid #e4edf8",
                    padding: 18,
                  }}
                >
                  <div className="d-flex flex-wrap gap-3" style={{ color: "#4f6d92", fontWeight: 600 }}>
                    <span><b>Innovator:</b> {idea.innovatorName || idea.innovatorId?.name || "-"}</span>
                    <span>
                      <b>IP Form:</b>{" "}
                      {idea.ipFormUrl ? (
                        <a
                          href={normalizeAssetUrl(idea.ipFormUrl)}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#1e67c7", fontWeight: 800, textDecoration: "underline" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Open file
                        </a>
                      ) : (
                        "No file"
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div
                style={{
                  background: "var(--surface-bg)",
                  borderRadius: 24,
                  border: "1px solid #e2ebf8",
                  padding: 20,
                  boxShadow: "0 16px 34px rgba(15, 39, 71, 0.06)",
                  height: "100%",
                }}
              >
                <div style={{ color: "#102846", fontWeight: 900, fontSize: "1.25rem", marginBottom: 14 }}>
                  Recommendations
                </div>

                <div
                  style={{
                    borderRadius: 18,
                    background: recommendationTone === "#ff9f43" ? "#fff6eb" : "#eef7ff",
                    border: `1px solid ${recommendationTone === "#ff9f43" ? "#ffe0ba" : "#d8e8fb"}`,
                    padding: 16,
                    marginBottom: 14,
                  }}
                >
                  <div style={{ color: recommendationTone, fontWeight: 900, marginBottom: 8 }}>
                    Smart next step
                  </div>
                  <div style={{ color: "#5d7899", lineHeight: 1.7 }}>
                    {getNextStepText(idea, "innovator")}
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: 18,
                    background: "#fff7f7",
                    border: "1px solid #f4dddd",
                    padding: 16,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ color: "#102846", fontWeight: 900, marginBottom: 8 }}>Admin comments</div>
                  <div style={{ color: "#6b7d94", lineHeight: 1.7 }}>
                    {latestAdminComment || "No comments yet"}
                  </div>
                </div>

                <div className="d-grid gap-2">
                  <Button
                    size="sm"
                    color="light"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDetail(idea);
                    }}
                    style={{
                      borderRadius: 16,
                      fontWeight: 800,
                      border: "1px solid #d9e4f5",
                      background: "#eef5ff",
                      color: "#163763",
                      padding: "12px 18px",
                    }}
                  >
                    View details
                  </Button>

                  {canOpenFundingRoom?.(idea) && (
                    <Button
                      size="sm"
                      color="warning"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenFundingRoom?.(idea);
                      }}
                      style={{
                        borderRadius: 16,
                        fontWeight: 900,
                        padding: "12px 18px",
                        background: "linear-gradient(135deg, #ff8a00, #ffbd59)",
                        border: "none",
                        color: "#0f2747",
                      }}
                    >
                      Open Funding Communication
                    </Button>
                  )}

                  {["admin_changes_requested", "reviewer_changes_requested"].includes(idea.status) && (
                    <Button
                      size="sm"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenResubmit(idea);
                      }}
                      style={{
                        borderRadius: 16,
                        fontWeight: 800,
                        padding: "12px 18px",
                        background: "linear-gradient(135deg, #1e67c7, #4aa0ff)",
                        border: "none",
                      }}
                    >
                      Update & Resubmit
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

const trackingMetricBoxStyle = {
  background: "rgba(255,255,255,0.18)",
  borderRadius: 18,
  padding: "14px 16px",
  textAlign: "center",
  border: "1px solid rgba(255,255,255,0.14)",
};

const trackingMetricLabelStyle = {
  color: "rgba(255,255,255,0.85)",
  fontWeight: 800,
  fontSize: 12,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  marginBottom: 6,
};

const trackingMetricValueStyle = {
  color: "#fff",
  fontWeight: 900,
  fontSize: 28,
  lineHeight: 1,
};

const trackingMetricValueStyleSmall = {
  color: "#fff",
  fontWeight: 900,
  fontSize: 22,
  lineHeight: 1.1,
};



const buildTrackingMoments = (idea) => {
  if (!idea) return [];

  const moments = [
    {
      key: `created-${idea._id}`,
      title: "Idea submitted",
      detail: "Your idea entered the SparkUp workflow.",
      when: idea.createdAt,
      tone: "primary",
    },
  ];

  (idea.adminComments || []).forEach((comment, index) => {
    moments.push({
      key: `admin-${index}-${comment.createdAt || index}`,
      title: "Admin comment",
      detail: comment.comment || "Admin left a comment.",
      when: comment.createdAt || idea.updatedAt,
      tone: "warning",
    });
  });

  (idea.evaluations || []).forEach((evaluation, index) => {
    moments.push({
      key: `review-${index}-${evaluation.createdAt || index}`,
      title:
        evaluation.decision === "changes_requested"
          ? "Reviewer requested changes"
          : "Reviewer evaluation submitted",
      detail: `${evaluation.reviewerName || "Reviewer"} scored ${evaluation.score}/10${
        evaluation.comments ? ` — ${evaluation.comments}` : ""
      }`,
      when: evaluation.createdAt || idea.updatedAt,
      tone: evaluation.decision === "changes_requested" ? "warning" : "success",
    });
  });

  moments.push({
    key: `status-${idea.status}-${idea.updatedAt || idea.createdAt}`,
    title: STATUS_LABELS[idea.status] || idea.status,
    detail: getNextStepText(idea, "innovator"),
    when: idea.updatedAt || idea.createdAt,
    tone: idea.status === "resolved" ? "success" : idea.status === "rejected" ? "danger" : "primary",
  });

  return moments
    .filter((item) => item.when)
    .sort((a, b) => new Date(a.when) - new Date(b.when));
};

function AdvancedTrackingPanel({ idea, compact = false }) {
  const milestones = [
    {
      key: "submitted",
      label: "Submit",
      info: "Idea sent to admin",
      done: [
        "submitted",
        "admin_changes_requested",
        "with_reviewer",
        "reviewer_changes_requested",
        "reviewer_approved",
        "approved",
        "presented_to_funders",
        "funding_pending",
        "in_progress",
        "resolved",
      ].includes(idea.status),
    },
    {
      key: "review",
      label: "Review",
      info: "Admin and reviewer check",
      done: [
        "with_reviewer",
        "reviewer_changes_requested",
        "reviewer_approved",
        "approved",
        "presented_to_funders",
        "funding_pending",
        "in_progress",
        "resolved",
      ].includes(idea.status),
    },
    {
      key: "present",
      label: "Present",
      info: "Shared with funder",
      done: ["presented_to_funders", "funding_pending", "in_progress", "resolved"].includes(idea.status),
    },
    {
      key: "fund",
      label: idea.status === "resolved" ? "Funded" : "Final stage",
      info: idea.status === "resolved" ? "Completed successfully" : "Funding decision and execution",
      done: ["funding_pending", "in_progress", "resolved"].includes(idea.status),
    },
  ];

  const moments = buildTrackingMoments(idea);
  const currentStatus = STATUS_LABELS[idea.status] || idea.status;
  const toneColor =
    idea.status === "resolved"
      ? "#1f9254"
      : idea.status === "rejected"
      ? "#cc3f3f"
      : ["admin_changes_requested", "reviewer_changes_requested", "under_review"].includes(idea.status)
      ? "#d88718"
      : "#1e5fa7";

  return (
    <div
      style={{
        background: compact ? "#f7fbff" : "linear-gradient(180deg, #f9fbff 0%, #f1f7ff 100%)",
        border: "1px solid #e2ecfa",
        borderRadius: 22,
        padding: compact ? 16 : 20,
      }}
    >
      <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
        <div>
          <div style={{ color: "#6f88aa", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em" }}>
            ADVANCED TRACKING
          </div>
          <div style={{ color: "#102846", fontWeight: 800, fontSize: compact ? 18 : 20 }}>
            {currentStatus}
          </div>
        </div>
        <div
          style={{
            background: `${toneColor}15`,
            color: toneColor,
            borderRadius: 999,
            padding: "8px 12px",
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {getProgressPercent(idea.status)}% complete
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: compact ? "repeat(auto-fit, minmax(120px, 1fr))" : "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {milestones.map((item, index) => (
          <div
            key={item.key}
            style={{
              borderRadius: 18,
              padding: "14px 14px 12px",
              background: item.done ? "#ffffff" : "#eef4fb",
              border: `1px solid ${item.done ? "#d8e7fb" : "#e3ebf7"}`,
              boxShadow: item.done ? "0 10px 24px rgba(26, 78, 138, 0.06)" : "none",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                marginBottom: 10,
                background: item.done ? "linear-gradient(135deg, #1e5fa7, #63a6ff)" : "#dce7f6",
                color: item.done ? "#fff" : "#6b82a2",
                fontWeight: 800,
              }}
            >
              {index + 1}
            </div>
            <div style={{ color: "#102846", fontWeight: 800, fontSize: 14 }}>{item.label}</div>
            <div style={{ color: "#6f88aa", fontSize: 12, lineHeight: 1.5 }}>{item.info}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: "var(--surface-bg)",
          borderRadius: 18,
          border: "1px solid #e0eafb",
          padding: compact ? 14 : 16,
        }}
      >
        <div style={{ color: "#102846", fontWeight: 800, marginBottom: 8 }}>What happens next?</div>
        <div style={{ color: "#567396", lineHeight: 1.7 }}>{getNextStepText(idea, "innovator")}</div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ color: "#102846", fontWeight: 800, marginBottom: 10 }}>Tracking timeline</div>
        <div style={{ display: "grid", gap: 10 }}>
          {moments.map((item) => (
            <div
              key={item.key}
              style={{
                display: "grid",
                gridTemplateColumns: "16px 1fr",
                gap: 12,
                alignItems: "start",
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background:
                    item.tone === "success"
                      ? "#1f9254"
                      : item.tone === "warning"
                      ? "#e39a26"
                      : item.tone === "danger"
                      ? "#cc3f3f"
                      : "#1e5fa7",
                  marginTop: 7,
                }}
              />
              <div
                style={{
                  background: "var(--surface-bg)",
                  border: "1px solid #e4edf8",
                  borderRadius: 16,
                  padding: "12px 14px",
                }}
              >
                <div className="d-flex justify-content-between gap-3 flex-wrap">
                  <div style={{ color: "#102846", fontWeight: 800 }}>{item.title}</div>
                  <div style={{ color: "#7d91ac", fontSize: 12 }}>{formatIdeaDate(item.when)}</div>
                </div>
                <div style={{ color: "#5e7899", marginTop: 6, lineHeight: 1.6 }}>{item.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function IdeasBoard() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.role === "admin";
  const isInnovator = user?.role === "innovator";
  const isReviewer = user?.role === "reviewer";
  const isFunder = user?.role === "funder";

  const fundingRoomStatuses = ["funding_pending", "contract_drafted", "contract_signed", "in_progress", "resolved"];
  const currentUserId = () => String(user?._id || user?.id || "");
  const sameId = (a, b) => String(a?._id || a || "") === String(b?._id || b || "");
  const isIdeaOwner = (idea) => sameId(idea?.innovatorId || idea?.innovator?._id, currentUserId());
  const hasReviewerApproval = (idea) =>
    idea?.status === "reviewer_approved" &&
    Array.isArray(idea?.evaluations) &&
    idea.evaluations.some((e) => ["accepted", "approved"].includes(e?.decision));
  const isReviewerAssignedToIdea = (idea) => {
    if (!idea || !currentUserId()) return false;
    const reviewerItems = Array.isArray(idea.assignedReviewerIds)
      ? idea.assignedReviewerIds
      : Array.isArray(idea.assignedReviewers)
      ? idea.assignedReviewers
      : [];
    return reviewerItems.some((item) => sameId(item, currentUserId()));
  };

  const canReviewerManageIdea = (idea) =>
    isReviewer &&
    isReviewerAssignedToIdea(idea) &&
    !["presented_to_funders", "funding_pending", "contract_drafted", "contract_signed", "in_progress", "resolved"].includes(idea.status);

  const isSelectedFunderForIdea = (idea) => {
    const selectedIds = Array.isArray(idea?.selectedFunderIds) ? idea.selectedFunderIds : [];
    const selectedObjects = Array.isArray(idea?.selectedFunders) ? idea.selectedFunders : [];
    return [...selectedIds, ...selectedObjects].some((item) => sameId(item, currentUserId()));
  };
  const hasAcceptedFunder = (idea) =>
    Array.isArray(idea?.funderDecisions) &&
    idea.funderDecisions.some((d) => d?.decision === "accepted");

  const canOpenFundingRoom = (idea) => {
    // The room opens immediately after a funder accepts. Backend still validates ownership/access.
    if (!fundingRoomStatuses.includes(idea?.status) && !hasAcceptedFunder(idea)) return false;
    if (isAdmin) return true;
    // Innovator page only loads the logged-in user's ideas, so allow the owner to see the room after acceptance.
    if (isInnovator) return true;
    if (isFunder) return isSelectedFunderForIdea(idea) || hasAcceptedFunder(idea);
    return false;
  };
  const canSendFundingMessage = (idea) => canOpenFundingRoom(idea);

  const params = new URLSearchParams(location.search);
  const initialView =
    params.get("view") || (user?.role === "innovator" ? "submit" : "progress");

  const [activeView, setActiveView] = useState(initialView);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [ideas, setIdeas] = useState([]);
  const [q, setQ] = useState("");

  const [submitForm, setSubmitForm] = useState({ title: "", description: "" });
  const [ipFormFile, setIpFormFile] = useState(null);

  const [adminOpen, setAdminOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [adminStatus, setAdminStatus] = useState("");
  const [adminComment, setAdminComment] = useState("");
  const [activeReviewers, setActiveReviewers] = useState([]);
  const [activeFunders, setActiveFunders] = useState([]);
  const [presentFunderIds, setPresentFunderIds] = useState([]);
  const [assignIds, setAssignIds] = useState([]);
  const [selectedReviewerId, setSelectedReviewerId] = useState("");

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewScore, setReviewScore] = useState(7);
  const [reviewDecision, setReviewDecision] = useState("accepted");
  const [reviewComment, setReviewComment] = useState("");

  const [resubmitOpen, setResubmitOpen] = useState(false);
  const [resubmitIdea, setResubmitIdea] = useState(null);
  const [resubmitForm, setResubmitForm] = useState({ title: "", description: "" });
  const [resubmitFile, setResubmitFile] = useState(null);

  const [funderStatus, setFunderStatus] = useState("funding_pending");
  const [detailOpen, setDetailOpen] = useState(false);
  const [quickComment, setQuickComment] = useState("");
  const [fundingRoomOpen, setFundingRoomOpen] = useState(false);
  const [fundingMessage, setFundingMessage] = useState("");
  const [agreementForm, setAgreementForm] = useState({
    finalBudget: "",
    deadline: "",
    conditions: "",
    requiredDocuments: "",
    milestones: "",
  });
  const [liveConnected, setLiveConnected] = useState(false);
  const [lastLiveUpdate, setLastLiveUpdate] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const qp = new URLSearchParams(location.search);
    setActiveView(qp.get("view") || (user?.role === "innovator" ? "submit" : "progress"));
  }, [location.search, user?.role]);

  const filteredIdeas = useMemo(() => {
    if (!q.trim()) return ideas;
    const qq = q.toLowerCase();
    return ideas.filter(
      (i) =>
        (i.title || "").toLowerCase().includes(qq) ||
        (i.description || "").toLowerCase().includes(qq) ||
        (i.innovatorName || "").toLowerCase().includes(qq)
    );
  }, [ideas, q]);

  const ideaMetrics = useMemo(() => {
    const total = ideas.length;
    const activeReview = ideas.filter((item) =>
      ["submitted", "under_review", "with_reviewer", "reviewer_approved", "approved"].includes(item.status)
    ).length;
    const changesRequested = ideas.filter((item) =>
      ["admin_changes_requested", "reviewer_changes_requested"].includes(item.status)
    ).length;
    const funded = ideas.filter((item) =>
      ["resolved", "in_progress", "contract_signed", "contract_drafted", "funding_pending"].includes(item.status)
    ).length;

    return { total, activeReview, changesRequested, funded };
  }, [ideas]);

  const upsertIdea = (incoming) => {
    if (!incoming?._id) return;

    setIdeas((prev) => {
      const exists = prev.some((item) => item._id === incoming._id);
      const next = exists
        ? prev.map((item) => (item._id === incoming._id ? { ...item, ...incoming } : item))
        : [incoming, ...prev];

      return [...next].sort(
        (a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
      );
    });

    setSelectedIdea((prev) => (prev?._id === incoming._id ? { ...prev, ...incoming } : prev));
    setLastLiveUpdate(new Date().toISOString());
  };

  const fillAgreementForm = (agreement = {}) => {
    setAgreementForm({
      finalBudget: agreement.finalBudget || "",
      deadline: agreement.deadline ? String(agreement.deadline).slice(0, 10) : "",
      conditions: agreement.conditions || "",
      requiredDocuments: agreement.requiredDocuments || "",
      milestones: Array.isArray(agreement.milestones) ? agreement.milestones.join("\n") : "",
    });
  };

  const openFundingRoom = async (idea) => {
    if (!canOpenFundingRoom(idea)) {
      setErr("Funding communication opens only for the idea innovator, selected funder, or admin after a funder accepts the idea.");
      return;
    }
    setSelectedIdea(idea);
    fillAgreementForm(idea?.fundingAgreement || {});
    setFundingMessage("");
    setFundingRoomOpen(true);

    try {
      const res = await api.get(`/ideas/${idea._id}/messages`, { headers: authHeaders() });
      const latestIdea = res.data?.idea || { ...idea, messages: res.data?.messages || [], fundingAgreement: res.data?.fundingAgreement || idea?.fundingAgreement || {} };
      upsertIdea(latestIdea);
      setSelectedIdea(latestIdea);
      fillAgreementForm(latestIdea?.fundingAgreement || {});
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to open funding communication room");
    }
  };

  const sendFundingMessage = async () => {
    if (!selectedIdea?._id || !fundingMessage.trim()) return;
    if (!canSendFundingMessage(selectedIdea)) {
      setErr("Only the idea innovator, selected funder, or admin can send messages in this funding room.");
      return;
    }
    setErr("");
    try {
      const res = await api.post(
        `/ideas/${selectedIdea._id}/messages`,
        { message: fundingMessage.trim() },
        { headers: authHeaders() }
      );
      const updated = res.data?.idea || { ...selectedIdea, messages: res.data?.messages || [] };
      upsertIdea(updated);
      setSelectedIdea(updated);
      setFundingMessage("");
      setOkMsg("Message sent to the funding room");
      fetchIdeas();
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to send message");
    }
  };

  const saveFundingAgreement = async () => {
    if (!selectedIdea?._id) return;
    setErr("");
    try {
      const res = await api.patch(
        `/ideas/${selectedIdea._id}/funding-agreement`,
        agreementForm,
        { headers: authHeaders() }
      );
      const updated = res.data?.idea;
      if (updated) {
        upsertIdea(updated);
        setSelectedIdea(updated);
      }
      setOkMsg("Funding agreement saved and contract draft stage opened");
      fetchIdeas();
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to save agreement");
    }
  };

  const submitQuickComment = async () => {
    if (!selectedIdea?._id || !quickComment.trim()) return;
    setErr("");
    try {
      const res = await api.patch(
        `/ideas/${selectedIdea._id}/admin-review`,
        { status: selectedIdea.status, comment: quickComment.trim() },
        { headers: authHeaders() }
      );
      const updated = res.data?.idea;
      if (updated) upsertIdea(updated);
      setQuickComment("");
      setOkMsg("Comment added successfully");
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to add comment");
    }
  };

  const fetchIdeas = async () => {
    setErr("");
    setLoading(true);

    try {
      const endpoint = isInnovator
        ? "/ideas/my"
        : isReviewer
        ? "/reviewer/ideas"
        : isFunder
        ? "/funder/ideas"
        : "/ideas";

      const res = await api.get(endpoint, { headers: authHeaders() });
      let incomingIdeas = res.data?.ideas || [];

      if (isReviewer && incomingIdeas.length === 0) {
        const fallback = await api.get("/ideas", { headers: authHeaders() });
        const allIdeas = fallback.data?.ideas || [];

        incomingIdeas = allIdeas.filter((idea) => {
          const reviewerItems = Array.isArray(idea.assignedReviewerIds)
            ? idea.assignedReviewerIds
            : Array.isArray(idea.assignedReviewers)
            ? idea.assignedReviewers
            : [];

          return reviewerItems.some((item) => {
            const id = typeof item === "object" ? item._id : item;
            return String(id) === String(user?._id || user?.id);
          });
        });
      }

      setIdeas(incomingIdeas);
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to load ideas");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewers = async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get("/admin/users?role=reviewer&status=active", {
        headers: authHeaders(),
      });
      setActiveReviewers(res.data?.users || []);
    } catch {
      setActiveReviewers([]);
    }
    try {
      const funderRes = await api.get("/admin/funders/active", { headers: authHeaders() });
      setActiveFunders(funderRes.data?.funders || []);
    } catch {
      setActiveFunders([]);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    fetchIdeas();
    fetchReviewers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;

    fetchIdeas();
    const fallback = setInterval(fetchIdeas, 15000);

    const socket = io(API_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => setLiveConnected(true));
    socket.on("disconnect", () => setLiveConnected(false));
    socket.on("idea:updated", (incoming) => {
      if (!incoming?._id) return;

      const shouldInclude =
        user.role === "admin" ||
        (user.role === "innovator" && String(incoming.innovatorId) === String(user._id)) ||
        (user.role === "reviewer" &&
          Array.isArray(incoming.assignedReviewerIds) &&
          incoming.assignedReviewerIds.some((rid) => {
            const reviewerId = typeof rid === "object" ? rid?._id : rid;
            return String(reviewerId) === String(user._id);
          })) ||
        (user.role === "funder" &&
          ["presented_to_funders", "funding_pending", "contract_drafted", "contract_signed", "in_progress", "resolved"].includes(incoming.status));

      if (shouldInclude) {
        if (
          user.role === "reviewer" &&
          (Array.isArray(incoming.assignedReviewerIds) || Array.isArray(incoming.assignedReviewers))
        ) {
          const reviewerItems = Array.isArray(incoming.assignedReviewerIds)
            ? incoming.assignedReviewerIds
            : incoming.assignedReviewers;

          const matched = reviewerItems.some((item) => {
            const id = typeof item === "object" ? item._id : item;
            return String(id) === String(user._id);
          });

          if (matched) {
            setOkMsg(`New idea assigned: ${incoming.title}`);
          }
        }

        upsertIdea(incoming);
      }
    });

    return () => {
      clearInterval(fallback);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, user?.role]);

  const submitIdea = async (e) => {
    e?.preventDefault?.();
    setErr("");
    setOkMsg("");

    if (!submitForm.title || !submitForm.description) {
      setErr("Title and description are required");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", submitForm.title);
      formData.append("description", submitForm.description);
      if (ipFormFile) formData.append("ipForm", ipFormFile);

      await api.post("/ideas", formData, {
        headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
      });

      setSubmitForm({ title: "", description: "" });
      setIpFormFile(null);
      setOkMsg("Idea submitted successfully");
      await fetchIdeas();
      navigate("/ideas?view=progress");
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to submit idea");
    }
  };

  const openDetail = (idea) => {
    setSelectedIdea(idea);
    setQuickComment("");
    setDetailOpen(true);
  };

  const openAdmin = (idea) => {
    setSelectedIdea(idea);
    setQuickComment("");
    setAdminStatus(idea.status);
    setAdminComment("");

    const existingReviewerIds = (idea.assignedReviewerIds || []).map((r) =>
      typeof r === "object" ? r._id : r
    );

    setAssignIds(existingReviewerIds);
    setSelectedReviewerId(existingReviewerIds[0] || "");
    setAdminOpen(true);
  };

  const adminSave = async () => {
    setErr("");
    try {
      await api.patch(
        `/ideas/${selectedIdea._id}/admin-review`,
        { status: adminStatus, comment: adminComment },
        { headers: authHeaders() }
      );
      setAdminComment("");
      setOkMsg("Idea updated successfully");
      fetchIdeas();
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to update");
    }
  };

  const adminAssign = async () => {
    setErr("");

    const finalReviewerIds = [
      ...new Set(
        (assignIds.length ? assignIds : selectedReviewerId ? [selectedReviewerId] : []).filter(Boolean)
      ),
    ];

    if (finalReviewerIds.length === 0) {
      setErr("Please choose a reviewer before sending the idea.");
      return;
    }

    try {
      const res = await api.patch(
        `/ideas/${selectedIdea._id}/assign-reviewers`,
        { reviewerIds: finalReviewerIds },
        { headers: authHeaders() }
      );

      const updatedIdea = res.data?.idea;
      if (updatedIdea) {
        upsertIdea(updatedIdea);
      }

      setAssignIds(finalReviewerIds);
      setSelectedReviewerId(finalReviewerIds[0] || "");
      setOkMsg(res.data?.msg || "Idea sent to reviewer successfully");
      setAdminOpen(false);
      fetchIdeas();
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to assign");
    }
  };

  const adminPresent = async () => {
    setErr("");
    if (!presentFunderIds.length) {
      setErr("Select at least one approved funder before presenting the idea.");
      return;
    }
    if (!hasReviewerApproval(selectedIdea)) {
      setErr("The reviewer must review and approve this idea before you present it to funders.");
      return;
    }
    try {
      await api.patch(`/ideas/${selectedIdea._id}/present`, { funderIds: presentFunderIds }, { headers: authHeaders() });
      setOkMsg("Idea presented only to the selected approved funder(s).");
      fetchIdeas();
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to present");
    }
  };

  const openReview = (idea) => {
    setSelectedIdea(idea);
    setReviewScore(7);
    setReviewDecision("accepted");
    setReviewComment("");
    setReviewOpen(true);
  };

  const openResubmit = (idea) => {
    setResubmitIdea(idea);
    setResubmitForm({ title: idea.title || "", description: idea.description || "" });
    setResubmitFile(null);
    setResubmitOpen(true);
  };

  const submitReview = async () => {
    setErr("");
    try {
      await api.post(
        `/reviewer/ideas/${selectedIdea._id}/evaluation`,
        { score: Number(reviewScore), decision: reviewDecision, comments: reviewComment },
        { headers: authHeaders() }
      );
      setReviewOpen(false);
      setOkMsg(
        reviewDecision === "rejected"
          ? "Idea rejected successfully"
          : reviewDecision === "changes_requested"
          ? "Changes request sent successfully"
          : "Idea approved successfully"
      );
      fetchIdeas();
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to submit evaluation");
    }
  };

  const submitResubmission = async () => {
    setErr("");
    try {
      const formData = new FormData();
      formData.append("title", resubmitForm.title);
      formData.append("description", resubmitForm.description);
      if (resubmitFile) formData.append("ipForm", resubmitFile);

      await api.patch(`/ideas/${resubmitIdea._id}/resubmit`, formData, {
        headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
      });

      setResubmitOpen(false);
      setOkMsg("Idea resubmitted successfully");
      fetchIdeas();
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to resubmit idea");
    }
  };

  const submitFunderDecision = async (idea, decision) => {
    setErr("");
    try {
      const res = await api.patch(
        `/funder/ideas/${idea._id}/decision`,
        {
          decision,
          comment: decision === "accepted"
            ? "Accepted for funding discussion. Please open the communication room to agree on budget, conditions, documents, and milestones."
            : "Rejected by funder after review.",
        },
        { headers: authHeaders() }
      );
      const updated = res.data?.idea;
      if (updated) upsertIdea(updated);
      setOkMsg(decision === "accepted" ? "Idea accepted. Communication room is now open." : "Idea rejected by funder.");
      fetchIdeas();
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to save funder decision");
    }
  };

  const updateFundingStatus = async (idea) => {
    setErr("");
    try {
      await api.patch(
        `/funder/ideas/${idea._id}/status`,
        { status: funderStatus },
        { headers: authHeaders() }
      );
      setOkMsg("Funding status updated");
      fetchIdeas();
    } catch (e) {
      setErr(e.response?.data?.msg || "Failed to update");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #eef6ff 0%, #dfeeff 100%)" }}>
      <GuidedTour type={isInnovator ? "innovator" : isFunder ? "funder" : isReviewer ? "reviewer" : isAdmin ? "admin" : "innovator"} />
      <Container className="py-4 tour-ideas">
        {err && <Alert color="danger">{err}</Alert>}
        {okMsg && <Alert color="success">{okMsg}</Alert>}

        {activeView === "submit" && (
          <Card
            className="border-0 shadow-sm overflow-hidden mb-4"
            style={{
              borderRadius: 26,
              background: "linear-gradient(120deg, #0e2f57 0%, #164982 50%, #1f5fa8 100%)",
            }}
          >
            <CardBody style={{ padding: 0 }}>
              <Row className="g-0 align-items-stretch">
                <Col lg="7" style={{ padding: "34px 34px 30px" }}>
                  <div className="d-flex align-items-center justify-content-between gap-2 mb-3 flex-wrap">
                    <div>
                      <div
                        style={{
                          color: "#d9ecff",
                          fontSize: 14,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        SparkUp Ideas Center
                      </div>
                      <h2 style={{ color: "#fff", fontWeight: 800, marginBottom: 10 }}>
                        Submit ideas and track your innovation journey
                      </h2>
                      <p
                        style={{
                          color: "rgba(255,255,255,0.88)",
                          maxWidth: 560,
                          marginBottom: 0,
                        }}
                      >
                        Create your idea, attach your IP form, and follow each stage from submission to funding in one clear space.
                      </p>
                    </div>

                    <div className="d-flex gap-2">
                      <Button color="info" onClick={() => navigate("/notifications")}>
                        Notifications
                      </Button>
                      <Button color="light" onClick={() => navigate(-1)}>
                        Back
                      </Button>
                    </div>
                  </div>

                  {isInnovator ? (
                    <Card
                      className="border-0"
                      style={{
                        borderRadius: 22,
                        background: "rgba(255,255,255,0.96)",
                        boxShadow: "0 18px 40px rgba(6, 26, 56, 0.18)",
                        marginTop: 26,
                      }}
                    >
                      <CardBody style={{ padding: 28 }}>
                        <div className="d-flex justify-content-between gap-3 align-items-start flex-wrap mb-3">
                          <div>
                            <h3
                              style={{
                                fontWeight: 800,
                                color: "#102846",
                                marginBottom: 6,
                              }}
                            >
                              Submit Idea + IP Form
                            </h3>
                            <p style={{ color: "#6481a6", marginBottom: 0 }}>Innovator workflow</p>
                          </div>

                          <div
                            style={{
                              background: "linear-gradient(135deg, #fff3e0, #ffe2bf)",
                              color: "#b36a06",
                              borderRadius: 999,
                              padding: "8px 14px",
                              fontWeight: 700,
                              fontSize: 13,
                            }}
                          >
                            Safe submission
                          </div>
                        </div>

                        <Form onSubmit={submitIdea}>
                          <FormGroup className="mb-3">
                            <Label
                              style={{
                                color: "#0f2747",
                                fontSize: 17,
                                fontWeight: 700,
                              }}
                            >
                              Title
                            </Label>
                            <Input
                              type="text"
                              value={submitForm.title}
                              onChange={(e) => setSubmitForm((f) => ({ ...f, title: e.target.value }))}
                              placeholder="Enter your idea title"
                              style={{
                                minHeight: 50,
                                borderRadius: 14,
                                borderColor: "#d9e5f2",
                              }}
                            />
                          </FormGroup>

                          <FormGroup className="mb-3">
                            <Label
                              style={{
                                color: "#0f2747",
                                fontSize: 17,
                                fontWeight: 700,
                              }}
                            >
                              Description
                            </Label>
                            <Input
                              type="textarea"
                              value={submitForm.description}
                              onChange={(e) =>
                                setSubmitForm((f) => ({
                                  ...f,
                                  description: e.target.value,
                                }))
                              }
                              placeholder="Explain your idea and its value"
                              style={{
                                minHeight: 130,
                                borderRadius: 14,
                                borderColor: "#d9e5f2",
                              }}
                            />
                          </FormGroup>

                          <FormGroup className="mb-4">
                            <div
                              style={{
                                background: "linear-gradient(180deg, #f8fbff, #ffffff)",
                                border: "1px solid #dbe7ff",
                                borderRadius: 18,
                                padding: 18,
                                boxShadow: "0 12px 28px rgba(16, 40, 70, 0.06)",
                              }}
                            >
                              <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-2">
                                <div>
                                  <Label
                                    style={{
                                      color: "#0f2747",
                                      fontSize: 17,
                                      fontWeight: 800,
                                      marginBottom: 6,
                                    }}
                                  >
                                    IP Form (Required)
                                  </Label>
                                  <p style={{ color: "#6481a6", marginBottom: 0, fontSize: 14 }}>
                                    Download the SparkUp IP protection form, fill it, then upload it before submitting your idea.
                                  </p>
                                </div>

                                <a
                                  href="/files/SparkUp_IP_Form.pdf"
                                  download
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 8,
                                    background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
                                    color: "#fff",
                                    padding: "11px 16px",
                                    borderRadius: 12,
                                    textDecoration: "none",
                                    fontWeight: 800,
                                    boxShadow: "0 10px 25px rgba(37,99,235,0.22)",
                                  }}
                                >
                                  Download IP Form
                                </a>
                              </div>

                              <div
                                style={{
                                  marginTop: 14,
                                  background: "#fff",
                                  border: "2px dashed #bfd3ff",
                                  borderRadius: 14,
                                  padding: 16,
                                }}
                              >
                                <Label
                                  style={{
                                    display: "block",
                                    marginBottom: 10,
                                    color: "#123a74",
                                    fontWeight: 700,
                                  }}
                                >
                                  Upload completed IP Form
                                </Label>
                                <Input
                                  type="file"
                                  accept=".pdf,image/*"
                                  required
                                  onChange={(e) => setIpFormFile(e.target.files?.[0] || null)}
                                  style={{
                                    borderRadius: 14,
                                    borderColor: "#d9e5f2",
                                  }}
                                />
                              </div>
                            </div>
                          </FormGroup>

                          <Button
                            type="submit"
                            style={{
                              background: "linear-gradient(135deg, #f79c2e, #ffbf6d)",
                              border: "none",
                              borderRadius: 14,
                              padding: "12px 24px",
                              fontSize: 16,
                              fontWeight: 800,
                              boxShadow: "0 14px 24px rgba(247, 156, 46, 0.28)",
                            }}
                          >
                            Submit Idea
                          </Button>
                        </Form>
                      </CardBody>
                    </Card>
                  ) : null}
                </Col>

                <Col
                  lg="5"
                  style={{
                    minHeight: 420,
                    backgroundImage: `linear-gradient(180deg, rgba(8,27,51,0.10), rgba(8,27,51,0.02)), url(${ideaBoardBg})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "end",
                      padding: 28,
                    }}
                  >
                    <div
                      style={{
                        background: "rgba(255,255,255,0.14)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(255,255,255,0.18)",
                        borderRadius: 22,
                        padding: 20,
                        color: "#211b30",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 28,
                          fontWeight: 800,
                          lineHeight: 1.2,
                          marginTop: 8,
                        }}
                      >
                        From submission to funding, every step is visible.
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </CardBody>
          </Card>
        )}

        {activeView === "progress" && (
          <div>
            <Card
              className="border-0 shadow-sm overflow-hidden mb-4"
              style={{
                borderRadius: 28,
                background: "linear-gradient(135deg, #0f2747 0%, #18457f 50%, #1e67c7 100%)",
                color: "#fff",
              }}
            >
              <CardBody style={{ padding: 28 }}>
                <Row className="g-4 align-items-center">
                  <Col lg="7">
                    <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
                      <div
                        style={{
                          color: "rgba(255,255,255,0.78)",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          fontSize: 12,
                        }}
                      >
                        {isAdmin
                          ? "Admin idea workspace"
                          : isReviewer
                          ? "Reviewer command center"
                          : isFunder
                          ? "Funder idea workspace"
                          : "Creative tracking"}
                      </div>
                      <div className={`ideas-live-chip ${liveConnected ? "connected" : ""}`}>
                        {liveConnected ? "Live sync on" : "Sync reconnecting"}
                      </div>
                    </div>

                    <h2
                      style={{
                        color: "#ffffff",
                        fontWeight: 900,
                        fontSize: "2.2rem",
                        lineHeight: 1.15,
                        marginBottom: 12,
                      }}
                    >
                      {isAdmin
                        ? "Review ideas in one clean command center."
                        : isReviewer
                        ? "Review assigned ideas in one premium workspace."
                        : isFunder
                        ? "Track promising ideas ready for funding."
                        : "My Ideas & Progress"}
                    </h2>

                    <p
                      style={{
                        color: "rgba(255,255,255,0.86)",
                        maxWidth: 720,
                        fontSize: "1rem",
                        lineHeight: 1.75,
                        marginBottom: 0,
                      }}
                    >
                      {isAdmin
                        ? "A simplified list-first layout for SparkUp. See innovator profile, contact details, status, comments, and submitted files without the extra top images."
                        : isReviewer
                        ? "Open your assigned queue, inspect each brief quickly, and submit a clear professional decision with a cleaner premium layout."
                        : isFunder
                        ? "Browse visible ideas in a cleaner interface with stronger focus on profile details, progress, and funding actions."
                        : "Track every idea from submission to funding in one elegant dashboard with clearer cards and easier file access."}
                    </p>
                  </Col>

                  <Col lg="5">
                    <Row className="g-3">
                      <Col xs="6">
                        <div className="ideas-metric-card">
                          <div className="ideas-metric-label">Total ideas</div>
                          <div className="ideas-metric-value">{ideaMetrics.total}</div>
                        </div>
                      </Col>
                      <Col xs="6">
                        <div className="ideas-metric-card">
                          <div className="ideas-metric-label">{isFunder ? "Funding stage" : isReviewer ? "Ready to review" : "In review"}</div>
                          <div className="ideas-metric-value">
                            {isFunder ? ideaMetrics.funded : ideaMetrics.activeReview}
                          </div>
                        </div>
                      </Col>
                      <Col xs="6">
                        <div className="ideas-metric-card">
                          <div className="ideas-metric-label">Changes needed</div>
                          <div className="ideas-metric-value">{isReviewer ? ideas.filter((item) => ["reviewer_changes_requested", "rejected"].includes(item.status)).length : ideaMetrics.changesRequested}</div>
                        </div>
                      </Col>
                      <Col xs="6">
                        <div className="ideas-metric-card">
                          <div className="ideas-metric-label">Last sync</div>
                          <div className="ideas-metric-mini">
                            {lastLiveUpdate
                              ? new Date(lastLiveUpdate).toLocaleTimeString([], {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })
                              : "Just now"}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </CardBody>
            </Card>

            <Card
              className="shadow-sm border-0 mb-4"
              style={{
                borderRadius: 20,
                background: "rgba(255,255,255,0.88)",
                backdropFilter: "blur(10px)",
              }}
            >
              <CardBody style={{ padding: 20 }}>
                <Row className="g-3 align-items-center">
                  <Col lg="7">
                    <Input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder={
                        isInnovator
                          ? "Search your ideas, descriptions, or progress..."
                          : "Search ideas by title, description, or innovator..."
                      }
                      style={{
                        minHeight: 52,
                        borderRadius: 16,
                        borderColor: "#d7e4f3",
                        boxShadow: "none",
                      }}
                    />
                  </Col>

                  <Col lg="5">
                    <div className="d-flex justify-content-lg-end gap-2 flex-wrap">
                      {isInnovator && (
                        <Button
                          color="light"
                          onClick={() => navigate("/ideas?view=submit")}
                          style={{
                            borderRadius: 14,
                            fontWeight: 700,
                            padding: "10px 18px",
                            border: "1px solid #d7e4f3",
                          }}
                        >
                          Submit New Idea
                        </Button>
                      )}

                      {isAdmin && (
                        <Button
                          color="primary"
                          onClick={() => navigate("/funding")}
                          style={{
                            borderRadius: 14,
                            fontWeight: 700,
                            padding: "10px 18px",
                          }}
                        >
                          Funding & Contracts
                        </Button>
                      )}
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>

            {loading ? (
              <div className="text-center py-5">
                <Spinner />
              </div>
            ) : filteredIdeas.length === 0 ? (
              <Alert color="info">{isReviewer ? "No assigned ideas yet. Ask the admin to assign an idea to your reviewer account." : "No ideas found for your account."}</Alert>
            ) : (
              <div style={{ display: "grid", gap: 18 }}>
                {filteredIdeas.map((idea, index) =>
                  isInnovator ? (
                    <InnovatorTrackingCard
                      key={idea._id}
                      idea={idea}
                      index={index}
                      onOpenDetail={openDetail}
                      onOpenResubmit={openResubmit}
                      canOpenFundingRoom={canOpenFundingRoom}
                      onOpenFundingRoom={openFundingRoom}
                    />
                  ) : (
                  <Card
                    key={idea._id}
                    className="border-0 shadow-sm idea-sequence-card"
                    style={{
                      borderRadius: 26,
                      overflow: "hidden",
                      background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
                      border: "1px solid #deebfb",
                      cursor: "pointer",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openDetail(idea);
                    }}
                  >
                    <CardBody style={{ padding: 24 }}>
                      <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap mb-3">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <div className="idea-sequence-chip">Idea #{index + 1}</div>
                          <div
                            style={{
                              background: "#f2f7ff",
                              color: "#56779e",
                              borderRadius: 999,
                              padding: "7px 12px",
                              fontSize: 12,
                              fontWeight: 700,
                              border: "1px solid #dfebfa",
                            }}
                          >
                            Updated {formatIdeaDate(idea.updatedAt || idea.createdAt)}
                          </div>
                        </div>

                        <div
                          style={{
                            background: "#edf4ff",
                            color: "#295d9c",
                            borderRadius: 999,
                            padding: "10px 16px",
                            fontWeight: 800,
                            fontSize: 13,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {getProgressPercent(idea.status)}% complete
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-start gap-4 flex-wrap mb-3">
                        <div style={{ flex: 1, minWidth: 320 }}>
                          <div className="d-flex align-items-start gap-3 mb-2">
                            <div
                              className="idea-avatar-shell"
                              style={{
                                width: 58,
                                height: 58,
                                borderRadius: "50%",
                                overflow: "hidden",
                                background: "#dbe8fb",
                                display: "grid",
                                placeItems: "center",
                                color: "#1a4e8a",
                                fontWeight: 800,
                                flexShrink: 0,
                              }}
                            >
                              {idea.innovatorImageUrl ? (
                                <img
                                  src={normalizeAssetUrl(idea.innovatorImageUrl)}
                                  alt={idea.innovatorName || "Innovator"}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              ) : (
                                (idea.innovatorName || "I").charAt(0).toUpperCase()
                              )}
                            </div>

                            <div style={{ flex: 1 }}>
                              <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                                <h4
                                  className="m-0"
                                  style={{
                                    color: "#102846",
                                    fontWeight: 800,
                                    fontSize: "1.45rem",
                                  }}
                                >
                                  {idea.title}
                                </h4>

                                <Badge
                                  color={statusColor(idea.status)}
                                  pill
                                  className="text-uppercase"
                                  style={{
                                    fontSize: "0.72rem",
                                    padding: "8px 12px",
                                  }}
                                >
                                  {STATUS_LABELS[idea.status] || idea.status}
                                </Badge>
                              </div>

                              <div
                                style={{
                                  color: "#557395",
                                  fontSize: 13,
                                  fontWeight: 600,
                                  marginBottom: 10,
                                }}
                              >
                                {idea.innovatorName || "Unknown innovator"}
                                {idea.innovatorEmail ? ` • ${idea.innovatorEmail}` : ""}
                              </div>

                              <div
                                style={{
                                  color: "#5d7698",
                                  fontSize: 15,
                                  lineHeight: 1.7,
                                  maxWidth: 900,
                                }}
                              >
                                {idea.description}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {isInnovator && (
                        <div style={{ marginBottom: 14 }}>
                          <AdvancedTrackingPanel idea={idea} compact />
                        </div>
                      )}

                      <div
                        className="small"
                        style={{
                          color: "#476585",
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "10px 18px",
                          marginTop: 10,
                          background: "#f7faff",
                          border: "1px solid #e3edf8",
                          borderRadius: 16,
                          padding: 14,
                        }}
                      >
                        <span>
                          <b>Innovator:</b> {idea.innovatorName || idea.innovatorId?.name || "—"}
                        </span>

                        {(isFunder || isAdmin) && idea.innovatorEmail ? (
                          <span>
                            <b>Email:</b> {idea.innovatorEmail}
                          </span>
                        ) : null}

                        {(isFunder || isAdmin) && idea.innovatorPhone ? (
                          <span>
                            <b>Contact:</b> {idea.innovatorPhone}
                          </span>
                        ) : null}

                        {idea.ipFormUrl ? (
                          <span>
                            <b>IP Form:</b>{" "}
                            <a
                              href={normalizeAssetUrl(idea.ipFormUrl)}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontWeight: 700 }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              Open File
                            </a>
                          </span>
                        ) : null}
                      </div>

                      {idea.assignedReviewers?.length ? (
                        <div className="small mt-3" style={{ color: "#476585" }}>
                          <b>Assigned reviewers:</b> {idea.assignedReviewers.map((r) => r.name).join(", ")}
                        </div>
                      ) : null}

                      {idea.evaluations?.length ? (
                        <div className="small mt-3">
                          <b style={{ color: "#102846" }}>Evaluations:</b>
                          <ul className="mb-0 mt-2 ps-3" style={{ color: "#5c789d" }}>
                            {idea.evaluations.map((ev) => (
                              <li key={ev._id || `${ev.reviewerId}-${ev.createdAt}`}>
                                {ev.reviewerName || "Reviewer"}:{" "}
                                {ev.decision === "changes_requested"
                                  ? "changes requested"
                                  : ev.decision === "rejected"
                                  ? "rejected"
                                  : "approved"}, score {ev.score} — {ev.comments || "No comment"}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      <div className="small mt-3" style={{ color: "#173d6b", fontWeight: 600 }}>
                        Next step: {getNextStepText(idea, user?.role)}
                      </div>

                      {idea.adminComments?.length ? (
                        <div className="small mt-3">
                          <b style={{ color: "#102846" }}>Admin comments:</b>
                          <ul className="mb-0 mt-2 ps-3" style={{ color: "#5c789d" }}>
                            {idea.adminComments.map((c, idx) => (
                              <li key={`${c.createdAt || idx}-${idx}`}>{c.comment}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      <div className="d-flex gap-2 align-items-start flex-wrap mt-3">
                        <Button
                          size="sm"
                          color="light"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetail(idea);
                          }}
                          style={{
                            borderRadius: 12,
                            fontWeight: 700,
                            border: "1px solid #d4e3f6",
                          }}
                        >
                          View Details
                        </Button>

                        {isAdmin && (
                          <Button
                            size="sm"
                            color="warning"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAdmin(idea);
                            }}
                            style={{ borderRadius: 12, fontWeight: 700 }}
                          >
                            Manage
                          </Button>
                        )}

                        {isInnovator &&
                          ["admin_changes_requested", "reviewer_changes_requested"].includes(idea.status) && (
                            <Button
                              size="sm"
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                openResubmit(idea);
                              }}
                              style={{ borderRadius: 12, fontWeight: 700 }}
                            >
                              Update & Resubmit
                            </Button>
                          )}

                        {canReviewerManageIdea(idea) && (
                          <Button
                            size="sm"
                            color="success"
                            onClick={(e) => {
                              e.stopPropagation();
                              openReview(idea);
                            }}
                            style={{ borderRadius: 12, fontWeight: 700 }}
                          >
                            Manage Review
                          </Button>
                        )}

                        {isFunder && (
                          <>
                            {idea.status === "presented_to_funders" && (
                              <>
                                <Button
                                  size="sm"
                                  color="success"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    submitFunderDecision(idea, "accepted");
                                  }}
                                  style={{ borderRadius: 12, fontWeight: 700 }}
                                >
                                  Accept for Funding
                                </Button>
                                <Button
                                  size="sm"
                                  color="danger"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    submitFunderDecision(idea, "rejected");
                                  }}
                                  style={{ borderRadius: 12, fontWeight: 700 }}
                                >
                                  Reject
                                </Button>
                              </>
                            )}

                            {canOpenFundingRoom(idea) && (
                              <Button
                                size="sm"
                                color="warning"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openFundingRoom(idea);
                                }}
                                style={{ borderRadius: 12, fontWeight: 800 }}
                              >
                                Communication Room
                              </Button>
                            )}

                            <Input
                              type="select"
                              value={funderStatus}
                              onChange={(e) => {
                                e.stopPropagation();
                                setFunderStatus(e.target.value);
                              }}
                              style={{ borderRadius: 12, minWidth: 180 }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="funding_pending">Funding Pending</option>
                              <option value="contract_drafted">Contract Drafted</option>
                              <option value="contract_signed">Contract Signed</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                            </Input>

                            <Button
                              size="sm"
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateFundingStatus(idea);
                              }}
                              style={{ borderRadius: 12, fontWeight: 700 }}
                            >
                              Update Status
                            </Button>
                          </>
                        )}

                        {(isInnovator || isAdmin) && canOpenFundingRoom(idea) && (
                          <Button
                            size="sm"
                            color="warning"
                            onClick={(e) => {
                              e.stopPropagation();
                              openFundingRoom(idea);
                            }}
                            style={{ borderRadius: 12, fontWeight: 800 }}
                          >
                            {isInnovator ? "Chat with Funder" : "Funding Communication"}
                          </Button>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </Container>

      <Modal
        isOpen={detailOpen}
        toggle={() => setDetailOpen(false)}
        size="lg"
        centered
        modalClassName="idea-detail-modal"
      >
        <ModalHeader toggle={() => setDetailOpen(false)}>{isReviewer ? "Review Brief" : "Idea Details"}</ModalHeader>
        <ModalBody>
          {selectedIdea ? (
            <div>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    overflow: "hidden",
                    background: "#dbe8fb",
                    display: "grid",
                    placeItems: "center",
                    color: "#1a4e8a",
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {selectedIdea.innovatorImageUrl ? (
                    <img
                      src={normalizeAssetUrl(selectedIdea.innovatorImageUrl)}
                      alt={selectedIdea.innovatorName || "Innovator"}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    (selectedIdea.innovatorName || "I").charAt(0).toUpperCase()
                  )}
                </div>

                <div>
                  <div style={{ fontWeight: 800, color: "#102846" }}>
                    {selectedIdea.innovatorName || "Innovator"}
                  </div>
                  <div style={{ color: "#5d7698", fontSize: 14 }}>{selectedIdea.innovatorEmail || ""}</div>
                </div>
              </div>

              <div style={{ fontWeight: 800, fontSize: 22, color: "#102846", marginBottom: 10 }}>
                {selectedIdea.title}
              </div>
              <div style={{ color: "#4c6889", lineHeight: 1.8, marginBottom: 18 }}>
                {selectedIdea.description}
              </div>

              <div className="mb-3"><AdvancedTrackingPanel idea={selectedIdea} /></div>

              {selectedIdea.ipFormUrl ? (
                <div className="mb-3 idea-file-box">
                  <div>
                    <div style={{ fontWeight: 800, color: "#102846" }}>Submitted file</div>
                    <div style={{ color: "#6985a8", fontSize: 13 }}>IP form uploaded by the innovator</div>
                  </div>
                  <a
                    href={normalizeAssetUrl(selectedIdea.ipFormUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="idea-file-link"
                  >
                    Open file
                  </a>
                </div>
              ) : null}

              <div style={{ marginBottom: 12, fontWeight: 700, color: "#173d6b" }}>Admin comments</div>
              {selectedIdea.adminComments?.length ? (
                <div style={{ display: "grid", gap: 10 }}>
                  {selectedIdea.adminComments.map((c, idx) => (
                    <div
                      key={`${c.createdAt || idx}-${idx}`}
                      style={{
                        background: "#f7fbff",
                        border: "1px solid #e2edf9",
                        borderRadius: 14,
                        padding: 12,
                      }}
                    >
                      <div style={{ color: "#4e6788" }}>{c.comment}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: "#7a8faa" }}>No admin comments yet.</div>
              )}

              {isAdmin ? (
                <div className="mt-4">
                  <div style={{ fontWeight: 800, color: "#102846", marginBottom: 10 }}>
                    Add comment for innovator
                  </div>
                  <Input
                    type="textarea"
                    value={quickComment}
                    onChange={(e) => setQuickComment(e.target.value)}
                    placeholder="Write a clear comment that will appear in the innovator tracking page..."
                    style={{ minHeight: 96, borderRadius: 16, borderColor: "#dbe6f5" }}
                  />
                  <div className="d-flex justify-content-end mt-3">
                    <Button color="primary" onClick={submitQuickComment} style={{ borderRadius: 12, fontWeight: 700 }}>
                      Send Comment
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setDetailOpen(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={adminOpen} toggle={() => setAdminOpen(false)} size="xl" centered>
        <ModalBody style={{ padding: 0, borderRadius: 24, overflow: "hidden", background: "#ffffff" }}>
          <div style={{ padding: "22px 26px", borderBottom: "1px solid #e7eef8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 46, height: 46, borderRadius: 16, background: "linear-gradient(135deg,#eaf3ff,#f5f9ff)", display: "grid", placeItems: "center", fontSize: 22, border: "1px solid #d8e8ff" }}>📋</div>
              <div>
                <h4 style={{ margin: 0, fontWeight: 900, color: "#102846" }}>Manage Idea</h4>
                <div style={{ color: "#6b7f9b", fontWeight: 600 }}>Review, assign, and move this idea forward in the CAT A workflow.</div>
              </div>
            </div>
            <button type="button" onClick={() => setAdminOpen(false)} style={{ border: "1px solid #d8e2ef", background: "#fff", width: 42, height: 42, borderRadius: 12, fontSize: 24, color: "#64748b", lineHeight: 1 }}>×</button>
          </div>

          <div style={{ padding: 26 }}>
            <div style={{ border: "1px solid #dfe9f6", borderRadius: 20, padding: 18, marginBottom: 22, display: "grid", gridTemplateColumns: "80px 1fr", gap: 16, alignItems: "center", background: "linear-gradient(180deg,#ffffff,#fbfdff)" }}>
              <div style={{ width: 72, height: 72, borderRadius: 22, background: "#eef6ff", display: "grid", placeItems: "center", fontSize: 34 }}>💡</div>
              <div>
                <h5 style={{ margin: "0 0 12px", fontWeight: 900, color: "#0f2747" }}>{selectedIdea?.title}</h5>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>Current Status</div>
                    <Badge color={statusColor(adminStatus)} pill style={{ padding: "7px 12px", marginTop: 5 }}>{STATUS_LABELS[adminStatus] || adminStatus}</Badge>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>Idea ID</div>
                    <div style={{ fontWeight: 800, color: "#1e3a5f", marginTop: 5 }}>#{String(selectedIdea?._id || "IDEA").slice(-8).toUpperCase()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>Submitted</div>
                    <div style={{ fontWeight: 800, color: "#1e3a5f", marginTop: 5 }}>{selectedIdea?.createdAt ? new Date(selectedIdea.createdAt).toLocaleDateString() : "Not available"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>Innovator</div>
                    <div style={{ fontWeight: 800, color: "#1e3a5f", marginTop: 5 }}>{selectedIdea?.innovatorId?.name || selectedIdea?.innovatorName || "Innovator"}</div>
                  </div>
                </div>
              </div>
            </div>

            <Row className="g-4">
              <Col md="6">
                <div style={{ fontWeight: 900, color: "#102846", marginBottom: 10 }}>1. Update Status</div>
                <Input type="select" value={adminStatus} onChange={(e) => setAdminStatus(e.target.value)} style={{ height: 52, borderRadius: 14, borderColor: "#dbe6f5", fontWeight: 700 }}>
                  <option value="submitted">Submitted to Admin</option>
                  <option value="admin_changes_requested">Admin Asked for Changes</option>
                  <option value="with_reviewer">With Reviewer</option>
                  <option value="reviewer_changes_requested">Reviewer Asked for Changes</option>
                  <option value="reviewer_approved">Reviewer Approved</option>
                  <option value="presented_to_funders">Presented to Funder</option>
                  <option value="funding_pending">Funding Pending</option>
                  <option value="contract_drafted">Contract Drafted</option>
                  <option value="contract_signed">Contract Signed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Funded / Completed</option>
                  <option value="rejected">Rejected</option>
                </Input>

                <div style={{ fontWeight: 900, color: "#102846", margin: "22px 0 10px" }}>3. Assign Reviewer</div>
                <Input type="select" value={selectedReviewerId} onChange={(e) => { const value = e.target.value; setSelectedReviewerId(value); setAssignIds(value ? [value] : []); }} style={{ minHeight: 58, borderRadius: 14, borderColor: "#dbe6f5", fontWeight: 700 }}>
                  <option value="">Choose reviewer by specialization</option>
                  {activeReviewers.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name} ({r.email}) — {r.specialization || "General reviewer"}
                    </option>
                  ))}
                </Input>

                {selectedReviewerId ? (
                  <div style={{ marginTop: 12, border: "1px solid #dbeafe", borderRadius: 16, padding: 14, background: "#f8fbff" }}>
                    {(() => {
                      const reviewer = activeReviewers.find((r) => String(r._id) === String(selectedReviewerId));
                      return (
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#ede9fe", color: "#6d28d9", display: "grid", placeItems: "center", fontWeight: 900 }}>{(reviewer?.name || "R").slice(0,1).toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 900, color: "#12385f" }}>{reviewer?.name || "Selected reviewer"} <span style={{ color: "#64748b", fontWeight: 700 }}>({reviewer?.email || ""})</span></div>
                            <div style={{ color: "#6d28d9", fontSize: 13, fontWeight: 800 }}>Specialization: {reviewer?.specialization || "Not added yet"}</div>
                            <Badge color="success" pill style={{ marginTop: 6 }}>Active Reviewer</Badge>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : null}
              </Col>

              <Col md="6">
                <div style={{ fontWeight: 900, color: "#102846", marginBottom: 10 }}>2. Admin Comment (optional)</div>
                <Input type="textarea" value={adminComment} onChange={(e) => setAdminComment(e.target.value)} placeholder="Write a clear comment for the innovator or reviewer..." style={{ minHeight: 172, borderRadius: 14, borderColor: "#dbe6f5", resize: "vertical" }} />
                <div style={{ textAlign: "right", color: "#64748b", fontWeight: 700, fontSize: 12, marginTop: 6 }}>{adminComment.length}/500</div>
              </Col>
            </Row>

            <div style={{ marginTop: 22, border: "1px solid #dbeafe", borderRadius: 18, padding: 18, background: "#fbfdff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontWeight: 900, color: "#102846" }}>4. Select Approved Funder(s) Before Presenting</div>
                <Badge color="primary" pill>{presentFunderIds.length} selected</Badge>
              </div>

              {activeFunders.length > 0 ? (
                <div style={{ border: "1px solid #e2eaf5", borderRadius: 14, overflow: "hidden", background: "#fff" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.7fr 1fr 80px", padding: "12px 14px", background: "#f8fafc", fontWeight: 900, color: "#334155", fontSize: 13 }}>
                    <div>Funder</div><div>Email</div><div>Status</div><div>Select</div>
                  </div>
                  {activeFunders.map((f) => (
                    <label key={f._id} style={{ display: "grid", gridTemplateColumns: "1.2fr 1.7fr 1fr 80px", padding: "13px 14px", alignItems: "center", borderTop: "1px solid #eef2f7", margin: 0 }}>
                      <div style={{ fontWeight: 800, color: "#1e3a5f" }}>{f.name}</div>
                      <div style={{ color: "#475569" }}>{f.email}</div>
                      <div><Badge color="success" pill>✓ Approved</Badge></div>
                      <div><input type="checkbox" checked={presentFunderIds.includes(f._id)} onChange={(e) => setPresentFunderIds((prev) => e.target.checked ? [...new Set([...prev, f._id])] : prev.filter((id) => id !== f._id))} /></div>
                    </label>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 16, borderRadius: 14, background: "#fff7ed", color: "#9a3412", fontWeight: 800 }}>No approved funders available yet.</div>
              )}

              <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 12, background: hasReviewerApproval(selectedIdea) ? "#eff6ff" : "#fff7ed", color: hasReviewerApproval(selectedIdea) ? "#1d4ed8" : "#9a3412", fontWeight: 700, border: hasReviewerApproval(selectedIdea) ? "1px solid #bfdbfe" : "1px solid #fed7aa" }}>
                {hasReviewerApproval(selectedIdea)
                  ? "ℹ Only approved funders can be selected to maintain platform quality and trust."
                  : "⚠ Reviewer approval is required first. Send the idea to a reviewer, then present it to funders after approval."}
              </div>
            </div>

            <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ border: "1px solid #e2eaf5", borderRadius: 16, padding: 14, background: "#f8fbff" }}>
                <div style={{ color: "#0d6efd", fontWeight: 900 }}>Selected Reviewer</div>
                {(() => {
                  const reviewer = activeReviewers.find((r) => String(r._id) === String(selectedReviewerId));
                  return <div style={{ color: "#475569", marginTop: 6, fontWeight: 700 }}>{reviewer ? `${reviewer.name} (${reviewer.email}) — ${reviewer.specialization || "No specialization added"}` : "No reviewer selected yet"}</div>;
                })()}
              </div>
              <div style={{ border: "1px solid #e2eaf5", borderRadius: 16, padding: 14, background: "#f8fbff" }}>
                <div style={{ color: "#0d6efd", fontWeight: 900 }}>Selected Funder(s)</div>
                <div style={{ color: "#475569", marginTop: 6, fontWeight: 700 }}>{presentFunderIds.length ? `${presentFunderIds.length} approved funder(s) selected` : "No funder selected yet"}</div>
              </div>
            </div>

            <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 14 }}>
              <Button color="primary" outline onClick={adminSave} style={{ borderRadius: 16, padding: "18px 10px", fontWeight: 900 }}>💾<br />Save Review<br /><small style={{ fontWeight: 600 }}>Save without notifying</small></Button>
              <Button color="warning" outline onClick={async () => { setAdminStatus("admin_changes_requested"); await api.patch(`/ideas/${selectedIdea._id}/admin-review`, { status: "admin_changes_requested", comment: adminComment, sendBackToInnovator: true }, { headers: authHeaders() }); setOkMsg("Idea returned to innovator"); setAdminOpen(false); fetchIdeas(); }} style={{ borderRadius: 16, padding: "18px 10px", fontWeight: 900 }}>↩<br />Return to Innovator<br /><small style={{ fontWeight: 600 }}>Ask for changes</small></Button>
              <Button color="secondary" outline onClick={adminAssign} disabled={!selectedReviewerId} style={{ borderRadius: 16, padding: "18px 10px", fontWeight: 900 }}>✉<br />Send to Reviewer<br /><small style={{ fontWeight: 600 }}>Notify selected reviewer</small></Button>
              <Button color="success" outline onClick={adminPresent} disabled={!presentFunderIds.length || !hasReviewerApproval(selectedIdea)} style={{ borderRadius: 16, padding: "18px 10px", fontWeight: 900 }}>➤<br />Present to Funder<br /><small style={{ fontWeight: 600 }}>{hasReviewerApproval(selectedIdea) ? "Send to approved funder" : "Waiting for reviewer approval"}</small></Button>
            </div>
          </div>

          <div style={{ padding: "16px 26px", borderTop: "1px solid #e7eef8", display: "flex", justifyContent: "flex-end", gap: 10, background: "#fbfdff" }}>
            <Button color="light" onClick={() => setAdminOpen(false)} style={{ borderRadius: 12, fontWeight: 800 }}>Cancel</Button>
            <Button color="primary" onClick={adminSave} style={{ borderRadius: 12, fontWeight: 900, padding: "10px 20px" }}>✓ Save Changes</Button>
          </div>
        </ModalBody>
      </Modal>

      <Modal isOpen={resubmitOpen} toggle={() => setResubmitOpen(false)}>
        <ModalHeader toggle={() => setResubmitOpen(false)}>Update & Resubmit Idea</ModalHeader>
        <ModalBody>
          <label className="small">Title</label>
          <Input
            type="text"
            value={resubmitForm.title}
            onChange={(e) => setResubmitForm((f) => ({ ...f, title: e.target.value }))}
            className="mb-2"
          />

          <label className="small">Description</label>
          <Input
            type="textarea"
            value={resubmitForm.description}
            onChange={(e) => setResubmitForm((f) => ({ ...f, description: e.target.value }))}
            className="mb-2"
          />

          <label className="small">Replace IP Form (optional)</label>
          <Input
            type="file"
            accept=".pdf,image/*"
            onChange={(e) => setResubmitFile(e.target.files?.[0] || null)}
          />
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setResubmitOpen(false)}>
            Cancel
          </Button>
          <Button color="primary" onClick={submitResubmission}>
            Resubmit
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={fundingRoomOpen} toggle={() => setFundingRoomOpen(false)} centered size="xl">
        <ModalHeader toggle={() => setFundingRoomOpen(false)}>Funding Communication & Agreement Room</ModalHeader>
        <ModalBody>
          {selectedIdea ? (
            <div>
              <div
                style={{
                  borderRadius: 24,
                  background: "linear-gradient(135deg,#0f2747,#1e63c6)",
                  color: "white",
                  padding: 22,
                  marginBottom: 18,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.86 }}>
                  Accepted funding workflow
                </div>
                <h3 className="fw-bold mb-2 mt-2">{selectedIdea.title}</h3>
                <div style={{ opacity: 0.9 }}>
                  After funder acceptance, this room is used by the funder and innovator to agree on budget,
                  conditions, required documents, deadlines, and milestones. Admin can monitor for transparency.
                </div>
                <div className="mt-3 d-flex flex-wrap gap-2">
                  <Badge color="light" pill className="px-3 py-2 text-primary">Innovator can send messages</Badge>
                  <Badge color="light" pill className="px-3 py-2 text-primary">Funder can send messages</Badge>
                  <Badge color="light" pill className="px-3 py-2 text-primary">Admin monitors</Badge>
                </div>
              </div>

              <Row className="g-4">
                {isAdmin && (
                <Col lg="5">
                  <Card className="border-0 shadow-sm" style={{ borderRadius: 22 }}>
                    <CardBody>
                      <div className="fw-bold mb-3" style={{ color: "#0f2747", fontSize: 18 }}>
                        Agreement Details
                      </div>

                      <FormGroup>
                        <Label className="fw-bold small">Final budget</Label>
                        <Input
                          type="number"
                          value={agreementForm.finalBudget}
                          onChange={(e) => setAgreementForm((f) => ({ ...f, finalBudget: e.target.value }))}
                          placeholder="Example: 5000"
                          style={{ borderRadius: 14 }}
                          disabled={isInnovator}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label className="fw-bold small">Final deadline</Label>
                        <Input
                          type="date"
                          value={agreementForm.deadline}
                          onChange={(e) => setAgreementForm((f) => ({ ...f, deadline: e.target.value }))}
                          style={{ borderRadius: 14 }}
                          disabled={isInnovator}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label className="fw-bold small">Funding conditions</Label>
                        <Input
                          type="textarea"
                          rows="4"
                          value={agreementForm.conditions}
                          onChange={(e) => setAgreementForm((f) => ({ ...f, conditions: e.target.value }))}
                          placeholder="Payment terms, eligibility conditions, reporting requirements..."
                          style={{ borderRadius: 14 }}
                          disabled={isInnovator}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label className="fw-bold small">Required documents</Label>
                        <Input
                          type="textarea"
                          rows="3"
                          value={agreementForm.requiredDocuments}
                          onChange={(e) => setAgreementForm((f) => ({ ...f, requiredDocuments: e.target.value }))}
                          placeholder="Commercial registration, bank details, updated proposal..."
                          style={{ borderRadius: 14 }}
                          disabled={isInnovator}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label className="fw-bold small">Milestones, one per line</Label>
                        <Input
                          type="textarea"
                          rows="4"
                          value={agreementForm.milestones}
                          onChange={(e) => setAgreementForm((f) => ({ ...f, milestones: e.target.value }))}
                          placeholder={"Prototype approved\nFirst payment released\nPilot completed"}
                          style={{ borderRadius: 14 }}
                          disabled={isInnovator}
                        />
                      </FormGroup>

                      <Button color="primary" className="w-100 rounded-pill fw-bold" onClick={saveFundingAgreement}>
                        Save Agreement & Move to Contract Draft
                      </Button>
                    </CardBody>
                  </Card>
                </Col>
                )}

                <Col lg={isAdmin ? "7" : "12"}>
                  <Card className="border-0 shadow-sm" style={{ borderRadius: 22 }}>
                    <CardBody>
                      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                        <div>
                          <div className="fw-bold" style={{ color: "#0f2747", fontSize: 18 }}>
                            Communication Thread
                          </div>
                          <small className="text-muted">Funder ↔ Innovator, monitored by Admin</small>
                        </div>
                        <Badge color={statusColor(selectedIdea.status)} pill className="px-3 py-2">
                          {STATUS_LABELS[selectedIdea.status] || selectedIdea.status}
                        </Badge>
                      </div>

                      <div
                        style={{
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: 18,
                          padding: 14,
                          minHeight: 260,
                          maxHeight: 360,
                          overflowY: "auto",
                          display: "grid",
                          gap: 10,
                        }}
                      >
                        {(selectedIdea.messages || []).length === 0 ? (
                          <div className="text-muted text-center py-5">
                            No messages yet. Start by discussing budget, conditions, documents, deadlines, and milestones.
                          </div>
                        ) : (
                          selectedIdea.messages.map((m, idx) => {
                            const mine = String(m.senderId) === String(user?._id);
                            return (
                              <div
                                key={`${m.createdAt || idx}-${idx}`}
                                style={{
                                  justifySelf: mine ? "end" : "start",
                                  maxWidth: "82%",
                                  background: mine ? "#1e63c6" : "#ffffff",
                                  color: mine ? "white" : "#0f2747",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: 16,
                                  padding: "10px 12px",
                                  boxShadow: "0 8px 18px rgba(15,39,71,.06)",
                                }}
                              >
                                <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.75, textTransform: "uppercase" }}>
                                  {m.senderRole || "user"}
                                </div>
                                <div style={{ lineHeight: 1.6 }}>{m.message}</div>
                                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>
                                  {m.createdAt ? formatIdeaDate(m.createdAt) : "Now"}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {!canSendFundingMessage(selectedIdea) && (
                        <Alert color="warning" className="mt-3 mb-0">
                          You can view this room, but only the idea innovator, selected funder, and admin can send messages after funding acceptance.
                        </Alert>
                      )}

                      <div className="d-flex gap-2 mt-3">
                        <Input
                          type="textarea"
                          rows="2"
                          value={fundingMessage}
                          onChange={(e) => setFundingMessage(e.target.value)}
                          placeholder={isInnovator ? "Write your message to the funder..." : "Write a funding discussion message..."}
                          style={{ borderRadius: 16 }}
                          disabled={!canSendFundingMessage(selectedIdea)}
                        />
                        <Button
                          color="warning"
                          className="fw-bold px-4"
                          onClick={sendFundingMessage}
                          disabled={!canSendFundingMessage(selectedIdea) || !fundingMessage.trim()}
                        >
                          Send
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            </div>
          ) : null}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setFundingRoomOpen(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={reviewOpen} toggle={() => setReviewOpen(false)} centered size="lg">
        <ModalHeader toggle={() => setReviewOpen(false)}>Reviewer Decision Center</ModalHeader>
        <ModalBody>
          <div
            style={{
              borderRadius: 22,
              background: "linear-gradient(135deg, #0f2747 0%, #18457f 50%, #1e67c7 100%)",
              color: "#fff",
              padding: 20,
              marginBottom: 18,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.82 }}>
              Review workspace
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.15, marginTop: 6 }}>
              {selectedIdea?.title}
            </div>
            <div style={{ marginTop: 10, color: "rgba(255,255,255,0.84)", lineHeight: 1.7 }}>
              Score the idea, leave a clear comment, and select the final reviewer action below.
            </div>
          </div>

          <Row className="g-3 mb-3">
            {Object.entries(REVIEWER_DECISION_META).map(([key, meta]) => {
              const active = reviewDecision === key;
              return (
                <Col md="4" key={key}>
                  <button
                    type="button"
                    onClick={() => setReviewDecision(key)}
                    style={{
                      width: "100%",
                      borderRadius: 18,
                      border: active ? `1px solid ${meta.color}` : "1px solid #dfe9f7",
                      background: active ? meta.soft : "#fff",
                      padding: 16,
                      textAlign: "left",
                      boxShadow: active ? "0 12px 24px rgba(17,63,127,0.08)" : "none",
                    }}
                  >
                    <div style={{ color: meta.color, fontWeight: 900, fontSize: 16, marginBottom: 6 }}>{meta.label}</div>
                    <div style={{ color: "#6c86a8", fontSize: 13, lineHeight: 1.55 }}>{meta.helper}</div>
                  </button>
                </Col>
              );
            })}
          </Row>

          <Row className="g-3">
            <Col md="4">
              <Label className="small fw-bold">Score (0..10)</Label>
              <Input
                type="number"
                min={0}
                max={10}
                value={reviewScore}
                onChange={(e) => setReviewScore(e.target.value)}
                style={{ borderRadius: 14, minHeight: 48 }}
              />
            </Col>
            <Col md="8">
              <Label className="small fw-bold">Decision</Label>
              <Input
                type="select"
                value={reviewDecision}
                onChange={(e) => setReviewDecision(e.target.value)}
                style={{ borderRadius: 14, minHeight: 48 }}
              >
                <option value="accepted">Approve</option>
                <option value="changes_requested">Request changes</option>
                <option value="rejected">Reject</option>
              </Input>
            </Col>
          </Row>

          <div className="mt-3">
            <Label className="small fw-bold">Reviewer comment</Label>
            <Input
              type="textarea"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Write a clear reviewer comment explaining your decision..."
              style={{ minHeight: 130, borderRadius: 16 }}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setReviewOpen(false)} style={{ borderRadius: 12, fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            onClick={submitReview}
            style={{
              borderRadius: 12,
              fontWeight: 800,
              border: "none",
              background: getReviewerDecisionMeta(reviewDecision).color,
            }}
          >
            {getReviewerDecisionMeta(reviewDecision).label}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
