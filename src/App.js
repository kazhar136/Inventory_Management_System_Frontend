// src/App.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import RuleBasedChatbot from "./RuleBasedChatbot";

const API_URL = "https://inventory-management-system-2-2vd8.onrender.com/items";

function App() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: "", quantity: "", description: "" });
  const [editingId, setEditingId] = useState(null);

  // 🔍 Search (by name)
  const [search, setSearch] = useState("");

  // 📑 Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchItems = async () => {
    try {
      const res = await axios.get(API_URL);
      setItems(res.data);
    } catch (err) {
      console.error("Error fetching items:", err);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // reset page when search or items change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, items.length]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      quantity: Number(form.quantity),
      description: form.description,
    };

    try {
      if (editingId === null) {
        await axios.post(API_URL, payload);
      } else {
        await axios.put(`${API_URL}/${editingId}`, payload);
        setEditingId(null);
      }
      setForm({ name: "", quantity: "", description: "" });
      fetchItems();
    } catch (err) {
      console.error("Error saving item:", err);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      quantity: String(item.quantity ?? ""),
      description: item.description ?? "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", quantity: "", description: "" });
  };

  const deleteItem = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchItems();
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  // 🔍 client-side filter (by name)
  const filtered = items.filter((it) =>
    (it.name || "").toLowerCase().includes(search.toLowerCase())
  );

  // 📑 pagination slice
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const start = (currentPage - 1) * itemsPerPage;
  const currentItems = filtered.slice(start, start + itemsPerPage);

  // clamp currentPage if data shrinks
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  return (
    <div className="app-root" style={{ display: "flex", gap: 20, padding: 20 }}>
      {/* Left: Inventory UI */}
      <div style={{ flex: 1 }}>
        <div className="container">
          <h1>📦 Inventory Management</h1>

          {/* Form */}
          <form className="form" onSubmit={handleSubmit}>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Item Name"
              required
            />
            <input
              name="quantity"
              type="number"
              value={form.quantity}
              onChange={handleChange}
              placeholder="Quantity"
              required
            />
            <input
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Description"
            />
            <button type="submit">{editingId === null ? "Add Item" : "Save Changes"}</button>
            {editingId !== null && (
              <button type="button" className="secondary-btn" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </form>

          {/* 🔍 Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by item name…"
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 4, marginTop: 8 }}
          />

          {/* Table */}
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Quantity</th>
                <th>Description</th>
                <th style={{ width: 180 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>{item.description}</td>
                    <td>
                      <button className="edit-btn" onClick={() => startEdit(item)}>Edit</button>
                      <button className="delete-btn" onClick={() => deleteItem(item.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" style={{ textAlign: "center" }}>No items found</td></tr>
              )}
            </tbody>
          </table>

          {/* 📑 Pagination */}
          {filtered.length > itemsPerPage && (
            <div style={{ marginTop: 12, display: "flex", gap: 6, justifyContent: "center" }}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="secondary-btn"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={currentPage === i + 1 ? "edit-btn" : "secondary-btn"}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="secondary-btn"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right: Chatbot */}
      <div style={{ width: 340 }}>
        <RuleBasedChatbot items={items} refreshItems={fetchItems} />
      </div>
    </div>
  );
}

export default App;
