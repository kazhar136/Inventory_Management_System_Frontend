import React from "react";
import axios from "axios";

const ItemList = ({ items, refreshItems }) => {
  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:8000/items/${id}`);
    refreshItems();
  };

  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>
          <strong>{item.name}</strong> ({item.quantity}) - {item.description}
          <button onClick={() => handleDelete(item.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
};

export default ItemList;
