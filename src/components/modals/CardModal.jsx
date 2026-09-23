import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

const initialForm = {
  name: "",
  institution: "",
  limit_value: "",
  closing_day: "",
  due_day: "",
  payment_account_id: "",
  notes: "",
  is_active: true,
};

export default function CardModal({
  open,
  onClose,
  currentUser,
  onSaved,
  cardToEdit,
}) {
  const [form, setForm] = useState(initialForm);
  const [accounts, setAccounts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    loadAccounts();
    setError("");

    if (cardToEdit) {
      setForm({
        name: cardToEdit.name || "",
        institution: cardToEdit.institution || "",
        limit_value: cardToEdit.limit_value ?? "",
        closing_day: cardToEdit.closing_day ?? "",
        due_day: cardToEdit.due_day ?? "",
        payment_account_id: cardToEdit.payment_account_id || "",
        notes: cardToEdit.notes || "",
        is_active: cardToEdit.is_active ?? true,
      });
    } else {
      setForm(initialForm);
    }
  }, [open, cardToEdit]);

  async function loadAccounts() {
    const { data, error } = await supabase
      .from("finance_accounts")
      .select("*")
      .is("deleted_at", null)
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error(error);
      return;
    }

    setAccounts(data || []);
  }

  function handleChange(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Informe o nome do cartão.");
      return;
    }

    if (
      form.closing_day &&
      (Number(form.closing_day) < 1 ||
        Number(form.closing_day) > 31)
    ) {
      setError("O dia de fechamento deve ser entre 1 e 31.");
      return;
    }

    if (
      form.due_day &&
      (Number(form.due_day) < 1 || Number(form.due_day) > 31)
    ) {
      setError("O dia de vencimento deve ser entre 1 e 31.");
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
        limit_value:
          form.limit_value === ""
            ? null
            : Number(form.limit_value),
        closing_day:
          form.closing_day === ""
            ? null
            : Number(form.closing_day),
        due_day:
          form.due_day === ""
            ? null
            : Number(form.due_day),
        payment_account_id: form.payment_account_id || null,
        notes: form.notes.trim() || null,
        is_active: form.is_active,
        created_by_user_id: user.id,
      };

      let result;

      if (cardToEdit) {
        result = await supabase
          .from("finance_cards")
          .update(payload)
          .eq("id", cardToEdit.id);
      } else {
        result = await supabase
          .from("finance_cards")
          .insert(payload);
      }

      if (result.error) throw result.error;

      await supabase.from("activity_logs").insert({
        user_id: user.id,
        module: "Financeiro",
        action: cardToEdit ? "updated" : "created",
        entity_type: "finance_card",
        entity_id: cardToEdit?.id || null,
        entity_name: payload.name,
        details: {
          message: cardToEdit
            ? `Alterou cartão: ${payload.name}`
            : `Criou cartão: ${payload.name}`,
          closing_day: payload.closing_day,
          due_day: payload.due_day,
          limit_value: payload.limit_value,
        },
      });

      onSaved?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      setError(err.message || "Não foi possível salvar o cartão.");
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
          width: "min(650px, 96vw)",
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
              {cardToEdit ? "Editar cartão" : "Novo cartão"}
            </div>

            <div
              style={{
                fontSize: 11,
                color: COLORS.inkSoft,
                marginTop: 2,
              }}
            >
              Limite, fechamento e vencimento
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
            <label style={labelStyle}>Nome do cartão</label>
            <input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Ex.: Nubank Platinum"
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
            <label style={labelStyle}>Limite</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.limit_value}
              onChange={(e) =>
                handleChange("limit_value", e.target.value)
              }
              placeholder="0,00"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Dia do fechamento</label>
            <input
              type="number"
              min="1"
              max="31"
              value={form.closing_day}
              onChange={(e) =>
                handleChange("closing_day", e.target.value)
              }
              placeholder="Ex.: 5"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Dia do vencimento</label>
            <input
              type="number"
              min="1"
              max="31"
              value={form.due_day}
              onChange={(e) =>
                handleChange("due_day", e.target.value)
              }
              placeholder="Ex.: 12"
              style={inputStyle}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Conta usada para pagamento</label>
            <select
              value={form.payment_account_id}
              onChange={(e) =>
                handleChange(
                  "payment_account_id",
                  e.target.value
                )
              }
              style={inputStyle}
            >
              <option value="">Nenhuma definida</option>

              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
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

            Cartão ativo
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