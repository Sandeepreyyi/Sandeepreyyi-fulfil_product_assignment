import React, { useState, useRef } from "react";
import axios from "axios";

const CSVUploader = () => {
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [taskProgress, setTaskProgress] = useState(0);
  const [jobId, setJobId] = useState(null);
  const API_BASE = process.env.REACT_APP_API_BASE_URL;

  // NEW STATES
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState(""); // success | error | info
  const [retryFn, setRetryFn] = useState(null);

  const inputRef = useRef();

  // ---------------- HANDLE FILE ----------------
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === "text/csv") {
      setFile(selected);
      setUploadProgress(0);
      setTaskProgress(0);
      setStatusType("");
      setStatusMessage("");
      setJobId(null);
    } else {
      alert("Only CSV files allowed!");
    }
  };

    const resetForm = () => {
    setFile(null);
    setUploadProgress(0);
    setTaskProgress(0);
    setStatusType("");
    setStatusMessage("");
    setJobId(null);

    if (inputRef.current) {
      inputRef.current.value = ""; // clears the file input
    }
  };

  // ---------------- POLLING FOR CELERY TASK ----------------
  const pollTask = (taskId) => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/task-status/${taskId}/`
        );

        const { state, progress } = res.data;

        // --------- PROGRESS ----------
        if (state === "PROGRESS") {
          const percent = Math.floor(
            (progress.processed / progress.total) * 100
          );

          setTaskProgress(percent);
          setStatusType("info");
          setStatusMessage(`Processing: ${percent}%`);
        }

        // --------- SUCCESS ----------
        else if (state === "SUCCESS") {
          clearInterval(interval);
          setTaskProgress(100);
          setStatusType("success");
          setStatusMessage("Import Complete!");
          setTimeout(() => {
            resetForm();
          }, 2000);
        }

        // --------- FAILURE ----------
        else if (state === "FAILURE") {
          clearInterval(interval);
          setTaskProgress(100);
          setStatusType("error");

          setStatusMessage(
            `Import Failed: ${progress?.error || "Unknown error"}`
          );
        }
      } catch (err) {
        clearInterval(interval);
      }
    }, 1000);
  };

  // ---------------- UPLOAD ----------------
  const handleUpload = async () => {
    if (!file) return alert("Please choose a file!");

    const formData = new FormData();
    formData.append("file", file);

    try {
      setStatusType("info");
      setStatusMessage("Uploading...");

      const res = await axios.post(
        `${API_BASE}upload-csv/`,
        formData,
        {
          onUploadProgress: (event) => {
            const percent = Math.floor((event.loaded * 100) / event.total);
            setUploadProgress(percent);
          },
        }
      );

      setUploadProgress(100);
      setStatusType("info");
      setStatusMessage("Starting processing...");

      const { job_id } = res.data;
      setJobId(job_id);

      // store retry function
      setRetryFn(() => () => handleUpload());

      pollTask(job_id);
    } catch (error) {
      setStatusType("error");
      setStatusMessage("Upload failed. Try again.");
    }
  };

  // ---------------- UI RENDER ----------------
  const renderAlert = () => {
    if (!statusType) return null;

    let alertClass =
      statusType === "success"
        ? "alert-success"
        : statusType === "error"
        ? "alert-danger"
        : "alert-info";

    return (
      <div className={`alert ${alertClass} py-2`}>
        <div className="d-flex justify-content-between align-items-center">
          <span>{statusMessage}</span>

          {statusType === "error" && retryFn && (
            <button
              onClick={retryFn}
              className="btn btn-sm btn-danger ms-3"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light px-3">
      <div className="card shadow-lg border-0 rounded-4" style={{ maxWidth: "550px", width: "100%" }}>
        
        {/* HEADER */}
        <div
          className="text-white text-center py-4 rounded-top"
          style={{
            background: "linear-gradient(135deg, #4e54c8, #8f94fb)",
          }}
        >
          <h2 className="fw-bold m-0">CSV Importer</h2>
          <p className="m-0 opacity-75">Upload up to 500,000 products</p>
        </div>

        <div className="card-body p-4">

          {/* DRAG & DROP */}
          <div
            className="border rounded-3 p-5 text-center mb-4 shadow-sm"
            style={{ borderStyle: "dashed", cursor: "pointer" }}
            onClick={() => inputRef.current.click()}
            onDragOver={(e) => e.preventDefault()}
          >
            <i className="bi bi-upload fs-1 text-primary mb-3"></i>
            <h5 className="fw-semibold mb-1">
              {file ? file.name : "Click or Drag CSV here"}
            </h5>
            <p className="text-muted small mb-0">Max size: large files allowed</p>

            <input
              type="file"
              accept=".csv"
              className="d-none"
              ref={inputRef}
              onChange={handleFileChange}
            />
          </div>

          {/* UPLOAD BUTTON */}
          <button className="btn btn-primary w-100 py-2 fw-semibold" onClick={handleUpload}>
            Upload
          </button>

          {/* ALERT / STATUS */}
          <div className="mt-3">
            {renderAlert()}
          </div>

          {/* UPLOAD PROGRESS */}
          {uploadProgress > 0 && (
            <>
              <label className="mt-3 fw-semibold">Upload Progress</label>
              <div className="progress mb-3" style={{ height: "20px" }}>
                <div
                  className="progress-bar progress-bar-striped progress-bar-animated"
                  style={{ width: `${uploadProgress}%` }}
                >
                  {uploadProgress}%
                </div>
              </div>
            </>
          )}

          {/* TASK PROGRESS */}
          {jobId && (
            <>
              <label className="fw-semibold">Processing Status</label>

              <div className="progress" style={{ height: "20px" }}>
                <div
                  className="progress-bar bg-success"
                  style={{
                    width: `${taskProgress}%`,
                    transition: "0.3s",
                  }}
                >
                  {taskProgress}%
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CSVUploader;
