import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

const initialForm = {
  name: "",
  species: "cachorro",
  breed: "",
  sex: "macho",
  birth_date: "",
  color: "",
  microchip_number: "",
  is_neutered: false,
  neutered_at: "",
};

export default function PetModal({
  open,
  onClose,
  pet,
  currentUser,
  onSaved,
}) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (pet) {
      setForm({
        name: pet.name || "",
        species: pet.species || "cachorro",
        breed: pet.breed || "",
        sex: pet.sex || "macho",
        birth_date: pet.birth_date || "",
        color: pet.color || "",
        microchip_number: pet.microchip_number || "",
        is_neutered: pet.is_neutered || false,
        neutered_at: pet.neutered_at || "",
      });
    } else {
      setForm(initialForm);
    }
  }, [open, pet]);

  if (!open) return null;

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function getCurrentUserId() {
    if (!currentUser) return null;

    const { data } = await supabase
      .from("users")
      .select("id")
      .ilike("name", currentUser)
      .maybeSingle();

    return data?.id || null;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      alert("Informe o nome do pet.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        species: form.species,
        breed: form.breed.trim() || null,
        sex: form.sex,
        birth_date: form.birth_date || null,
        color: form.color.trim() || null,
        microchip_number:
          form.microchip_number.trim() || null,
        is_neutered: form.is_neutered,
        neutered_at:
          form.is_neutered && form.neutered_at
            ? form.neutered_at
            : null,
        updated_at: new Date().toISOString(),
      };

      let petId = pet?.id || null;

      if (pet) {
        const { error } = await supabase
          .from("pets")
          .update(payload)
          .eq("id", pet.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("pets")
          .insert(payload)
          .select("id")
          .single();

        if (error) throw error;

        petId = data.id;
      }

      const userId = await getCurrentUserId();

      await supabase.from("activity_logs").insert({
        user_id: userId,
        module: "Pets",
        action: pet ? "updated" : "created",
        entity_type: "pet",
        entity_id: petId,
        entity_name: form.name.trim(),
        details: {
          message: pet
            ? `Editou o cadastro de ${form.name.trim()}`
            : `Cadastrou o pet ${form.name.trim()}`,
        },
      });

      await onSaved?.();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar pet:", error);
      alert("Não foi possível salvar o pet.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    padding: "10px 11px",
    fontSize: 13,
    outline: "none",
    background: "#fff",
    color: COLORS.ink,
  };

  const labelStyle = {
    display: "block",
    marginBottom: 5,
    color: COLORS.inkSoft,
    fontSize: 11,
    fontWeight: 700,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,30,40,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 650,
          maxHeight: "90vh",
          overflowY: "auto",
          background: COLORS.surface,
          borderRadius: 18,
          border: `1px solid ${COLORS.border}`,
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18 }}>
            {pet ? "Editar pet" : "Novo pet"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: 0,
              background: "transparent",
              cursor: "pointer",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ padding: 20 }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(190px, 1fr))",
              gap: 12,
            }}
          >
            <div>
              <label style={labelStyle}>Nome *</label>
              <input
                value={form.name}
                onChange={(e) =>
                  updateField("name", e.target.value)
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Espécie</label>
              <select
                value={form.species}
                onChange={(e) =>
                  updateField("species", e.target.value)
                }
                style={inputStyle}
              >
                <option value="cachorro">Cachorro</option>
                <option value="gato">Gato</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Raça</label>
              <input
                value={form.breed}
                onChange={(e) =>
                  updateField("breed", e.target.value)
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Sexo</label>
              <select
                value={form.sex}
                onChange={(e) =>
                  updateField("sex", e.target.value)
                }
                style={inputStyle}
              >
                <option value="macho">Macho</option>
                <option value="femea">Fêmea</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>
                Data de nascimento
              </label>
              <input
                type="date"
                value={form.birth_date}
                onChange={(e) =>
                  updateField(
                    "birth_date",
                    e.target.value
                  )
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Cor</label>
              <input
                value={form.color}
                onChange={(e) =>
                  updateField("color", e.target.value)
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Número do microchip
              </label>
              <input
                value={form.microchip_number}
                onChange={(e) =>
                  updateField(
                    "microchip_number",
                    e.target.value
                  )
                }
                placeholder="Digite o número do microchip"
                style={inputStyle}
              />
            </div>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 16,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <input
              type="checkbox"
              checked={form.is_neutered}
              onChange={(e) =>
                updateField(
                  "is_neutered",
                  e.target.checked
                )
              }
            />

            Castrado(a)
          </label>

          {form.is_neutered && (
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>
                Data da castração
              </label>

              <input
                type="date"
                value={form.neutered_at}
                onChange={(e) =>
                  updateField(
                    "neutered_at",
                    e.target.value
                  )
                }
                style={inputStyle}
              />
            </div>
          )}

          <div
            style={{
              marginTop: 22,
              display: "flex",
              justifyContent: "flex-end",
              gap: 9,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                border: `1px solid ${COLORS.border}`,
                background: "#fff",
                borderRadius: 10,
                padding: "9px 14px",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              style={{
                border: 0,
                background: COLORS.primary,
                color: "#fff",
                borderRadius: 10,
                padding: "9px 15px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {saving ? "Salvando..." : "Salvar pet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}