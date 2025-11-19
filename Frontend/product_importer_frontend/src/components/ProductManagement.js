// ProductManagement.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

// === axios global config ===
axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL;
axios.defaults.withCredentials = true; // send cookies
// CSRF helper (reads cookie)
function getCookie(name) {
  const v = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
  return v ? v.pop() : "";
}
axios.defaults.headers.common["X-CSRFToken"] = getCookie("csrftoken");

const API = "/products/";

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");

  const [selected, setSelected] = useState([]);

  const [modalData, setModalData] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [showBulkDeleteAll, setShowBulkDeleteAll] = useState(false);
  const [showBulkDeleteSelected, setShowBulkDeleteSelected] = useState(false);

  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  // toast helper
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => {
      if (mountedRef.current) setToast(null);
    }, 3000);
  };

  // load data
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API, {
        params: {
          page,
          search,
          status: statusFilter,
          ordering: sortOrder === "asc" ? sortField : `-${sortField}`,
        },
      });
      setProducts(res.data.results || []);
      setCount(Math.max(1, Math.ceil((res.data.count || 0) / 20)));
      setSelected([]); // clear selection on reload
    } catch (err) {
      console.error("loadData error", err);
      showToast("Failed to load products", "error");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    loadData();
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter, sortField, sortOrder]);

  // save product (create / update)
  const saveProduct = async () => {
    try {
      if (!modalData) return;
      if (modalData.id) {
        await axios.put(`${API}${modalData.id}/`, modalData);
        showToast("Product updated");
      } else {
        await axios.post(API, modalData);
        showToast("Product created");
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error("saveProduct err", err);
      showToast("Failed to save product", "error");
    }
  };

  // delete single
  const deleteProduct = async () => {
    try {
      await axios.delete(`${API}${deleteId}/`);
      showToast("Product deleted");
      setDeleteId(null);
      loadData();
    } catch (err) {
      console.error("deleteProduct err", err);
      showToast("Delete failed", "error");
    }
  };

  // bulk delete all
  const bulkDeleteAll = async () => {
    try {
      await axios.post(`${API}bulk-delete/`);
      showToast("All products deleted");
      setShowBulkDeleteAll(false);
      loadData();
    } catch (err) {
      console.error("bulkDeleteAll err", err);
      showToast("Bulk delete failed", "error");
    }
  };

  // bulk delete selected
  const bulkDeleteSelected = async () => {
    try {
      await axios.post(`${API}bulk-delete-selected/`, { ids: selected });
      showToast("Deleted Successfully");
      setShowBulkDeleteSelected(false);
      setSelected([]);
      loadData();
    } catch (err) {
      console.error("bulkDeleteSelected err", err);
      showToast("Delete failed", "error");
    }
  };

  // selection handlers
  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (products.length === 0) return;
    if (selected.length === products.length) setSelected([]);
    else setSelected(products.map((p) => p.id));
  };

  // sorting
  const handleSort = (field) => {
    if (sortField === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // modal inputs binding
  const updateModalField = (key, value) => setModalData((m) => ({ ...m, [key]: value }));

  return (
    <div className="container py-4">
      {/* TOAST */}
      {toast && <div className={`toast-box ${toast.type === "success" ? "toast-success" : "toast-error"}`}>{toast.msg}</div>}

      {/* header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Product Management</h2>
        <div>
          <button className="btn btn-warning me-2" disabled={selected.length === 0} onClick={() => setShowBulkDeleteSelected(true)}>
            Delete Selected ({selected.length})
          </button>
          <button className="btn btn-danger me-2" onClick={() => setShowBulkDeleteAll(true)}>
            Delete All
          </button>
          <button className="btn btn-primary" onClick={() => { setModalData({ name: "", sku: "", description: "", active: true }); setShowModal(true); }}>
            + Add Product
          </button>
        </div>
      </div>

      {/* filters */}
      <div className="card shadow-sm mb-4">
        <div className="card-body row">
          <div className="col-md-6 mb-2">
            <input className="form-control" placeholder="Search SKU / Name / Description..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="col-md-3 mb-2">
            <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* table */}
      <div className="card shadow-sm">
        <div className="card-body p-0">
          <table className="table table-hover mb-0">
            <thead className="table-dark">
              <tr>
                <th>
                  <input type="checkbox" onChange={toggleSelectAll} checked={products.length > 0 && selected.length === products.length} />
                </th>
                {["id", "sku", "name", "description", "active"].map((field) => (
                  <th key={field} style={{ cursor: "pointer" }} onClick={() => handleSort(field)}>
                    {field.toUpperCase()} {sortField === field && <span>{sortOrder === "asc" ? "▲" : "▼"}</span>}
                  </th>
                ))}
                <th style={{ width: "150px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-4">{loading ? "Loading..." : "No products found."}</td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id}>
                    <td><input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                    <td>{p.id}</td>
                    <td>{p.sku}</td>
                    <td>{p.name}</td>
                    <td>{p.description ? `${p.description.slice(0, 40)}...` : ""}</td>
                    <td>{p.active ? <span className="badge bg-success">Active</span> : <span className="badge bg-secondary">Inactive</span>}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => { setModalData(p); setShowModal(true); }}>Edit</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteId(p.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* pagination */}
      <div className="d-flex justify-content-center mt-3">
        <button className="btn btn-outline-primary me-2" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
        <span className="px-3 pt-2">Page <strong>{page}</strong> / {count}</span>
        <button className="btn btn-outline-primary" disabled={page === count} onClick={() => setPage(page + 1)}>Next</button>
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && modalData && (
        <div className="modal-backdrop-custom">
          <div className="modal-box shadow-lg">
            <h4 className="fw-bold mb-3">{modalData.id ? "Update Product" : "Create Product"}</h4>

            <input className="form-control mb-2" placeholder="SKU" value={modalData.sku} onChange={(e) => updateModalField("sku", e.target.value)} />
            <input className="form-control mb-2" placeholder="Name" value={modalData.name} onChange={(e) => updateModalField("name", e.target.value)} />
            <textarea className="form-control mb-2" placeholder="Description" rows={3} value={modalData.description} onChange={(e) => updateModalField("description", e.target.value)} />
            <div className="form-check mb-3">
              <input type="checkbox" className="form-check-input" checked={modalData.active} onChange={(e) => updateModalField("active", e.target.checked)} />
              <label className="form-check-label">Active</label>
            </div>

            <div className="d-flex justify-content-end">
              <button className="btn btn-secondary me-2" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-success" onClick={saveProduct}>{modalData.id ? "Update" : "Create"}</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteId && (
        <div className="modal-backdrop-custom">
          <div className="modal-box shadow-lg">
            <h5 className="fw-bold text-danger">Delete Product?</h5>
            <p>This action cannot be undone.</p>
            <div className="d-flex justify-content-end">
              <button className="btn btn-secondary me-2" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={deleteProduct}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE SELECTED */}
      {showBulkDeleteSelected && (
        <div className="modal-backdrop-custom">
          <div className="modal-box shadow-lg">
            <h5 className="fw-bold text-danger">Delete Selected?</h5>
            <p>Are you sure you want to delete {selected.length} selected products? This cannot be undone.</p>
            <div className="d-flex justify-content-end">
              <button className="btn btn-secondary me-2" onClick={() => setShowBulkDeleteSelected(false)}>Cancel</button>
              <button className="btn btn-warning" onClick={bulkDeleteSelected}>Delete Selected</button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE ALL */}
      {showBulkDeleteAll && (
        <div className="modal-backdrop-custom">
          <div className="modal-box shadow-lg">
            <h5 className="fw-bold text-danger">Delete ALL Products?</h5>
            <p>This action will permanently remove ALL products. This cannot be undone.</p>
            <div className="d-flex justify-content-end">
              <button className="btn btn-secondary me-2" onClick={() => setShowBulkDeleteAll(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={bulkDeleteAll}>Delete All</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductManagement;
