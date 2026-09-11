import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";

const INITIAL_FORM = {
  title: "",
  description: "",
  maintenance_type: "outros",
  location: "",
  responsible_user_id: "",
  last_maintenance_date: "",
  next_maintenance_date: "",
  is_recurring: false,
  recurrence_frequency: "semestral",
  recurrence_interval: 1,
  estimated_cost: "",
  actual_cost: "",
  provider: "",
  notes: "",
};

function inputStyle() {
  return {
    width: "100%",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 9,
    padding: "9px 10px",
    fontSize: 11,
    color: COLORS.ink,
    background: COLORS.surface,
    outline: "none",
    boxSizing: "border-box",
  };
}

function labelStyle() {
  return {
    display: "block",
    fontSize: 9.5,
    color: COLORS.inkSoft,
    marginBottom: 4,
  };
}

function capitalizeName(name) {
  if (!name) return "";

  return (
    name.charAt(0).toUpperCase() +
    name.slice(1)
  );
}

export default function HouseMaintenanceModal({
  open,
  onClose,
  onSaved,
  user,
  maintenance = null,
  users = [],
}) {
  const [form, setForm] =
    useState(INITIAL_FORM);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (!open) return;

    if (maintenance) {
      setForm({
        title:
          maintenance.title || "",

        description:
          maintenance.description || "",

        maintenance_type:
          maintenance.maintenance_type ||
          "outros",

        location:
          maintenance.location || "",

        responsible_user_id:
          maintenance.responsible_user_id ||
          "",

        last_maintenance_date:
          maintenance.last_maintenance_date ||
          "",

        next_maintenance_date:
          maintenance.next_maintenance_date ||
          "",

        is_recurring:
          Boolean(
            maintenance.is_recurring
          ),

        recurrence_frequency:
          maintenance.recurrence_frequency ||
          "semestral",

        recurrence_interval:
          maintenance.recurrence_interval ||
          1,

        estimated_cost:
          maintenance.estimated_cost ??
          "",

        actual_cost:
          maintenance.actual_cost ??
          "",

        provider:
          maintenance.provider || "",

        notes:
          maintenance.notes || "",
      });
    } else {
      setForm(INITIAL_FORM);
    }
  }, [open, maintenance]);

  if (!open) return null;

  function updateField(
    field,
    value
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.title.trim()) {
      alert(
        "Informe o nome da manutenção."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title:
          form.title.trim(),

        description:
          form.description.trim() ||
          null,

        maintenance_type:
          form.maintenance_type,

        location:
          form.location.trim() ||
          null,

        responsible_user_id:
          form.responsible_user_id ||
          null,

        last_maintenance_date:
          form.last_maintenance_date ||
          null,

        next_maintenance_date:
          form.next_maintenance_date ||
          null,

        is_recurring:
          form.is_recurring,

        recurrence_frequency:
          form.is_recurring
            ? form.recurrence_frequency
            : null,

        recurrence_interval:
          form.is_recurring
            ? Math.max(
                Number(
                  form.recurrence_interval ||
                    1
                ),
                1
              )
            : 1,

        estimated_cost:
          form.estimated_cost !== ""
            ? Number(
                form.estimated_cost
              )
            : null,

        actual_cost:
          form.actual_cost !== ""
            ? Number(
                form.actual_cost
              )
            : null,

        provider:
          form.provider.trim() ||
          null,

        notes:
          form.notes.trim() ||
          null,

        updated_at:
          new Date().toISOString(),
      };

      let savedMaintenance;

      if (maintenance?.id) {
        const {
          data,
          error,
        } = await supabase
          .from(
            "house_maintenances"
          )
          .update(payload)
          .eq(
            "id",
            maintenance.id
          )
          .select()
          .single();

        if (error) {
          throw error;
        }

        savedMaintenance = data;

        await supabase
          .from("activity_logs")
          .insert({
            user_id:
              user?.id || null,

            module: "Casa",

            action: "updated",

            entity_type:
              "house_maintenance",

            entity_id:
              savedMaintenance.id,

            entity_name:
              savedMaintenance.title,

            details: {
              message:
                `Atualizou manutenção da casa: ${savedMaintenance.title}`,
            },
          });
      } else {
        const {
          data,
          error,
        } = await supabase
          .from(
            "house_maintenances"
          )
          .insert({
            ...payload,

            created_by_user_id:
              user?.id || null,
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        savedMaintenance = data;

        await supabase
          .from("activity_logs")
          .insert({
            user_id:
              user?.id || null,

            module: "Casa",

            action: "created",

            entity_type:
              "house_maintenance",

            entity_id:
              savedMaintenance.id,

            entity_name:
              savedMaintenance.title,

            details: {
              message:
                `Criou manutenção da casa: ${savedMaintenance.title}`,
            },
          });
      }

      onSaved?.(
        savedMaintenance
      );

      onClose?.();
    } catch (error) {
      console.error(
        "Erro ao salvar manutenção:",
        error
      );

      alert(
        "Não foi possível salvar a manutenção."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "rgba(20, 30, 40, 0.35)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose?.();
        }
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 640,
          maxHeight: "92vh",
          overflowY: "auto",
          background: COLORS.surface,
          borderRadius: 16,
          border:
            `1px solid ${COLORS.border}`,
          boxShadow:
            "0 18px 60px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            padding: "14px 16px",
            borderBottom:
              `1px solid ${COLORS.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 14,
                color: COLORS.ink,
              }}
            >
              {maintenance
                ? "Editar manutenção"
                : "Nova manutenção"}
            </div>

            <div
              style={{
                marginTop: 2,
                fontSize: 9.5,
                color:
                  COLORS.inkSoft,
              }}
            >
              Controle manutenções,
              revisões e serviços da
              casa.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              border: "none",
              borderRadius: 8,
              background: COLORS.bg,
              color:
                COLORS.inkSoft,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent:
                "center",
            }}
          >
            <X size={15} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            padding: 16,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 10,
            }}
          >
            <div
              style={{
                gridColumn:
                  "1 / -1",
              }}
            >
              <label
                style={labelStyle()}
              >
                Manutenção *
              </label>

              <input
                value={form.title}
                onChange={(event) =>
                  updateField(
                    "title",
                    event.target.value
                  )
                }
                placeholder="Ex.: Limpeza do ar-condicionado"
                style={inputStyle()}
              />
            </div>

            <div>
              <label
                style={labelStyle()}
              >
                Tipo
              </label>

              <select
                value={
                  form.maintenance_type
                }
                onChange={(event) =>
                  updateField(
                    "maintenance_type",
                    event.target.value
                  )
                }
                style={inputStyle()}
              >
                <option value="ar_condicionado">
                  Ar-condicionado
                </option>

                <option value="hidraulica">
                  Hidráulica
                </option>

                <option value="eletrica">
                  Elétrica
                </option>

                <option value="limpeza">
                  Limpeza
                </option>

                <option value="dedetizacao">
                  Dedetização
                </option>

                <option value="filtros">
                  Filtros
                </option>

                <option value="eletrodomesticos">
                  Eletrodomésticos
                </option>

                <option value="estrutura">
                  Estrutura
                </option>

                <option value="jardim">
                  Jardim
                </option>

                <option value="outros">
                  Outros
                </option>
              </select>
            </div>

            <div>
              <label
                style={labelStyle()}
              >
                Local
              </label>

              <input
                value={form.location}
                onChange={(event) =>
                  updateField(
                    "location",
                    event.target.value
                  )
                }
                placeholder="Ex.: Quarto, cozinha..."
                style={inputStyle()}
              />
            </div>

            <div>
              <label
                style={labelStyle()}
              >
                Responsável
              </label>

              <select
                value={
                  form.responsible_user_id
                }
                onChange={(event) =>
                  updateField(
                    "responsible_user_id",
                    event.target.value
                  )
                }
                style={inputStyle()}
              >
                <option value="">
                  Sem responsável
                </option>

                {users.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {capitalizeName(
                        item.name ||
                          item.display_name
                      )}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label
                style={labelStyle()}
              >
                Prestador / empresa
              </label>

              <input
                value={form.provider}
                onChange={(event) =>
                  updateField(
                    "provider",
                    event.target.value
                  )
                }
                placeholder="Opcional"
                style={inputStyle()}
              />
            </div>

            <div>
              <label
                style={labelStyle()}
              >
                Última manutenção
              </label>

              <input
                type="date"
                value={
                  form.last_maintenance_date
                }
                onChange={(event) =>
                  updateField(
                    "last_maintenance_date",
                    event.target.value
                  )
                }
                style={inputStyle()}
              />
            </div>

            <div>
              <label
                style={labelStyle()}
              >
                Próxima manutenção
              </label>

              <input
                type="date"
                value={
                  form.next_maintenance_date
                }
                onChange={(event) =>
                  updateField(
                    "next_maintenance_date",
                    event.target.value
                  )
                }
                style={inputStyle()}
              />
            </div>

            <div>
              <label
                style={labelStyle()}
              >
                Custo estimado
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  form.estimated_cost
                }
                onChange={(event) =>
                  updateField(
                    "estimated_cost",
                    event.target.value
                  )
                }
                placeholder="0,00"
                style={inputStyle()}
              />
            </div>

            <div>
              <label
                style={labelStyle()}
              >
                Custo realizado
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  form.actual_cost
                }
                onChange={(event) =>
                  updateField(
                    "actual_cost",
                    event.target.value
                  )
                }
                placeholder="0,00"
                style={inputStyle()}
              />
            </div>

            <div
              style={{
                gridColumn:
                  "1 / -1",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  fontSize: 10.5,
                  color: COLORS.ink,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={
                    form.is_recurring
                  }
                  onChange={(event) =>
                    updateField(
                      "is_recurring",
                      event.target.checked
                    )
                  }
                />

                Manutenção recorrente
              </label>
            </div>

            {form.is_recurring && (
              <>
                <div>
                  <label
                    style={labelStyle()}
                  >
                    Frequência
                  </label>

                  <select
                    value={
                      form.recurrence_frequency
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "recurrence_frequency",
                        event.target
                          .value
                      )
                    }
                    style={inputStyle()}
                  >
                    <option value="mensal">
                      Mensal
                    </option>

                    <option value="bimestral">
                      Bimestral
                    </option>

                    <option value="trimestral">
                      Trimestral
                    </option>

                    <option value="semestral">
                      Semestral
                    </option>

                    <option value="anual">
                      Anual
                    </option>

                    <option value="personalizada">
                      Personalizada
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    style={labelStyle()}
                  >
                    Intervalo
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={
                      form.recurrence_interval
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "recurrence_interval",
                        event.target
                          .value
                      )
                    }
                    style={inputStyle()}
                  />
                </div>
              </>
            )}

            <div
              style={{
                gridColumn:
                  "1 / -1",
              }}
            >
              <label
                style={labelStyle()}
              >
                Descrição
              </label>

              <textarea
                value={
                  form.description
                }
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value
                  )
                }
                rows={3}
                placeholder="Detalhes sobre a manutenção..."
                style={{
                  ...inputStyle(),
                  resize: "vertical",
                }}
              />
            </div>

            <div
              style={{
                gridColumn:
                  "1 / -1",
              }}
            >
              <label
                style={labelStyle()}
              >
                Observações
              </label>

              <textarea
                value={form.notes}
                onChange={(event) =>
                  updateField(
                    "notes",
                    event.target.value
                  )
                }
                rows={3}
                placeholder="Observações adicionais..."
                style={{
                  ...inputStyle(),
                  resize: "vertical",
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent:
                "flex-end",
              gap: 8,
              marginTop: 16,
              paddingTop: 12,
              borderTop:
                `1px solid ${COLORS.border}`,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                border:
                  `1px solid ${COLORS.border}`,
                borderRadius: 9,
                padding: "8px 13px",
                background:
                  COLORS.surface,
                color:
                  COLORS.inkSoft,
                cursor: "pointer",
                fontSize: 10.5,
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
                background:
                  COLORS.primary,
                color: "#fff",
                cursor: saving
                  ? "default"
                  : "pointer",
                fontSize: 10.5,
                opacity: saving
                  ? 0.65
                  : 1,
              }}
            >
              {saving
                ? "Salvando..."
                : maintenance
                  ? "Salvar alterações"
                  : "Criar manutenção"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}