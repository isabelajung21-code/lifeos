import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

const initialForm = {
  name: "",
  institution: "",
  type: "conta_corrente",
  initial_balance: "",
  notes: "",
  is_active: true,
};

export default function AccountModal({
  open,
  onClose,
  currentUser,
  onSaved,
  accountToEdit,
}) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setError("");

    if (accountToEdit) {
      setForm({
        name: accountToEdit.name || "",
        institution: accountToEdit.institution || "",
        type: accountToEdit.type || "conta_corrente",
        initial_balance: accountToEdit.initial_balance ?? "",
        notes: accountToEdit.notes || "",
        is_active: accountToEdit.is_active ?? true,
      });
    } else {
      setForm(initialForm);
    }
  }, [open, accountToEdit]);

  function handleChange(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Informe o nome da conta.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("display_name", currentUser)
        .single();

      if (userError) throw userError;

      const payload = {
        name: form.name.trim(),
        institution: form.institution.trim() || null,
        type: form.type,
        initial_balance: Number(form.initial_balance || 0),
        notes: form.notes.trim() || null,
        is_active: form.is_active,
        created_by_user_id: user.id,
      };

      let result;

      if (accountToEdit) {
        result = await supabase
          .from("finance_accounts")
          .update(payload)
          .eq("id", accountToEdit.id);
      } else {
        result = await supabase
          .from("finance_accounts")
          .insert(payload);
      }

      if (result.error) throw result.error;

      await supabase.from("activity_logs").insert({
        user_id: user.id,
        action: accountToEdit ? "updated" : "created",
        entity_type: "finance_account",
        entity_id: accountToEdit?.id || null,
        description: accountToEdit
          ? `Alterou conta financeira: ${payload.name}`
          : `Criou conta financeira: ${payload.name}`,
      });

      onSaved?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      setError(err.message || "Não foi possível salvar a conta.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const labelStyle = {
    fontSize: 11,
    fontWeight: 600,
    color: COLORS.inkSoft,
    marginBottom: 5,
    display: "block",
  };

  const inputStyle = {
    width: "100%",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 9,
    padding: "9px 10px",
    fontSize: 12,
    color: COLORS.ink,
    background: COLORS.surface,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(25,35,45,.42)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "min(600px, 96vw)",
          maxHeight: "92vh",
          overflowY: "auto",
          background: COLORS.surface,
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 22px 65px rgba(0,0,0,.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 750,
                color: COLORS.ink,
              }}
            >
              {accountToEdit ? "Editar conta" : "Nova conta"}
            </div>

            <div
              style={{
                fontSize: 11,
                color: COLORS.inkSoft,
                marginTop: 2,
              }}
            >
              Conta bancária, carteira ou investimento
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              border: "none",
              background: COLORS.bg,
              borderRadius: 9,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={17} />
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Nome da conta</label>
            <input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Ex.: Nubank, Itaú, Dinheiro..."
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Instituição</label>
            <input
              value={form.institution}
              onChange={(e) =>
                handleChange("institution", e.target.value)
              }
              placeholder="Ex.: Nubank"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Tipo</label>
            <select
              value={form.type}
              onChange={(e) => handleChange("type", e.target.value)}
              style={inputStyle}
            >
              <option value="conta_corrente">Conta corrente</option>
              <option value="poupanca">Poupança</option>
              <option value="carteira">Carteira / Dinheiro</option>
              <option value="investimento">Investimento</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Saldo inicial</label>
            <input
              type="number"
              step="0.01"
              value={form.initial_balance}
              onChange={(e) =>
                handleChange("initial_balance", e.target.value)
              }
              placeholder="0,00"
              style={inputStyle}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Observações</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />
          </div>

          <label
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontSize: 11,
              color: COLORS.ink,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                handleChange("is_active", e.target.checked)
              }
            />

            Conta ativa
          </label>
        </div>

        {error && (
          <div
            style={{
              marginTop: 12,
              padding: "9px 11px",
              background: COLORS.dangerLight,
              color: COLORS.danger,
              borderRadius: 8,
              fontSize: 11,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 18,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              border: `1px solid ${COLORS.border}`,
              background: COLORS.surface,
              color: COLORS.ink,
              borderRadius: 9,
              padding: "9px 14px",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving}
            style={{
              border: "none",
              background: COLORS.primary,
              color: "#fff",
              borderRadius: 9,
              padding: "9px 16px",
              cursor: saving ? "default" : "pointer",
              fontSize: 12,
              fontWeight: 650,
              opacity: saving ? 0.65 : 1,
            }}
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}