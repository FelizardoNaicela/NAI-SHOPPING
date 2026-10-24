import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../services/api";
import StoreTypePicker from "../components/store/StoreTypePicker";
import type { StoreType } from "../shared/storeTypes";
import styles from "./CreateStorePage.module.css";

export default function CreateStorePage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<StoreType>("GENERAL_STORE");

  const navigate = useNavigate();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      alert("Introduza o nome da banca.");
      return;
    }

    if (!description.trim()) {
      alert("Introduza uma descrição.");
      return;
    }

    try {
      const res = await api.post("/stores", {
        name: name.trim(),
        description: description.trim(),
        type,
      });

      localStorage.setItem("storeId", res.data.id);

      alert("Banca criada com sucesso!");

      navigate(`/stores/${res.data.id}`);
    } catch (err: any) {
      const message = err?.response?.data?.message;

      alert(
        Array.isArray(message)
          ? message.join("\n")
          : message || "Erro ao criar banca",
      );
    }
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Criar Banca</h2>

      <form className={styles.form} onSubmit={handleCreate}>
        <input
          className={styles.input}
          required
          maxLength={25}
          placeholder="Nome da banca"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <textarea
          className={styles.textarea}
          required
          placeholder="Descrição"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        <StoreTypePicker value={type} onChange={setType} />

        <button className={styles.button}>Criar</button>
      </form>
    </div>
  );
}