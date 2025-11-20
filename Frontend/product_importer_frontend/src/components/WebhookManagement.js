import React, { useEffect, useState } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_API_BASE_URL}webhooks/`;

const WebhookManagement = () => {
  const [webhooks, setWebhooks] = useState([]);
  const [modalData, setModalData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState(null);

  // Show toast for 3 seconds
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load webhooks
  const loadWebhooks = async () => {
    try {
      const res = await axios.get(API);
      console.log("Load Webhooks Response:", res);
      const { message_type, data } = res.data;
      if (message_type === "success")
      {
         setWebhooks(data)
       
      }
      else showToast(res.data.message, "error");
    } catch (e) {
      showToast("Failed to load webhooks", "error");
    }
  };

  console.log("Webhooks:", webhooks);

  useEffect(() => {
    loadWebhooks();
  }, []);

  // Save webhook (create/update)
  const saveWebhook = async () => {
    try {
      const isEdit = !!modalData.id;
      const res = isEdit
        ? await axios.put(`${API}${modalData.id}/`, modalData)
        : await axios.post(API, modalData);

      const { message_type, message } = res.data;
      showToast(message, message_type);
      setShowModal(false);
      loadWebhooks();
    } catch (e) {
      showToast("enter valid url", "error");
    }
  };

  // Delete webhook
  const deleteWebhook = async () => {
    try {
      const res = await axios.delete(`${API}${deleteId}/`);
      showToast(res.data.message, res.data.message_type);
      setDeleteId(null);
      loadWebhooks();
    } catch (e) {
      showToast(e, "error");
    }
  };

  // Test webhook
    const testWebhook = async (id) => {
    try {
        const res = await axios.post(`${API}${id}/test/`);
        showToast(res.data.message, res.data.message_type);
    } catch (error) {
        // If backend sent a JSON response, use it
        if (error.response && error.response.data) {
        const { message, message_type } = error.response.data;
        showToast(message, message_type);
        } else {
        showToast("Webhook test failed", "error");
        }
    }
    };

  return (
    <div className="container py-4">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`toast-box ${toast.type === "success" ? "toast-success" : "toast-error"}`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Webhook Management</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setModalData({ url: "", event: "", active: true });
            setShowModal(true);
          }}
        >
          + Add Webhook
        </button>
      </div>

      {/* Webhook Table */}
      <div className="card shadow-sm">
        <div className="card-body p-0">
          <table className="table table-hover mb-0">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>URL</th>
                <th>Event</th>
                <th>Status</th>
                <th style={{ width: "200px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {webhooks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4">
                    No webhooks found.
                  </td>
                </tr>
              ) : (
                webhooks.map((w) => (
                  <tr key={w.id}>
                    <td>{w.id}</td>
                    <td>{w.url}</td>
                    <td>{w.event}</td>
                    <td>
                      {w.active ? (
                        <span className="badge bg-success">Active</span>
                      ) : (
                        <span className="badge bg-secondary">Inactive</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-secondary me-2"
                        onClick={() => {
                          setModalData(w);
                          setShowModal(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-success me-2"
                        onClick={() => testWebhook(w.id)}
                      >
                        Test
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => setDeleteId(w.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-backdrop-custom">
          <div className="modal-box shadow-lg">
            <h4 className="fw-bold mb-3">
              {modalData.id ? "Edit Webhook" : "Add Webhook"}
            </h4>

            <input
              className="form-control mb-2"
              placeholder="Webhook URL"
              value={modalData.url}
              onChange={(e) => setModalData({ ...modalData, url: e.target.value })}
            />
            <input
              className="form-control mb-2"
              placeholder="Event Type"
              value={modalData.event}
              onChange={(e) => setModalData({ ...modalData, event: e.target.value })}
            />
            <div className="form-check mb-3">
              <input
                type="checkbox"
                className="form-check-input"
                checked={modalData.active}
                onChange={(e) => setModalData({ ...modalData, active: e.target.checked })}
              />
              <label className="form-check-label">Active</label>
            </div>

            <div className="d-flex justify-content-end">
              <button className="btn btn-secondary me-2" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn btn-success" onClick={saveWebhook}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="modal-backdrop-custom">
          <div className="modal-box shadow-lg">
            <h5 className="fw-bold">Confirm Deletion</h5>
            <p>Are you sure you want to delete this webhook?</p>
            <div className="d-flex justify-content-end">
              <button className="btn btn-secondary me-2" onClick={() => setDeleteId(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={deleteWebhook}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookManagement;
