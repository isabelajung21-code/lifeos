import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

const INITIAL_FORM = {
  name: "",
  asset_type: "movel",
  room: "",
  brand: "",
  model: "",
  serial_number: "",
  purchase_date: "",
  purchase_value: "",
  store: "",
  warranty_until: "",
  status: "em_uso",
  notes: "",
};

export default function HouseAssetModal({
  open,
  onClose,
  onSaved,
  user,
  asset = null,
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (asset) {
      setForm({
        name: asset.name || "",
        asset_type: asset.asset_type || "movel",
        room: asset.room || "",
        brand: asset.brand || "",
        model: asset.model || "",
        serial_number: asset.serial_number || "",
        purchase_date: asset.purchase_date || "",
        purchase_value:
          asset.purchase_value != null
            ? String(asset.purchase_value)
            : "",
        store: asset.store || "",
        warranty_until: asset.warranty_until || "",
        status: asset.status || "em_uso",
        notes: asset.notes || "",
      });
    } else {
      setForm(INITIAL_FORM);
    }
  }, [open, asset]);

  if (!open) return null;

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      alert("Informe o nome do item.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        asset_type: form.asset_type,
        room: form.room.trim() || null,
        brand: form.brand.trim() || null,
        model: form.model.trim() || null,
        serial_number:
          form.serial_number.trim() || null,

        purchase_date:
          form.purchase_date || null,

        purchase_value:
          form.purchase_value !== ""
            ? Number(form.purchase_value)
            : null,

        store: form.store.trim() || null,

        warranty_until:
          form.warranty_until || null,

        status: form.status,

        notes: form.notes.trim() || null,

        updated_at: new Date().toISOString(),
      };

      let savedAsset;

      if (asset?.id) {
        const { data, error } = await supabase
          .from("house_assets")
          .update(payload)
          .eq("id", asset.id)
          .select()
          .single();

        if (error) throw error;

        savedAsset = data;
      } else {
        const { data, error } = await supabase
          .from("house_assets")
          .insert({
            ...payload,
            created_by_user_id:
              user?.id || null,
          })
          .select()
          .single();

        if (error) throw error;

        savedAsset = data;
      }

      const action = asset?.id
        ? "updated"
        : "created";

      const { error: logError } = await supabase
        .from("activity_logs")
        .insert({
          user_id: user?.id || null,
          module: "Casa",
          action,
          entity_type: "house_asset",
          entity_id: savedAsset.id,
          entity_name: savedAsset.name,
          details: {
            message: asset?.id
              ? `Editou o item da casa: ${savedAsset.name}`
              : `Cadastrou o item da casa: ${savedAsset.name}`,
          },
        });

      if (logError) {
        console.error(
          "Erro ao registrar atividade:",
          logError
        );
      }

      if (onSaved) {
        await onSaved(savedAsset);
      }

      onClose();
    } catch (error) {
      console.error(
        "Erro ao salvar móvel/eletro:",
        error
      );

      alert(
        "Não foi possível salvar o item."
      );
    } finally {
      setSaving(false);
    }
  }

  const fieldStyle = {
    width: "100%",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 9,
    padding: "9px 10px",
    fontSize: 12,
    color: COLORS.ink,
    background: "#fff",
    boxSizing: "border-box",
    outline: "none",
  };

  const labelStyle = {
    display: "grid",
    gap: 5,
    fontSize: 10,
    color: COLORS.inkSoft,
  };

  return (
    <div
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 1000,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 620,
          maxHeight: "90vh",
          overflowY: "auto",
          background: COLORS.surface,
          borderRadius: 16,
          padding: 20,
          boxShadow:
            "0 18px 50px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              fontSize: 16,
              color: COLORS.ink,
            }}
          >
            {asset
              ? "Editar móvel ou eletro"
              : "Novo móvel ou eletro"}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: COLORS.inkSoft,
              fontSize: 20,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <label
            style={{
              ...labelStyle,
              gridColumn: "1 / -1",
            }}
          >
            Nome *
            <input
              value={form.name}
              onChange={(e) =>
                updateField(
                  "name",
                  e.target.value
                )
              }
              placeholder="Ex.: Geladeira"
              style={fieldStyle}
            />
          </label>

          <label style={labelStyle}>
            Tipo
            <select
              value={form.asset_type}
              onChange={(e) =>
                updateField(
                  "asset_type",
                  e.target.value
                )
              }
              style={fieldStyle}
            >
              <option value="movel">
                Móvel
              </option>
              <option value="eletrodomestico">
                Eletrodoméstico
              </option>
              <option value="eletronico">
                Eletrônico
              </option>
              <option value="decoracao">
                Decoração
              </option>
              <option value="utilidade">
                Utilidade
              </option>
              <option value="outros">
                Outros
              </option>
            </select>
          </label>

          <label style={labelStyle}>
            Cômodo / local
            <input
              value={form.room}
              onChange={(e) =>
                updateField(
                  "room",
                  e.target.value
                )
              }
              placeholder="Ex.: Cozinha"
              style={fieldStyle}
            />
          </label>

          <label style={labelStyle}>
            Marca
            <input
              value={form.brand}
              onChange={(e) =>
                updateField(
                  "brand",
                  e.target.value
                )
              }
              placeholder="Ex.: Samsung"
              style={fieldStyle}
            />
          </label>

          <label style={labelStyle}>
            Modelo
            <input
              value={form.model}
              onChange={(e) =>
                updateField(
                  "model",
                  e.target.value
                )
              }
              style={fieldStyle}
            />
          </label>

          <label
            style={{
              ...labelStyle,
              gridColumn: "1 / -1",
            }}
          >
            Número de série
            <input
              value={form.serial_number}
              onChange={(e) =>
                updateField(
                  "serial_number",
                  e.target.value
                )
              }
              style={fieldStyle}
            />
          </label>

          <label style={labelStyle}>
            Data da compra
            <input
              type="date"
              value={form.purchase_date}
              onChange={(e) =>
                updateField(
                  "purchase_date",
                  e.target.value
                )
              }
              style={fieldStyle}
            />
          </label>

          <label style={labelStyle}>
            Valor da compra
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.purchase_value}
              onChange={(e) =>
                updateField(
                  "purchase_value",
                  e.target.value
                )
              }
              placeholder="0,00"
              style={fieldStyle}
            />
          </label>

          <label style={labelStyle}>
            Loja
            <input
              value={form.store}
              onChange={(e) =>
                updateField(
                  "store",
                  e.target.value
                )
              }
              style={fieldStyle}
            />
          </label>

          <label style={labelStyle}>
            Garantia até
            <input
              type="date"
              value={form.warranty_until}
              onChange={(e) =>
                updateField(
                  "warranty_until",
                  e.target.value
                )
              }
              style={fieldStyle}
            />
          </label>

          <label
            style={{
              ...labelStyle,
              gridColumn: "1 / -1",
            }}
          >
            Status
            <select
              value={form.status}
              onChange={(e) =>
                updateField(
                  "status",
                  e.target.value
                )
              }
              style={fieldStyle}
            >
              <option value="em_uso">
                Em uso
              </option>
              <option value="guardado">
                Guardado
              </option>
              <option value="emprestado">
                Emprestado
              </option>
              <option value="vendido">
                Vendido
              </option>
              <option value="descartado">
                Descartado
              </option>
            </select>
          </label>

          <label
            style={{
              ...labelStyle,
              gridColumn: "1 / -1",
            }}
          >
            Observações
            <textarea
              value={form.notes}
              onChange={(e) =>
                updateField(
                  "notes",
                  e.target.value
                )
              }
              rows={4}
              style={{
                ...fieldStyle,
                resize: "vertical",
              }}
            />
          </label>
        </div>

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
            disabled={saving}
            style={{
              border: `1px solid ${COLORS.border}`,
              borderRadius: 9,
              padding: "8px 12px",
              background: "#fff",
              color: COLORS.inkSoft,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving}
            style={{
              border: "none",
              borderRadius: 9,
              padding: "8px 14px",
              background: COLORS.primary,
              color: "#fff",
              cursor: saving
                ? "wait"
                : "pointer",
            }}
          >
            {saving
              ? "Salvando..."
              : asset
              ? "Salvar alterações"
              : "Cadastrar item"}
          </button>
        </div>
      </form>
    </div>
  );
}