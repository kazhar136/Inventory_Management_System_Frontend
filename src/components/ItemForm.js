import React, { useState } from "react";
import axios from "axios";

const ItemForm = ({ onItemAdded }) => {
  const [form, setForm] = useState({ name: "", quantity: "", description: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post("http://localhost:8000/items", form);
    onItemAdded(); // Refresh list
    setForm({ name: "", quantity: "", description: "" }); // Reset form
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" value={form.name} onChange={handleChange} placeholder="Item Name" required />
      <input name="quantity" type="number" value={form.quantity} onChange={handleChange} placeholder="Quantity" required />
      <input name="description" value={form.description} onChange={handleChange} placeholder="Description" />
      <button type="submit">Add Item</button>
    </form>
  );
};

export default ItemForm;
