import React, { useEffect, useMemo, useState } from "react";

const pageGuides = {
  home: {
    label: "Home Guide",
    intro: "SparkUp main entrance",
    steps: [
      {
        title: "Welcome to SparkUp",
        content:
          "This is the main entry page where users understand SparkUp and start their journey.",
      },
      {
        title: "Main Workflow",
        content:
          "SparkUp connects innovators, admins, reviewers, and funders in one structured idea-to-funding process.",
      },
      {
        title: "Get Started",
        content:
          "Users can register, login, and move to the correct dashboard based on their role.",
      },
    ],
  },

  innovator: {
    label: "Innovator Guide",
    intro: "Submit, update, and track ideas",
    steps: [
      {
        title: "Innovator Dashboard",
        content:
          "This area helps innovators submit ideas, upload IP forms, track progress, and receive updates.",
      },
      {
        title: "Submit Idea + IP Form",
        content:
          "Start by writing the idea title, description, and uploading the intellectual property form.",
      },
      {
        title: "Track Your Idea",
        content:
          "Follow the idea from admin review to reviewer review, funder decision, contract, and completion.",
      },
      {
        title: "Resubmission Flow",
        content:
          "If the admin or reviewer requests changes, update the idea and resubmit it from the tracking page.",
      },
    ],
  },

  funder: {
    label: "Funder Guide",
    intro: "Review approved ideas and funding decisions",
    steps: [
      {
        title: "Funder Dashboard",
        content:
          "Funders can view approved ideas that were presented by the admin.",
      },
      {
        title: "Funding Decision",
        content:
          "Open an idea, review the details, then accept, reject, or update the funding status.",
      },
      {
        title: "Communication Room",
        content:
          "Accepted ideas open a communication room for budget, documents, conditions, and milestones.",
      },
      {
        title: "Contracts and Progress",
        content:
          "When funding details are agreed, the contract stage starts and progress can be tracked.",
      },
    ],
  },

  reviewer: {
    label: "Reviewer Guide",
    intro: "Review assigned ideas professionally",
    steps: [
      {
        title: "Reviewer Dashboard",
        content:
          "Reviewers can see the main tools for assigned ideas, events, certificates, feedback, and activity.",
      },
      {
        title: "Assigned Ideas",
        content:
          "Open the assigned idea queue to see ideas sent by the admin for evaluation.",
      },
      {
        title: "Submit Review",
        content:
          "Read the idea details, add a score, write a clear comment, then approve, reject, or request changes.",
      },
      {
        title: "Reviewer Comments",
        content:
          "Your comments help the admin and innovator improve the idea before it is presented to funders.",
      },
    ],
  },

  admin: {
    label: "Admin Guide",
  
    intro: "Manage the full SparkUp workflow",
    steps: [
      {
        title: "Admin Control Center",
        content:
          "Admins manage the full SparkUp workflow including users, ideas, events, reports, funding, and certificates.",
      },
      {
        title: "Idea Review",
        content:
          "Review submitted ideas, add comments, request changes, assign reviewers, or present ideas to funders.",
      },
      {
        title: "User Security",
        content:
          "Approve reviewers and funders so only trusted users can access important parts of the platform.",
      },
      {
        title: "Events, Reports, Certificates",
        content:
          "Manage events, check feedback summaries, issue certificates, and monitor real-time platform activity.",
      },
    ],
  },
};

const buttonBase = {
  border: "none",
  borderRadius: 14,
  padding: "11px 16px",
  fontWeight: 800,
  cursor: "pointer",
};

const GuidedTour = ({ type = "home" }) => {
  const guide = pageGuides[type] || pageGuides.home;
  const steps = guide.steps;

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const storageKey = useMemo(() => `sparkupTourSeen_${type}`, [type]);
  const progress = Math.round(((step + 1) / steps.length) * 100);

  useEffect(() => {
    const seen = localStorage.getItem(storageKey);
    if (!seen) {
      setOpen(true);
    }
  }, [storageKey]);

  const closeTour = () => {
    localStorage.setItem(storageKey, "true");
    setOpen(false);
  };

  const restartTour = () => {
    localStorage.removeItem(storageKey);
    setStep(0);
    setOpen(true);
  };

  const nextStep = () => {
    if (step === steps.length - 1) {
      closeTour();
    } else {
      setStep((current) => current + 1);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep((current) => current - 1);
    }
  };

  return (
    <>
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "radial-gradient(circle at top left, rgba(13,110,253,0.36), transparent 36%), rgba(2,6,23,0.76)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 18,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              width: 500,
              maxWidth: "100%",
              background: "linear-gradient(180deg,#ffffff 0%,#f8fbff 100%)",
              borderRadius: 28,
              padding: 28,
              boxShadow: "0 28px 80px rgba(0,0,0,0.34)",
              textAlign: "center",
              border: "1px solid rgba(13,110,253,0.16)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={closeTour}
              style={{
                position: "absolute",
                top: 14,
                right: 16,
                border: "none",
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "#eef4ff",
                color: "#0d6efd",
                fontWeight: 900,
                cursor: "pointer",
              }}
              aria-label="Close guide"
            >
              ×
            </button>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                background: "#eef5ff",
                color: "#1d4ed8",
                borderRadius: 999,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 900,
                marginBottom: 16,
              }}
            >
              <span>{guide.emoji}</span>
              <span>{guide.label}</span>
            </div>

            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: 24,
                margin: "0 auto 16px",
                background: "linear-gradient(135deg,#0d6efd,#f59e0b)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 34,
                boxShadow: "0 16px 32px rgba(13,110,253,0.28)",
              }}
            >
              {guide.emoji}
            </div>

            <div style={{ color: "#64748b", fontSize: 13, fontWeight: 800 }}>
              Step {step + 1} of {steps.length} · {progress}% complete
            </div>

            <h2
              style={{
                color: "#0f172a",
                fontWeight: 900,
                fontSize: 25,
                margin: "10px 0 12px",
              }}
            >
              {steps[step].title}
            </h2>

            <p
              style={{
                color: "#475569",
                lineHeight: 1.75,
                fontSize: 15,
                marginBottom: 20,
              }}
            >
              {steps[step].content}
            </p>

            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 18,
                padding: 14,
                marginBottom: 18,
                color: "#64748b",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {guide.intro}
            </div>

            <div
              style={{
                height: 9,
                background: "#e5e7eb",
                borderRadius: 999,
                overflow: "hidden",
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: "linear-gradient(135deg,#0d6efd,#f59e0b)",
                  borderRadius: 999,
                  transition: "width .28s ease",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 7,
                marginBottom: 22,
              }}
            >
              {steps.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setStep(index)}
                  style={{
                    width: index === step ? 26 : 9,
                    height: 9,
                    borderRadius: 999,
                    border: "none",
                    background:
                      index === step
                        ? "linear-gradient(135deg,#0d6efd,#f59e0b)"
                        : "#cbd5e1",
                    cursor: "pointer",
                    transition: ".25s ease",
                  }}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 0}
                style={{
                  ...buttonBase,
                  flex: 1,
                  background: step === 0 ? "#e5e7eb" : "#eef4ff",
                  color: step === 0 ? "#94a3b8" : "#0d6efd",
                  cursor: step === 0 ? "not-allowed" : "pointer",
                }}
              >
                Back
              </button>

              <button
                type="button"
                onClick={closeTour}
                style={{
                  ...buttonBase,
                  flex: 1,
                  background: "#f1f5f9",
                  color: "#64748b",
                }}
              >
                Skip
              </button>

              <button
                type="button"
                onClick={nextStep}
                style={{
                  ...buttonBase,
                  flex: 1,
                  background: "linear-gradient(135deg,#0d6efd,#f59e0b)",
                  color: "#fff",
                  boxShadow: "0 12px 24px rgba(13,110,253,.24)",
                }}
              >
                {step === steps.length - 1 ? "Finish" : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={restartTour}
        style={{
            position: "fixed",
            bottom: "30px",
            right: "85px",
            zIndex: 9998,
            width: "58px",
            height: "58px",
            border: "none",
            borderRadius: "50%",
            background: "linear-gradient(135deg,#0d6efd,#f59e0b)",
            color: "#fff",
            cursor: "pointer",
            boxShadow: "0 12px 28px rgba(0,0,0,0.28)",
            fontSize: "24px",

        }}
        title={`Open ${guide.label}`}
        aria-label={`Open ${guide.label}`}
      >
        ?
      </button>
    </>
  );
};

export default GuidedTour;
