// frontend/src/components/ReportButton.js
import React, { useContext, useState } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

/**
 * Generic report button.
 *
 * Props:
 *  - targetType: "course" | "question" | "answer" | "user"
 *  - targetId: MongoDB ID of the target
 *  - label?: button text (default: "Report")
 *  - small?: boolean (smaller button style)
 */
export default function ReportButton({
  targetType,
  targetId,
  label = "Report",
  small = false,
}) {
  const { auth } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // If user not logged in, don't show the button
  if (!auth?.user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert("Please provide a short reason for the report.");
      return;
    }

    try {
      setSubmitting(true);
      setSuccessMessage("");

      await axios.post(
        "http://localhost:5000/api/reports/content",
        {
          targetType,
          targetId,
          reason,
        },
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );

      setSuccessMessage("Report submitted. Thank you!");
      setReason("");
      // Close after a short delay
      setTimeout(() => {
        setOpen(false);
        setSuccessMessage("");
      }, 1200);
    } catch (err) {
      console.error("Failed to submit report:", err);
      alert(
        err.response?.data?.message ||
          "Failed to submit report. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const btnBase =
    "inline-flex items-center gap-1 rounded-full border text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-1";
  const btnSize = small ? "px-2 py-0.5" : "px-3 py-1";
  const btnColors =
    "border-red-300 text-red-700 bg-red-50 hover:bg-red-100 focus:ring-red-400";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${btnBase} ${btnSize} ${btnColors}`}
      >
        🚩 {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Report{" "}
                  {targetType.charAt(0).toUpperCase() + targetType.slice(1)}
                </h3>
                <p className="text-xs text-gray-500">
                  This will be sent to the admins for review.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Reason for reporting
                </label>
                <textarea
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                  placeholder="E.g., inappropriate content, spam, incorrect information..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              {successMessage && (
                <p className="text-xs text-green-600">{successMessage}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-3 py-1 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-1 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
