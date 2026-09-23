import { useEffect, useMemo, useState } from "react";
import {
  Cat,
  Dog,
  HeartPulse,
  PawPrint,
  Pencil,
  Plus,
  Syringe,
  Trash2,
  Scale,
  TrendingUp,
  CalendarDays,
  Stethoscope,
  CircleDollarSign,
} from "lucide-react";
import { supabase } from "../../services/supabase";
import { COLORS } from "../../constants/theme";
import PetVaccinationModal from "../../components/modals/PetVaccinationModal";
import PetDewormingModal from "../../components/modals/PetDewormingModal";
import PetMedicationModal from "../../components/modals/PetMedicationModal";
import PetHealthPlanModal from "../../components/modals/PetHealthPlanModal";
import PetWeightModal from "../../components/modals/PetWeightModal";
import PetAppointmentModal from "../../components/modals/PetAppointmentModal";
import TransactionModal from "../../components/modals/TransactionModal";



function formatDate(date) {
  if (!date) return "Não informado";

  return new Date(`${date}T12:00:00`).toLocaleDateString(
    "pt-BR"
  );
}

function calculateAge(birthDate) {
  if (!birthDate) return "Idade não informada";

  const birth = new Date(`${birthDate}T12:00:00`);
  const today = new Date();

  let years =
    today.getFullYear() - birth.getFullYear();

  let months =
    today.getMonth() - birth.getMonth();

  if (today.getDate() < birth.getDate()) {
    months -= 1;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years <= 0) {
    return `${months} ${
      months === 1 ? "mês" : "meses"
    }`;
  }

  if (months === 0) {
    return `${years} ${
      years === 1 ? "ano" : "anos"
    }`;
  }

  return `${years} ${
    years === 1 ? "ano" : "anos"
  } e ${months} ${
    months === 1 ? "mês" : "meses"
  }`;
}

function speciesLabel(species) {
  if (species === "cachorro") return "Cachorro";
  if (species === "gato") return "Gato";

  return species || "Não informado";
}

function sexLabel(sex) {
  if (sex === "macho") return "Macho";
  if (sex === "femea") return "Fêmea";

  return "Não informado";
}

function PetIcon({ species, size = 22 }) {
  if (species === "gato") {
    return <Cat size={size} />;
  }

  return <Dog size={size} />;
}

function WeightChart({ weights }) {
  if (!weights || weights.length < 2) {
    return (
      <div
        style={{
          height: 150,
          border:
            `1px dashed ${COLORS.border}`,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: 16,
          color: COLORS.inkSoft,
          fontSize: 11,
        }}
      >
        Registre pelo menos duas
        pesagens para visualizar a
        evolução.
      </div>
    );
  }

  const values = weights.map(
    (item) => Number(item.weight)
  );

  const minWeight =
    Math.min(...values);
  const maxWeight =
    Math.max(...values);

  const width = 600;
  const height = 190;

  const paddingLeft = 42;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 34;

  const usableWidth =
    width -
    paddingLeft -
    paddingRight;

  const usableHeight =
    height -
    paddingTop -
    paddingBottom;

  const range =
    maxWeight - minWeight || 1;

  const points = weights.map(
    (item, index) => {
      const x =
        paddingLeft +
        (index /
          (weights.length - 1)) *
          usableWidth;

      const normalized =
        (Number(item.weight) -
          minWeight) /
        range;

      const y =
        paddingTop +
        usableHeight -
        normalized *
          usableHeight;

      return {
        x,
        y,
        item,
      };
    }
  );

  const polylinePoints =
    points
      .map(
        (point) =>
          `${point.x},${point.y}`
      )
      .join(" ");

  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{
          width: "100%",
          minWidth: 440,
          display: "block",
        }}
      >
        <line
          x1={paddingLeft}
          y1={
            height - paddingBottom
          }
          x2={
            width - paddingRight
          }
          y2={
            height - paddingBottom
          }
          stroke={COLORS.border}
        />

        <polyline
          points={polylinePoints}
          fill="none"
          stroke={COLORS.primary}
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map(
          (point, index) => (
            <g key={point.item.id}>
              <circle
                cx={point.x}
                cy={point.y}
                r="5"
                fill={
                  COLORS.primary
                }
              />

              <text
                x={point.x}
                y={
                  point.y - 11
                }
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill={COLORS.ink}
              >
                {Number(
                  point.item.weight
                ).toLocaleString(
                  "pt-BR",
                  {
                    maximumFractionDigits:
                      2,
                  }
                )}{" "}
                kg
              </text>

              <text
                x={point.x}
                y={
                  height - 12
                }
                textAnchor="middle"
                fontSize="9"
                fill={
                  COLORS.inkSoft
                }
              >
                {new Date(
                  `${point.item.measured_at}T12:00:00`
                ).toLocaleDateString(
                  "pt-BR",
                  {
                    day: "2-digit",
                    month: "2-digit",
                  }
                )}
              </text>
            </g>
          )
        )}
      </svg>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          textTransform: "uppercase",
          fontWeight: 800,
          color: COLORS.inkSoft,
          marginBottom: 4,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 13,
          color: COLORS.ink,
          fontWeight: 600,
          wordBreak: "break-word",
        }}
      >
        {value || "Não informado"}
      </div>
    </div>
  );
}

export default function PetsPage({ currentUser }) {
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [vaccinations, setVaccinations] =
    useState([]);

    const [
    vaccinationModalOpen,
    setVaccinationModalOpen,
    ] = useState(false);

    const [
    editingVaccination,
    setEditingVaccination,
    ] = useState(null);

    const [dewormings, setDewormings] =
        useState([]);

        const [
        dewormingModalOpen,
        setDewormingModalOpen,
        ] = useState(false);

        const [
        editingDeworming,
        setEditingDeworming,
        ] = useState(null);

    const [medications, setMedications] =
      useState([]);

    const [
      medicationModalOpen,
      setMedicationModalOpen,
    ] = useState(false);

    const [
      editingMedication,
      setEditingMedication,
    ] = useState(null);

    const [healthPlans, setHealthPlans] =
      useState([]);

    const [
      healthPlanModalOpen,
      setHealthPlanModalOpen,
    ] = useState(false);

    const [
      editingHealthPlan,
      setEditingHealthPlan,
    ] = useState(null);

    const [weights, setWeights] =
      useState([]);

    const [
      weightModalOpen,
      setWeightModalOpen,
    ] = useState(false);

    const [
      editingWeight,
      setEditingWeight,
    ] = useState(null);

    const [appointments, setAppointments] =
      useState([]);

    const [
      appointmentModalOpen,
      setAppointmentModalOpen,
    ] = useState(false);

    const [
      editingAppointment,
      setEditingAppointment,
    ] = useState(null);

    const [petExpenses, setPetExpenses] =
      useState([]);

    const [
      petExpenseModalOpen,
      setPetExpenseModalOpen,
    ] = useState(false);

    const [
      editingPetExpense,
      setEditingPetExpense,
    ] = useState(null);

  useEffect(() => {
    loadPets();
  }, []);

  async function loadPets() {
    try {
      setLoading(true);

      const [
        { data: petsData, error: petsError },
        {
            data: vaccinationsData,
            error: vaccinationsError,
        },
        {
            data: dewormingsData,
            error: dewormingsError,
        },
        {
          data: medicationsData,
          error: medicationsError,
        },
        {
          data: healthPlansData,
          error: healthPlansError,
        },
        {
          data: weightsData,
          error: weightsError,
        },
        {
          data: appointmentsData,
          error: appointmentsError,
        },
        {
          data: petExpensesData,
          error: petExpensesError,
        },

        ] = await Promise.all([
        supabase
            .from("pets")
            .select("*")
            .is("deleted_at", null)
            .order("created_at", {
            ascending: true,
            }),

        supabase
            .from("pet_vaccinations")
            .select("*")
            .is("deleted_at", null)
            .order("applied_at", {
            ascending: false,
            nullsFirst: false,
            }),

        supabase
            .from("pet_deworming")
            .select("*")
            .is("deleted_at", null)
            .order("applied_at", {
            ascending: false,
            nullsFirst: false,
            }),

        supabase
          .from("pet_medications")
          .select("*")
          .is("deleted_at", null)
          .order("start_date", {
            ascending: false,
            nullsFirst: false,
          }),

        supabase
          .from("pet_health_plans")
          .select("*")
          .is("deleted_at", null)
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("pet_weights")
          .select("*")
          .is("deleted_at", null)
          .order("measured_at", {
            ascending: true,
          }),

        supabase
          .from("pet_appointments")
          .select("*")
          .is("deleted_at", null)
          .order("appointment_date", {
            ascending: false,
          }),

        supabase
          .from("finance_transactions")
          .select(`
            *,
            category:finance_categories(id, name),
            account:finance_accounts(id, name),
            card:finance_cards(id, name)
          `)
          .eq("source_module", "pets")
          .is("deleted_at", null)
          .order("transaction_date", {
            ascending: false,
          }),

        ]);

        if (petsError) throw petsError;

        if (vaccinationsError) {
            throw vaccinationsError;
        }
        if (dewormingsError) {
            throw dewormingsError;
        }
        if (medicationsError) {
          throw medicationsError;
        }
        if (healthPlansError) {
          throw healthPlansError;
        }
        if (weightsError) {
          throw weightsError;
        }
        if (appointmentsError) {
          throw appointmentsError;
        }
        if (petExpensesError) {
          throw petExpensesError;
        }

        const petOrder = [
          "Nego",
          "Zoe",
          "Poppy",
          "Flokinho",
        ];

        const loadedPets = (petsData || []).sort(
          (a, b) => {
            const indexA = petOrder.indexOf(a.name);
            const indexB = petOrder.indexOf(b.name);

            if (indexA === -1 && indexB === -1) {
              return a.name.localeCompare(b.name);
            }

            if (indexA === -1) return 1;
            if (indexB === -1) return -1;

            return indexA - indexB;
          }
        );

        setVaccinations(
            vaccinationsData || []
        );
        setDewormings(
            dewormingsData || []
        );
        setMedications(
          medicationsData || []
        );
        setHealthPlans(
          healthPlansData || []
        );
        setWeights(weightsData || []);
        setAppointments(
          appointmentsData || []
        );
        setPetExpenses(
          petExpensesData || []
        );

      setPets(loadedPets);

      if (loadedPets.length > 0) {
        setSelectedPetId((current) => {
          const stillExists =
            loadedPets.some(
              (pet) => pet.id === current
            );

          if (stillExists) {
            return current;
          }

          return loadedPets[0].id;
        });
      }
    } catch (error) {
      console.error(
        "Erro ao carregar pets:",
        error
      );

      alert(
        "Não foi possível carregar os pets."
      );
    } finally {
      setLoading(false);
    }
  }

  const selectedPet = useMemo(() => {
    return (
      pets.find(
        (pet) => pet.id === selectedPetId
      ) || null
    );
  }, [pets, selectedPetId]);

  const selectedPetVaccinations =
    useMemo(() => {
        if (!selectedPetId) return [];

        return vaccinations.filter(
        (vaccination) =>
            vaccination.pet_id ===
            selectedPetId
        );
    }, [
        vaccinations,
        selectedPetId,
    ]);

    const selectedPetDewormings =
        useMemo(() => {
            if (!selectedPetId) return [];

            return dewormings.filter(
            (item) =>
                item.pet_id === selectedPetId
            );
        }, [dewormings, selectedPetId]);

        function monthName(month) {
        const months = [
            "",
            "Janeiro",
            "Fevereiro",
            "Março",
            "Abril",
            "Maio",
            "Junho",
            "Julho",
            "Agosto",
            "Setembro",
            "Outubro",
            "Novembro",
            "Dezembro",
        ];

        return months[Number(month)] || "";
        }

        function openNewDeworming() {
        setEditingDeworming(null);
        setDewormingModalOpen(true);
        }

        function openEditDeworming(item) {
        setEditingDeworming(item);
        setDewormingModalOpen(true);
        }

        async function deleteDeworming(item) {
        
        try {
            let userId = null;

            if (currentUser) {
            const { data: userData } =
                await supabase
                .from("users")
                .select("id")
                .ilike("name", currentUser)
                .maybeSingle();

            userId = userData?.id || null;
            }

            const { error } = await supabase
            .from("pet_deworming")
            .update({
                deleted_at:
                new Date().toISOString(),
                deleted_by: userId,
            })
            .eq("id", item.id);

            if (error) throw error;

            await supabase
            .from("activity_logs")
            .insert({
                user_id: userId,
                module: "Pets",
                action: "deleted",
                entity_type: "pet_deworming",
                entity_id: item.id,
                entity_name:
                item.medication_name ||
                "Lembrete de vermífugo",
                details: {
                message:
                    `Moveu vermífugo de ${selectedPet?.name} para a lixeira`,
                pet_id: selectedPet?.id,
                pet_name: selectedPet?.name,
                },
            });

            await loadPets();
        } catch (error) {
            console.error(
            "Erro ao excluir vermífugo:",
            error
            );

            alert(
            "Não foi possível mover o vermífugo para a Lixeira."
            );
        }
    }

    const selectedPetMedications =
      useMemo(() => {
        if (!selectedPetId) return [];

        return medications.filter(
          (item) =>
            item.pet_id === selectedPetId
        );
      }, [medications, selectedPetId]);

    const selectedPetHealthPlan =
      useMemo(() => {
        if (!selectedPetId) return null;

        return (
          healthPlans.find(
            (plan) =>
              plan.pet_id === selectedPetId
          ) || null
        );
      }, [healthPlans, selectedPetId]);

    const selectedPetWeights =
      useMemo(() => {
        if (!selectedPetId) return [];

        return weights
          .filter(
            (item) =>
              item.pet_id === selectedPetId
          )
          .sort((a, b) =>
            String(
              a.measured_at
            ).localeCompare(
              String(b.measured_at)
            )
          );
      }, [weights, selectedPetId]);

    const selectedPetAppointments =
      useMemo(() => {
        if (!selectedPetId) return [];

        return appointments.filter(
          (item) =>
            item.pet_id === selectedPetId
        );
      }, [appointments, selectedPetId]);

    const selectedPetExpenses =
      useMemo(() => {
        if (!selectedPetId) return [];

        return petExpenses.filter(
          (item) =>
            item.source_id ===
            selectedPetId
        );
      }, [
        petExpenses,
        selectedPetId,
      ]);

    const selectedPetExpensesTotal =
      useMemo(() => {
        return selectedPetExpenses
          .filter(
            (item) =>
              item.type === "despesa" &&
              item.status !== "cancelado"
          )
          .reduce(
            (sum, item) =>
              sum +
              Number(item.amount || 0),
            0
          );
      }, [selectedPetExpenses]);

    function openNewVaccination() {
        setEditingVaccination(null);
        setVaccinationModalOpen(true);
        }

        function openEditVaccination(
        vaccination
        ) {
        setEditingVaccination(vaccination);
        setVaccinationModalOpen(true);
        }

        async function deleteVaccination(
        vaccination
        ) {
        

        try {
            const deletedAt =
            new Date().toISOString();

            let userId = null;

            if (currentUser) {
            const { data: userData } =
                await supabase
                .from("users")
                .select("id")
                .ilike("name", currentUser)
                .maybeSingle();

            userId = userData?.id || null;
            }

            const { error } = await supabase
            .from("pet_vaccinations")
            .update({
                deleted_at: deletedAt,
                deleted_by: userId,
            })
            .eq("id", vaccination.id);

            if (error) throw error;

            await supabase
            .from("activity_logs")
            .insert({
                user_id: userId,
                module: "Pets",
                action: "deleted",
                entity_type:
                "pet_vaccination",
                entity_id: vaccination.id,
                entity_name:
                vaccination.vaccine_name,
                details: {
                message:
                    `Moveu a vacina para a lixeira: ${vaccination.vaccine_name}`,
                pet_id: selectedPet?.id,
                pet_name: selectedPet?.name,
                },
            });

            await loadPets();
        } catch (error) {
            console.error(
            "Erro ao excluir vacina:",
            error
            );

            alert(
            "Não foi possível mover a vacina para a Lixeira."
            );
        }
    }

    function openNewMedication() {
      setEditingMedication(null);
      setMedicationModalOpen(true);
    }

    function openEditMedication(item) {
      setEditingMedication(item);
      setMedicationModalOpen(true);
    }

    function medicationStatus(item) {
      if (item.is_continuous) {
        return {
          label: "Uso contínuo",
          active: true,
        };
      }

      if (!item.end_date) {
        return {
          label: "Sem término definido",
          active: true,
        };
      }

      const today =
        new Date().toISOString().slice(0, 10);

      if (item.end_date >= today) {
        return {
          label: "Em tratamento",
          active: true,
        };
      }

      return {
        label: "Finalizado",
        active: false,
      };
    }

    async function deleteMedication(item) {

      try {
        let userId = null;

        if (currentUser) {
          const { data: userData } =
            await supabase
              .from("users")
              .select("id")
              .ilike("name", currentUser)
              .maybeSingle();

          userId = userData?.id || null;
        }

        const { error } = await supabase
          .from("pet_medications")
          .update({
            deleted_at:
              new Date().toISOString(),
            deleted_by: userId,
          })
          .eq("id", item.id);

        if (error) throw error;

        await supabase
          .from("activity_logs")
          .insert({
            user_id: userId,
            module: "Pets",
            action: "deleted",
            entity_type:
              "pet_medication",
            entity_id: item.id,
            entity_name:
              item.medication_name,
            details: {
              message:
                `Moveu medicamento de ${selectedPet?.name} para a lixeira: ${item.medication_name}`,
              pet_id: selectedPet?.id,
              pet_name: selectedPet?.name,
            },
          });

        await loadPets();
      } catch (error) {
        console.error(
          "Erro ao excluir medicamento:",
          error
        );

        alert(
          "Não foi possível mover o medicamento para a Lixeira."
        );
      }
    }

    function openNewHealthPlan() {
      setEditingHealthPlan(null);
      setHealthPlanModalOpen(true);
    }

    function openEditHealthPlan(plan) {
      setEditingHealthPlan(plan);
      setHealthPlanModalOpen(true);
    }

    function daysUntil(date) {
      if (!date) return null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const target = new Date(
        `${date}T12:00:00`
      );

      target.setHours(0, 0, 0, 0);

      return Math.ceil(
        (target - today) /
          (1000 * 60 * 60 * 24)
      );
    }

    function renewalStatus(plan) {
      if (!plan?.limits_renewal_date) {
        return {
          label: "Sem data de renovação",
          tone: "neutral",
        };
      }

      const days = daysUntil(
        plan.limits_renewal_date
      );

      if (days < 0) {
        return {
          label: "Renovação vencida",
          tone: "danger",
        };
      }

      if (days === 0) {
        return {
          label: "Renova hoje",
          tone: "warning",
        };
      }

      if (days <= 30) {
        return {
          label: `Renova em ${days} dias`,
          tone: "warning",
        };
      }

      return {
        label: `Renovação em ${formatDate(
          plan.limits_renewal_date
        )}`,
        tone: "ok",
      };
    }

    async function deleteHealthPlan(plan) {

      try {
        let userId = null;

        if (currentUser) {
          const { data: userData } =
            await supabase
              .from("users")
              .select("id")
              .ilike("name", currentUser)
              .maybeSingle();

          userId = userData?.id || null;
        }

        const { error } = await supabase
          .from("pet_health_plans")
          .update({
            deleted_at:
              new Date().toISOString(),
            deleted_by: userId,
          })
          .eq("id", plan.id);

        if (error) throw error;

        await supabase
          .from("activity_logs")
          .insert({
            user_id: userId,
            module: "Pets",
            action: "deleted",
            entity_type:
              "pet_health_plan",
            entity_id: plan.id,
            entity_name:
              plan.provider ||
              "Plano de saúde",
            details: {
              message:
                `Moveu plano de saúde de ${selectedPet?.name} para a lixeira`,
              pet_id: selectedPet?.id,
              pet_name: selectedPet?.name,
            },
          });

        await loadPets();
      } catch (error) {
        console.error(
          "Erro ao excluir plano de saúde:",
          error
        );

        alert(
          "Não foi possível mover o plano para a Lixeira."
        );
      }
    }

    function openNewWeight() {
      setEditingWeight(null);
      setWeightModalOpen(true);
    }

    function openEditWeight(item) {
      setEditingWeight(item);
      setWeightModalOpen(true);
    }

    async function deleteWeight(item) {

      try {
        let userId = null;

        if (currentUser) {
          const { data: userData } =
            await supabase
              .from("users")
              .select("id")
              .ilike(
                "name",
                currentUser
              )
              .maybeSingle();

          userId =
            userData?.id || null;
        }

        const { error } =
          await supabase
            .from("pet_weights")
            .update({
              deleted_at:
                new Date().toISOString(),
              deleted_by: userId,
            })
            .eq("id", item.id);

        if (error) throw error;

        const {
          data: latestWeight,
          error: latestError,
        } = await supabase
          .from("pet_weights")
          .select("weight")
          .eq(
            "pet_id",
            selectedPet.id
          )
          .is("deleted_at", null)
          .order("measured_at", {
            ascending: false,
          })
          .order("created_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

        if (latestError) {
          throw latestError;
        }

        const { error: petError } =
          await supabase
            .from("pets")
            .update({
              current_weight:
                latestWeight?.weight ??
                null,
              updated_at:
                new Date().toISOString(),
            })
            .eq(
              "id",
              selectedPet.id
            );

        if (petError) {
          throw petError;
        }

        await supabase
          .from("activity_logs")
          .insert({
            user_id: userId,
            module: "Pets",
            action: "deleted",
            entity_type:
              "pet_weight",
            entity_id: item.id,
            entity_name:
              `Peso de ${selectedPet.name}`,
            details: {
              message:
                `Moveu registro de peso de ${selectedPet.name} para a lixeira`,
              pet_id:
                selectedPet.id,
              pet_name:
                selectedPet.name,
              weight:
                item.weight,
            },
          });

        await loadPets();
      } catch (error) {
        console.error(
          "Erro ao excluir peso:",
          error
        );

        alert(
          "Não foi possível mover o peso para a Lixeira."
        );
      }
    }

    function openNewAppointment() {
      setEditingAppointment(null);
      setAppointmentModalOpen(true);
    }

    function openEditAppointment(item) {
      setEditingAppointment(item);
      setAppointmentModalOpen(true);
    }

    async function deleteAppointment(item) {
      const confirmed = window.confirm(
        "Mover este atendimento para a Lixeira?"
      );

      if (!confirmed) return;

      try {
        let userId = null;

        if (currentUser) {
          const { data: userData } =
            await supabase
              .from("users")
              .select("id")
              .ilike(
                "name",
                currentUser
              )
              .maybeSingle();

          userId =
            userData?.id || null;
        }

        const { error } =
          await supabase
            .from("pet_appointments")
            .update({
              deleted_at:
                new Date().toISOString(),
              deleted_by: userId,
            })
            .eq("id", item.id);

        if (error) throw error;

        await supabase
          .from("activity_logs")
          .insert({
            user_id: userId,
            module: "Pets",
            action: "deleted",
            entity_type:
              "pet_appointment",
            entity_id: item.id,
            entity_name:
              `${item.appointment_type || "Atendimento"} - ${selectedPet?.name}`,
            details: {
              message:
                `Moveu atendimento de ${selectedPet?.name} para a lixeira`,
              pet_id:
                selectedPet?.id,
              pet_name:
                selectedPet?.name,
            },
          });

        await loadPets();
      } catch (error) {
        console.error(
          "Erro ao excluir atendimento:",
          error
        );

        alert(
          "Não foi possível mover o atendimento para a Lixeira."
        );
      }
    }

    function openNewPetExpense() {
      setEditingPetExpense(null);
      setPetExpenseModalOpen(true);
    }

    function openEditPetExpense(item) {
      setEditingPetExpense(item);
      setPetExpenseModalOpen(true);
    }

    async function deletePetExpense(item) {

      try {
        const { data: user, error: userError } =
          await supabase
            .from("users")
            .select("id")
            .eq("display_name", currentUser)
            .single();

        if (userError) throw userError;

        // Segurança: não permitimos excluir por Pets
        // algo que seja pagamento de fatura.
        const { data: allocations, error: allocationsError } =
          await supabase
            .from("finance_payment_allocations")
            .select("id")
            .eq("payment_transaction_id", item.id)
            .limit(1);

        if (allocationsError) throw allocationsError;

        if (allocations?.length > 0) {
          alert(
            "Esta movimentação é um pagamento de fatura e deve ser excluída pelo Financeiro."
          );
          return;
        }

        const { error: deleteError } =
          await supabase
            .from("finance_transactions")
            .update({
              deleted_at: new Date().toISOString(),
              deleted_by: user.id,
            })
            .eq("id", item.id)
            .eq("source_module", "pets");

        if (deleteError) throw deleteError;

        await supabase
          .from("activity_logs")
          .insert({
            user_id: user.id,
            module: "Pets",
            action: "deleted",
            entity_type: "finance_transaction",
            entity_id: item.id,
            entity_name: item.title,
            details: {
              message: `Moveu despesa de ${selectedPet?.name} para a Lixeira: ${item.title}`,
              pet_id: selectedPet?.id || null,
              pet_name: selectedPet?.name || null,
            },
          });

        await loadPets();
      } catch (error) {
        console.error(
          "Erro ao excluir despesa do pet:",
          error
        );

        alert(
          "Não foi possível mover a despesa para a Lixeira."
        );
      }
    }



  if (loading) {
    return (
      <div
        style={{
          color: COLORS.inkSoft,
          fontSize: 13,
        }}
      >
        Carregando Pets...
      </div>
    );
  }

  return (
    <div>
      {/* CABEÇALHO */}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
            }}
          >
            <PawPrint
              size={20}
              color={COLORS.primary}
            />

            <h1
              style={{
                margin: 0,
                fontSize: 20,
                letterSpacing: "-0.3px",
                color: COLORS.ink,
              }}
            >
              Pets
            </h1>
          </div>

          <p
            style={{
              margin: "4px 0 0",
              color: COLORS.inkSoft,
              fontSize: 12,
            }}
          >
            Saúde, cuidados e rotina dos pets
            em um só lugar.
          </p>
        </div>
      </div>

      {/* CARDS DOS PETS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(175px, 1fr))",
          gap: 10,
          marginBottom: 14,
        }}
      >
        {pets.map((pet) => {
          const selected =
            pet.id === selectedPetId;

          return (
            <button
              key={pet.id}
              type="button"
              onClick={() =>
                setSelectedPetId(pet.id)
              }
              style={{
                textAlign: "left",
                border: selected
                  ? `2px solid ${COLORS.primary}`
                  : `1px solid ${COLORS.border}`,
                background: selected
                  ? COLORS.primaryLight
                  : COLORS.surface,
                borderRadius: 12,
                padding: 12,
                cursor: "pointer",
                transition: "0.15s ease",
                color: COLORS.ink,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: selected
                      ? COLORS.primary
                      : COLORS.primaryLight,
                    color: selected
                      ? "#fff"
                      : COLORS.primary,
                    flexShrink: 0,
                  }}
                >
                  <PetIcon
                    species={pet.species}
                    size={18}
                  />
                </div>

                <div
                  style={{
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                    }}
                  >
                    {pet.name}
                  </div>

                  <div
                    style={{
                      marginTop: 2,
                      fontSize: 11,
                      color: COLORS.inkSoft,
                    }}
                  >
                    {pet.breed ||
                      speciesLabel(
                        pet.species
                      )}
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 9,
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    padding: "4px 7px",
                    borderRadius: 999,
                    background: "#fff",
                    border: `1px solid ${COLORS.border}`,
                    color: COLORS.inkSoft,
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {calculateAge(
                    pet.birth_date
                  )}
                </span>

                {pet.current_weight != null && (
                  <span
                    style={{
                      padding: "4px 7px",
                      borderRadius: 999,
                      background: "#fff",
                      border: `1px solid ${COLORS.border}`,
                      color: COLORS.inkSoft,
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {Number(
                      pet.current_weight
                    ).toLocaleString(
                      "pt-BR",
                      {
                        maximumFractionDigits: 2,
                      }
                    )}{" "}
                    kg
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {!selectedPet ? (
        <div
          style={{
            border: `1px solid ${COLORS.border}`,
            borderRadius: 16,
            background: COLORS.surface,
            padding: 20,
            color: COLORS.inkSoft,
            fontSize: 13,
          }}
        >
          Nenhum pet cadastrado.
        </div>
      ) : (
        <>
          {/* PERFIL */}
          <section
            style={{
              border: `1px solid ${COLORS.border}`,
              borderRadius: 12,
              background: COLORS.surface,
              padding: 14,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    background:
                      COLORS.primaryLight,
                    color: COLORS.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <PetIcon
                    species={
                      selectedPet.species
                    }
                    size={20}
                  />
                </div>

                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 16,
                      color: COLORS.ink,
                    }}
                  >
                    {selectedPet.name}
                  </h2>

                  <div
                    style={{
                      marginTop: 3,
                      color: COLORS.inkSoft,
                      fontSize: 12,
                    }}
                  >
                    {speciesLabel(
                      selectedPet.species
                    )}
                    {selectedPet.breed
                      ? ` · ${selectedPet.breed}`
                      : ""}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 9px",
                  borderRadius: 999,
                  background: "#EAF7F1",
                  color: "#27845D",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                <HeartPulse size={14} />
                Perfil ativo
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(170px, 1fr))",
                gap: 14,
              }}
            >
              <InfoItem
                label="Espécie"
                value={speciesLabel(
                  selectedPet.species
                )}
              />

              <InfoItem
                label="Raça"
                value={
                  selectedPet.breed ||
                  "Não informada"
                }
              />

              <InfoItem
                label="Sexo"
                value={sexLabel(
                  selectedPet.sex
                )}
              />

              <InfoItem
                label="Nascimento"
                value={formatDate(
                  selectedPet.birth_date
                )}
              />

              <InfoItem
                label="Idade"
                value={calculateAge(
                  selectedPet.birth_date
                )}
              />

              <InfoItem
                label="Peso atual"
                value={
                  selectedPet.current_weight !=
                  null
                    ? `${Number(
                        selectedPet.current_weight
                      ).toLocaleString(
                        "pt-BR",
                        {
                          maximumFractionDigits:
                            2,
                        }
                      )} kg`
                    : "Não informado"
                }
              />

              <InfoItem
                label="Microchip"
                value={
                  selectedPet.microchip_number ||
                  "Não cadastrado"
                }
              />

              <InfoItem
                label="Castração"
                value={
                  selectedPet.is_neutered
                    ? selectedPet.neutered_at
                      ? `Castrado(a) em ${formatDate(
                          selectedPet.neutered_at
                        )}`
                      : "Castrado(a)"
                    : "Não castrado(a)"
                }
              />

              {selectedPet.color && (
                <InfoItem
                  label="Cor"
                  value={selectedPet.color}
                />
              )}
            </div>
          </section>

          {/* PRÓXIMAS ÁREAS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 14,
            }}
          >
            <section
                style={{
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 12,
                    background: COLORS.surface,
                    padding: 14,
                }}
                >
                <div
                    style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 10,
                    flexWrap: "wrap",
                    marginBottom: 16,
                    }}
                >
                    <div>
                    <div
                        style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        }}
                    >
                        <Syringe
                        size={17}
                        color={COLORS.primary}
                        />

                        <h2
                        style={{
                            margin: 0,
                            fontSize: 15,
                            color: COLORS.ink,
                        }}
                        >
                        Saúde & Vacinas
                        </h2>
                    </div>

                    <p
                        style={{
                        margin: "6px 0 0",
                        color: COLORS.inkSoft,
                        fontSize: 12,
                        }}
                    >
                        Vacinas, vermífugos e
                        medicamentos de{" "}
                        {selectedPet.name}.
                    </p>
                    </div>

                    <button
                    type="button"
                    onClick={openNewVaccination}
                    style={{
                        border: 0,
                        borderRadius: 9,
                        background: COLORS.primary,
                        color: "#fff",
                        padding: "8px 11px",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                    }}
                    >
                    <Plus size={14} />
                    Nova vacina
                    </button>
                </div>

                <div
                    style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    color: COLORS.inkSoft,
                    fontWeight: 800,
                    marginBottom: 8,
                    }}
                >
                    Vacinas
                </div>

                {selectedPetVaccinations.length ===
                0 ? (
                    <div
                    style={{
                        border: `1px dashed ${COLORS.border}`,
                        borderRadius: 12,
                        padding: 14,
                        fontSize: 12,
                        color: COLORS.inkSoft,
                        textAlign: "center",
                    }}
                    >
                    Nenhuma vacina cadastrada.
                    </div>
                ) : (
                    <div
                    style={{
                        display: "grid",
                        gap: 8,
                    }}
                    >
                    {selectedPetVaccinations.map(
                        (vaccination) => (
                        <div
                            key={vaccination.id}
                            style={{
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: 11,
                            padding: 11,
                            display: "flex",
                            justifyContent:
                                "space-between",
                            alignItems: "center",
                            gap: 10,
                            }}
                        >
                            <div
                            style={{
                                minWidth: 0,
                            }}
                            >
                            <div
                                style={{
                                color: COLORS.ink,
                                fontSize: 12.5,
                                fontWeight: 700,
                                }}
                            >
                                {
                                vaccination.vaccine_name
                                }
                            </div>

                            <div
                                style={{
                                marginTop: 4,
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 5,
                                color: COLORS.inkSoft,
                                fontSize: 10.5,
                                }}
                            >
                                <span>
                                Aplicada:{" "}
                                {vaccination.applied_at
                                    ? formatDate(
                                        vaccination.applied_at
                                    )
                                    : "Sem data"}
                                </span>

                                {vaccination.next_due_date && (
                                <>
                                    <span>•</span>

                                    <span>
                                    Próxima:{" "}
                                    {formatDate(
                                        vaccination.next_due_date
                                    )}
                                    </span>
                                </>
                                )}
                            </div>

                            {(vaccination.clinic ||
                                vaccination.veterinarian) && (
                                <div
                                style={{
                                    marginTop: 4,
                                    color:
                                    COLORS.inkSoft,
                                    fontSize: 10.5,
                                }}
                                >
                                {vaccination.clinic ||
                                    vaccination.veterinarian}
                                </div>
                            )}
                            </div>

                            <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                flexShrink: 0,
                            }}
                            >
                            <button
                                type="button"
                                onClick={() =>
                                openEditVaccination(
                                    vaccination
                                )
                                }
                                title="Editar vacina"
                                style={{
                                border: 0,
                                background:
                                    "transparent",
                                color:
                                    COLORS.primary,
                                cursor: "pointer",
                                padding: 5,
                                }}
                            >
                                <Pencil size={14} />
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                deleteVaccination(
                                    vaccination
                                )
                                }
                                title="Excluir vacina"
                                style={{
                                border: 0,
                                background:
                                    "transparent",
                                color: "#D64545",
                                cursor: "pointer",
                                padding: 5,
                                }}
                            >
                                <Trash2 size={14} />
                            </button>
                            </div>
                        </div>
                        )
                    )}
                    </div>
                )}
                <div
                    style={{
                        height: 1,
                        background: COLORS.border,
                        margin: "18px 0",
                    }}
                    />

                    <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        marginBottom: 9,
                    }}
                    >
                    <div
                        style={{
                        fontSize: 10,
                        textTransform: "uppercase",
                        color: COLORS.inkSoft,
                        fontWeight: 800,
                        }}
                    >
                        Vermífugos
                    </div>

                    <button
                        type="button"
                        onClick={openNewDeworming}
                        style={{
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 8,
                        background: "#fff",
                        color: COLORS.primary,
                        padding: "6px 9px",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 10.5,
                        fontWeight: 700,
                        cursor: "pointer",
                        }}
                    >
                        <Plus size={13} />
                        Novo
                    </button>
                    </div>

                    {selectedPetDewormings.length === 0 ? (
                    <div
                        style={{
                        border: `1px dashed ${COLORS.border}`,
                        borderRadius: 12,
                        padding: 14,
                        color: COLORS.inkSoft,
                        fontSize: 12,
                        textAlign: "center",
                        }}
                    >
                        Nenhum vermífugo cadastrado.
                    </div>
                    ) : (
                    <div
                        style={{
                        display: "grid",
                        gap: 8,
                        }}
                    >
                        {selectedPetDewormings.map(
                        (item) => (
                            <div
                            key={item.id}
                            style={{
                                border: `1px solid ${COLORS.border}`,
                                borderRadius: 11,
                                padding: 11,
                                display: "flex",
                                justifyContent:
                                "space-between",
                                alignItems: "center",
                                gap: 10,
                            }}
                            >
                            <div style={{ minWidth: 0 }}>
                                <div
                                style={{
                                    color: COLORS.ink,
                                    fontSize: 12.5,
                                    fontWeight: 700,
                                }}
                                >
                                {item.medication_name ||
                                    "Lembrete de vermífugo"}
                                </div>

                                <div
                                style={{
                                    marginTop: 4,
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 5,
                                    color: COLORS.inkSoft,
                                    fontSize: 10.5,
                                }}
                                >
                                {item.applied_at && (
                                    <span>
                                    Aplicado:{" "}
                                    {formatDate(
                                        item.applied_at
                                    )}
                                    </span>
                                )}

                                {item.applied_at &&
                                    item.recurrence_month && (
                                    <span>•</span>
                                    )}

                                {item.recurrence_month && (
                                    <span>
                                    Lembrete anual:{" "}
                                    {monthName(
                                        item.recurrence_month
                                    )}
                                    </span>
                                )}
                                </div>

                                {item.notes && (
                                <div
                                    style={{
                                    marginTop: 4,
                                    color: COLORS.inkSoft,
                                    fontSize: 10.5,
                                    }}
                                >
                                    {item.notes}
                                </div>
                                )}
                            </div>

                            <div
                                style={{
                                display: "flex",
                                gap: 4,
                                flexShrink: 0,
                                }}
                            >
                                <button
                                type="button"
                                onClick={() =>
                                    openEditDeworming(item)
                                }
                                title="Editar vermífugo"
                                style={{
                                    border: 0,
                                    background: "transparent",
                                    color: COLORS.primary,
                                    cursor: "pointer",
                                    padding: 5,
                                }}
                                >
                                <Pencil size={14} />
                                </button>

                                <button
                                type="button"
                                onClick={() =>
                                    deleteDeworming(item)
                                }
                                title="Excluir vermífugo"
                                style={{
                                    border: 0,
                                    background: "transparent",
                                    color: "#D64545",
                                    cursor: "pointer",
                                    padding: 5,
                                }}
                                >
                                <Trash2 size={14} />
                                </button>
                            </div>
                            </div>
                        )
                        )}
                    </div>
                    )}
                    <div
                      style={{
                        height: 1,
                        background: COLORS.border,
                        margin: "18px 0",
                      }}
                    />

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        marginBottom: 9,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          textTransform: "uppercase",
                          color: COLORS.inkSoft,
                          fontWeight: 800,
                        }}
                      >
                        Medicamentos
                      </div>

                      <button
                        type="button"
                        onClick={openNewMedication}
                        style={{
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: 8,
                          background: "#fff",
                          color: COLORS.primary,
                          padding: "6px 9px",
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 10.5,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        <Plus size={13} />
                        Novo
                      </button>
                    </div>

                    {selectedPetMedications.length === 0 ? (
                      <div
                        style={{
                          border: `1px dashed ${COLORS.border}`,
                          borderRadius: 12,
                          padding: 14,
                          color: COLORS.inkSoft,
                          fontSize: 12,
                          textAlign: "center",
                        }}
                      >
                        Nenhum medicamento cadastrado.
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          gap: 8,
                        }}
                      >
                        {selectedPetMedications.map(
                          (item) => {
                            const status =
                              medicationStatus(item);

                            return (
                              <div
                                key={item.id}
                                style={{
                                  border: `1px solid ${COLORS.border}`,
                                  borderRadius: 11,
                                  padding: 11,
                                  display: "flex",
                                  justifyContent:
                                    "space-between",
                                  alignItems: "center",
                                  gap: 10,
                                }}
                              >
                                <div style={{ minWidth: 0 }}>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 7,
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <div
                                      style={{
                                        color: COLORS.ink,
                                        fontSize: 12.5,
                                        fontWeight: 700,
                                      }}
                                    >
                                      {item.medication_name}
                                    </div>

                                    <span
                                      style={{
                                        padding: "3px 6px",
                                        borderRadius: 999,
                                        fontSize: 9.5,
                                        fontWeight: 700,
                                        background: status.active
                                          ? "#EAF7F1"
                                          : "#F1F3F4",
                                        color: status.active
                                          ? "#27845D"
                                          : COLORS.inkSoft,
                                      }}
                                    >
                                      {status.label}
                                    </span>
                                  </div>

                                  <div
                                    style={{
                                      marginTop: 4,
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: 5,
                                      color: COLORS.inkSoft,
                                      fontSize: 10.5,
                                    }}
                                  >
                                    {item.dosage && (
                                      <span>
                                        Dose: {item.dosage}
                                      </span>
                                    )}

                                    {item.dosage &&
                                      item.frequency && (
                                        <span>•</span>
                                      )}

                                    {item.frequency && (
                                      <span>
                                        {item.frequency}
                                      </span>
                                    )}
                                  </div>

                                  {(item.start_date ||
                                    item.end_date) && (
                                    <div
                                      style={{
                                        marginTop: 4,
                                        color: COLORS.inkSoft,
                                        fontSize: 10.5,
                                      }}
                                    >
                                      {item.start_date && (
                                        <>
                                          Início:{" "}
                                          {formatDate(
                                            item.start_date
                                          )}
                                        </>
                                      )}

                                      {item.start_date &&
                                        item.end_date &&
                                        " • "}

                                      {item.end_date && (
                                        <>
                                          Término:{" "}
                                          {formatDate(
                                            item.end_date
                                          )}
                                        </>
                                      )}
                                    </div>
                                  )}

                                  {item.notes && (
                                    <div
                                      style={{
                                        marginTop: 4,
                                        color: COLORS.inkSoft,
                                        fontSize: 10.5,
                                      }}
                                    >
                                      {item.notes}
                                    </div>
                                  )}
                                </div>

                                <div
                                  style={{
                                    display: "flex",
                                    gap: 4,
                                    flexShrink: 0,
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openEditMedication(item)
                                    }
                                    title="Editar medicamento"
                                    style={{
                                      border: 0,
                                      background:
                                        "transparent",
                                      color: COLORS.primary,
                                      cursor: "pointer",
                                      padding: 5,
                                    }}
                                  >
                                    <Pencil size={14} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      deleteMedication(item)
                                    }
                                    title="Excluir medicamento"
                                    style={{
                                      border: 0,
                                      background:
                                        "transparent",
                                      color: "#D64545",
                                      cursor: "pointer",
                                      padding: 5,
                                    }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                </section>


            <section
              style={{
                border: `1px solid ${COLORS.border}`,
                borderRadius: 16,
                background: COLORS.surface,
                padding: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 16,
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 16,
                      color: COLORS.ink,
                    }}
                  >
                    Plano de saúde
                  </h2>

                  <p
                    style={{
                      margin: "6px 0 0",
                      color: COLORS.inkSoft,
                      fontSize: 12,
                    }}
                  >
                    Plano, limites e próximas
                    renovações.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    selectedPetHealthPlan
                      ? () =>
                          openEditHealthPlan(
                            selectedPetHealthPlan
                          )
                      : openNewHealthPlan
                  }
                  style={{
                    border: 0,
                    borderRadius: 9,
                    background: COLORS.primary,
                    color: "#fff",
                    padding: "8px 11px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {selectedPetHealthPlan ? (
                    <>
                      <Pencil size={14} />
                      Editar
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      Adicionar plano
                    </>
                  )}
                </button>
              </div>

              {!selectedPetHealthPlan ? (
                <div
                  style={{
                    border: `1px dashed ${COLORS.border}`,
                    borderRadius: 12,
                    padding: 18,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      color: COLORS.ink,
                      fontSize: 12.5,
                      fontWeight: 700,
                    }}
                  >
                    Sem plano de saúde cadastrado
                  </div>

                  <div
                    style={{
                      marginTop: 5,
                      color: COLORS.inkSoft,
                      fontSize: 11,
                    }}
                  >
                    Você pode cadastrar o plano de{" "}
                    {selectedPet.name} quando quiser.
                  </div>
                </div>
              ) : (
                (() => {
                  const status = renewalStatus(
                    selectedPetHealthPlan
                  );

                  const statusStyles = {
                    ok: {
                      background: "#EAF7F1",
                      color: "#27845D",
                    },
                    warning: {
                      background: "#FFF4D8",
                      color: "#9A6A00",
                    },
                    danger: {
                      background: "#FDE7E7",
                      color: "#C23B3B",
                    },
                    neutral: {
                      background: "#F1F3F4",
                      color: COLORS.inkSoft,
                    },
                  };

                  return (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent:
                            "space-between",
                          gap: 10,
                          flexWrap: "wrap",
                          marginBottom: 14,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 17,
                              fontWeight: 800,
                              color: COLORS.ink,
                            }}
                          >
                            {
                              selectedPetHealthPlan.provider
                            }
                          </div>

                          {selectedPetHealthPlan.plan_name && (
                            <div
                              style={{
                                marginTop: 3,
                                color: COLORS.inkSoft,
                                fontSize: 11.5,
                              }}
                            >
                              {
                                selectedPetHealthPlan.plan_name
                              }
                            </div>
                          )}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              padding: "5px 8px",
                              borderRadius: 999,
                              fontSize: 10,
                              fontWeight: 700,
                              background:
                                selectedPetHealthPlan.is_active
                                  ? "#EAF7F1"
                                  : "#F1F3F4",
                              color:
                                selectedPetHealthPlan.is_active
                                  ? "#27845D"
                                  : COLORS.inkSoft,
                            }}
                          >
                            {selectedPetHealthPlan.is_active
                              ? "Ativo"
                              : "Inativo"}
                          </span>

                          <span
                            style={{
                              padding: "5px 8px",
                              borderRadius: 999,
                              fontSize: 10,
                              fontWeight: 700,
                              ...statusStyles[
                                status.tone
                              ],
                            }}
                          >
                            {status.label}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(150px, 1fr))",
                          gap: 14,
                        }}
                      >
                        <InfoItem
                          label="Operadora"
                          value={
                            selectedPetHealthPlan.provider
                          }
                        />

                        <InfoItem
                          label="Plano"
                          value={
                            selectedPetHealthPlan.plan_name ||
                            "Não informado"
                          }
                        />

                        <InfoItem
                          label="Número / matrícula"
                          value={
                            selectedPetHealthPlan.membership_number ||
                            "Não informado"
                          }
                        />

                        <InfoItem
                          label="Renovação dos limites"
                          value={
                            selectedPetHealthPlan.limits_renewal_date
                              ? formatDate(
                                  selectedPetHealthPlan.limits_renewal_date
                                )
                              : "Não informada"
                          }
                        />
                      </div>

                      {selectedPetHealthPlan.notes && (
                        <div
                          style={{
                            marginTop: 14,
                            padding: 11,
                            borderRadius: 10,
                            background: COLORS.bg,
                            color: COLORS.inkSoft,
                            fontSize: 11,
                            lineHeight: 1.5,
                          }}
                        >
                          {
                            selectedPetHealthPlan.notes
                          }
                        </div>
                      )}

                      <div
                        style={{
                          marginTop: 14,
                          display: "flex",
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            deleteHealthPlan(
                              selectedPetHealthPlan
                            )
                          }
                          style={{
                            border: 0,
                            background: "transparent",
                            color: "#D64545",
                            cursor: "pointer",
                            fontSize: 10.5,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            padding: 5,
                          }}
                        >
                          <Trash2 size={13} />
                          Excluir plano
                        </button>
                      </div>
                    </div>
                  );
                })()
              )}
            </section>

            <section
              style={{
                border:
                  `1px solid ${COLORS.border}`,
                borderRadius: 16,
                background: COLORS.surface,
                padding: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent:
                    "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  marginBottom: 18,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                    }}
                  >
                    <TrendingUp
                      size={18}
                      color={COLORS.primary}
                    />

                    <h2
                      style={{
                        margin: 0,
                        fontSize: 16,
                        color: COLORS.ink,
                      }}
                    >
                      Peso & Evolução
                    </h2>
                  </div>

                  <p
                    style={{
                      margin: "6px 0 0",
                      color: COLORS.inkSoft,
                      fontSize: 12,
                    }}
                  >
                    Histórico de peso de{" "}
                    {selectedPet.name}.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openNewWeight}
                  style={{
                    border: 0,
                    borderRadius: 9,
                    background:
                      COLORS.primary,
                    color: "#fff",
                    padding: "8px 11px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Plus size={14} />
                  Registrar peso
                </button>
              </div>

              {selectedPetWeights.length >
              0 ? (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(150px, 1fr))",
                      gap: 10,
                      marginBottom: 18,
                    }}
                  >
                    <div
                      style={{
                        background:
                          COLORS.primaryLight,
                        borderRadius: 12,
                        padding: 13,
                      }}
                    >
                      <div
                        style={{
                          color:
                            COLORS.inkSoft,
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform:
                            "uppercase",
                        }}
                      >
                        Peso atual
                      </div>

                      <div
                        style={{
                          marginTop: 5,
                          color: COLORS.ink,
                          fontSize: 20,
                          fontWeight: 800,
                        }}
                      >
                        {Number(
                          selectedPetWeights[
                            selectedPetWeights.length -
                              1
                          ].weight
                        ).toLocaleString(
                          "pt-BR",
                          {
                            maximumFractionDigits:
                              2,
                          }
                        )}{" "}
                        kg
                      </div>
                    </div>

                    {selectedPetWeights.length >
                      1 && (
                      <div
                        style={{
                          background:
                            COLORS.bg,
                          borderRadius: 12,
                          padding: 13,
                        }}
                      >
                        <div
                          style={{
                            color:
                              COLORS.inkSoft,
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform:
                              "uppercase",
                          }}
                        >
                          Variação total
                        </div>

                        <div
                          style={{
                            marginTop: 5,
                            color: COLORS.ink,
                            fontSize: 20,
                            fontWeight: 800,
                          }}
                        >
                          {(() => {
                            const first =
                              Number(
                                selectedPetWeights[
                                  0
                                ].weight
                              );

                            const last =
                              Number(
                                selectedPetWeights[
                                  selectedPetWeights.length -
                                    1
                                ].weight
                              );

                            const diff =
                              last - first;

                            return `${
                              diff > 0
                                ? "+"
                                : ""
                            }${diff.toLocaleString(
                              "pt-BR",
                              {
                                maximumFractionDigits:
                                  2,
                              }
                            )} kg`;
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      border:
                        `1px solid ${COLORS.border}`,
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 18,
                    }}
                  >
                    <WeightChart
                      weights={
                        selectedPetWeights
                      }
                    />
                  </div>

                  <div
                    style={{
                      fontSize: 10,
                      textTransform:
                        "uppercase",
                      color: COLORS.inkSoft,
                      fontWeight: 800,
                      marginBottom: 8,
                    }}
                  >
                    Histórico
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    {[...selectedPetWeights]
                      .reverse()
                      .map((item) => (
                        <div
                          key={item.id}
                          style={{
                            border:
                              `1px solid ${COLORS.border}`,
                            borderRadius: 11,
                            padding: 11,
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems:
                                "center",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 10,
                                background:
                                  COLORS.primaryLight,
                                color:
                                  COLORS.primary,
                                display: "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                flexShrink: 0,
                              }}
                            >
                              <Scale size={17} />
                            </div>

                            <div>
                              <div
                                style={{
                                  color:
                                    COLORS.ink,
                                  fontSize: 13,
                                  fontWeight: 800,
                                }}
                              >
                                {Number(
                                  item.weight
                                ).toLocaleString(
                                  "pt-BR",
                                  {
                                    maximumFractionDigits:
                                      2,
                                  }
                                )}{" "}
                                kg
                              </div>

                              <div
                                style={{
                                  marginTop: 2,
                                  color:
                                    COLORS.inkSoft,
                                  fontSize: 10.5,
                                }}
                              >
                                {formatDate(
                                  item.measured_at
                                )}
                              </div>

                              {item.notes && (
                                <div
                                  style={{
                                    marginTop: 3,
                                    color:
                                      COLORS.inkSoft,
                                    fontSize: 10.5,
                                  }}
                                >
                                  {item.notes}
                                </div>
                              )}
                            </div>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              gap: 4,
                            }}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                openEditWeight(
                                  item
                                )
                              }
                              title="Editar peso"
                              style={{
                                border: 0,
                                background:
                                  "transparent",
                                color:
                                  COLORS.primary,
                                cursor:
                                  "pointer",
                                padding: 5,
                              }}
                            >
                              <Pencil
                                size={14}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteWeight(
                                  item
                                )
                              }
                              title="Excluir peso"
                              style={{
                                border: 0,
                                background:
                                  "transparent",
                                color:
                                  "#D64545",
                                cursor:
                                  "pointer",
                                padding: 5,
                              }}
                            >
                              <Trash2
                                size={14}
                              />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              ) : (
                <div
                  style={{
                    border:
                      `1px dashed ${COLORS.border}`,
                    borderRadius: 12,
                    padding: 18,
                    textAlign: "center",
                    color: COLORS.inkSoft,
                    fontSize: 12,
                  }}
                >
                  Nenhuma pesagem cadastrada.
                </div>
              )}
            </section>
            <section
              style={{
                border:
                  `1px solid ${COLORS.border}`,
                borderRadius: 16,
                background: COLORS.surface,
                padding: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent:
                    "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  marginBottom: 18,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                    }}
                  >
                    <Stethoscope
                      size={18}
                      color={COLORS.primary}
                    />

                    <h2
                      style={{
                        margin: 0,
                        fontSize: 16,
                        color: COLORS.ink,
                      }}
                    >
                      Consultas & Atendimentos
                    </h2>
                  </div>

                  <p
                    style={{
                      margin: "6px 0 0",
                      color: COLORS.inkSoft,
                      fontSize: 12,
                    }}
                  >
                    Histórico veterinário de{" "}
                    {selectedPet.name}.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openNewAppointment}
                  style={{
                    border: 0,
                    borderRadius: 9,
                    background:
                      COLORS.primary,
                    color: "#fff",
                    padding: "8px 11px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Plus size={14} />
                  Novo atendimento
                </button>
              </div>

              {selectedPetAppointments.length ===
              0 ? (
                <div
                  style={{
                    border:
                      `1px dashed ${COLORS.border}`,
                    borderRadius: 12,
                    padding: 18,
                    textAlign: "center",
                    color: COLORS.inkSoft,
                    fontSize: 12,
                  }}
                >
                  Nenhum atendimento
                  cadastrado.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: 9,
                  }}
                >
                  {selectedPetAppointments.map(
                    (item) => (
                      <div
                        key={item.id}
                        style={{
                          border:
                            `1px solid ${COLORS.border}`,
                          borderRadius: 12,
                          padding: 13,
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "flex-start",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: 11,
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 11,
                              background:
                                COLORS.primaryLight,
                              color:
                                COLORS.primary,
                              display: "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              flexShrink: 0,
                            }}
                          >
                            <CalendarDays
                              size={18}
                            />
                          </div>

                          <div
                            style={{
                              minWidth: 0,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems:
                                  "center",
                                gap: 7,
                                flexWrap: "wrap",
                              }}
                            >
                              <div
                                style={{
                                  color:
                                    COLORS.ink,
                                  fontSize: 13,
                                  fontWeight: 800,
                                }}
                              >
                                {item.appointment_type ||
                                  "Atendimento"}
                              </div>

                              <span
                                style={{
                                  padding:
                                    "3px 7px",
                                  borderRadius: 999,
                                  background:
                                    COLORS.primaryLight,
                                  color:
                                    COLORS.primary,
                                  fontSize: 9.5,
                                  fontWeight: 700,
                                }}
                              >
                                {formatDate(
                                  item.appointment_date
                                )}
                              </span>
                            </div>

                            {(item.clinic ||
                              item.veterinarian) && (
                              <div
                                style={{
                                  marginTop: 4,
                                  color:
                                    COLORS.inkSoft,
                                  fontSize: 10.5,
                                }}
                              >
                                {item.clinic &&
                                  item.clinic}

                                {item.clinic &&
                                  item.veterinarian &&
                                  " • "}

                                {item.veterinarian &&
                                  `Dr(a). ${item.veterinarian}`}
                              </div>
                            )}

                            {item.reason && (
                              <div
                                style={{
                                  marginTop: 6,
                                  color:
                                    COLORS.ink,
                                  fontSize: 11,
                                }}
                              >
                                <strong>
                                  Motivo:
                                </strong>{" "}
                                {item.reason}
                              </div>
                            )}

                            {item.diagnosis && (
                              <div
                                style={{
                                  marginTop: 4,
                                  color:
                                    COLORS.inkSoft,
                                  fontSize: 11,
                                }}
                              >
                                <strong>
                                  Diagnóstico:
                                </strong>{" "}
                                {item.diagnosis}
                              </div>
                            )}

                            {item.notes && (
                              <div
                                style={{
                                  marginTop: 4,
                                  color:
                                    COLORS.inkSoft,
                                  fontSize: 10.5,
                                }}
                              >
                                {item.notes}
                              </div>
                            )}

                            {item.cost != null && (
                              <div
                                style={{
                                  marginTop: 6,
                                  color:
                                    COLORS.ink,
                                  fontSize: 11,
                                  fontWeight: 700,
                                }}
                              >
                                R${" "}
                                {Number(
                                  item.cost
                                ).toLocaleString(
                                  "pt-BR",
                                  {
                                    minimumFractionDigits:
                                      2,
                                    maximumFractionDigits:
                                      2,
                                  }
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: 4,
                            flexShrink: 0,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              openEditAppointment(
                                item
                              )
                            }
                            title="Editar atendimento"
                            style={{
                              border: 0,
                              background:
                                "transparent",
                              color:
                                COLORS.primary,
                              cursor:
                                "pointer",
                              padding: 5,
                            }}
                          >
                            <Pencil
                              size={14}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteAppointment(
                                item
                              )
                            }
                            title="Excluir atendimento"
                            style={{
                              border: 0,
                              background:
                                "transparent",
                              color:
                                "#D64545",
                              cursor:
                                "pointer",
                              padding: 5,
                            }}
                          >
                            <Trash2
                              size={14}
                            />
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>
            <section
              style={{
                marginTop: 16,
                border:
                  `1px solid ${COLORS.border}`,
                borderRadius: 16,
                background: COLORS.surface,
                padding: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent:
                    "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  marginBottom: 18,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                    }}
                  >
                    <CircleDollarSign
                      size={18}
                      color={COLORS.primary}
                    />

                    <h2
                      style={{
                        margin: 0,
                        fontSize: 16,
                        color: COLORS.ink,
                      }}
                    >
                      Despesas
                    </h2>
                  </div>

                  <p
                    style={{
                      margin: "6px 0 0",
                      color: COLORS.inkSoft,
                      fontSize: 12,
                    }}
                  >
                    Gastos relacionados a{" "}
                    {selectedPet.name}.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openNewPetExpense}
                  style={{
                    border: 0,
                    borderRadius: 9,
                    background:
                      COLORS.primary,
                    color: "#fff",
                    padding: "8px 11px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Plus size={14} />
                  Nova despesa
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(170px, 1fr))",
                  gap: 10,
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    border:
                      `1px solid ${COLORS.border}`,
                    borderRadius: 12,
                    padding: 13,
                    background: COLORS.bg,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      textTransform: "uppercase",
                      color: COLORS.inkSoft,
                      fontWeight: 800,
                    }}
                  >
                    Total registrado
                  </div>

                  <div
                    style={{
                      marginTop: 5,
                      fontSize: 20,
                      fontWeight: 800,
                      color: COLORS.ink,
                    }}
                  >
                    R${" "}
                    {selectedPetExpensesTotal.toLocaleString(
                      "pt-BR",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </div>
                </div>

                <div
                  style={{
                    border:
                      `1px solid ${COLORS.border}`,
                    borderRadius: 12,
                    padding: 13,
                    background: COLORS.bg,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      textTransform: "uppercase",
                      color: COLORS.inkSoft,
                      fontWeight: 800,
                    }}
                  >
                    Registros
                  </div>

                  <div
                    style={{
                      marginTop: 5,
                      fontSize: 20,
                      fontWeight: 800,
                      color: COLORS.ink,
                    }}
                  >
                    {selectedPetExpenses.length}
                  </div>
                </div>
              </div>

              {selectedPetExpenses.length ===
              0 ? (
                <div
                  style={{
                    border:
                      `1px dashed ${COLORS.border}`,
                    borderRadius: 12,
                    padding: 18,
                    textAlign: "center",
                    color: COLORS.inkSoft,
                    fontSize: 12,
                  }}
                >
                  Nenhuma despesa cadastrada
                  para {selectedPet.name}.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: 8,
                  }}
                >
                  {selectedPetExpenses.map(
                    (item) => (
                      <div
                        key={item.id}
                        style={{
                          border:
                            `1px solid ${COLORS.border}`,
                          borderRadius: 11,
                          padding: 11,
                          display: "flex",
                          alignItems: "center",
                          justifyContent:
                            "space-between",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              color: COLORS.ink,
                              fontSize: 12.5,
                              fontWeight: 700,
                            }}
                          >
                            {item.title}
                          </div>

                          <div
                            style={{
                              marginTop: 4,
                              color:
                                COLORS.inkSoft,
                              fontSize: 10.5,
                            }}
                          >
                            {formatDate(
                              item.transaction_date
                            )}

                            {item.category?.name
                              ? ` • ${item.category.name}`
                              : ""}

                            {item.account?.name
                              ? ` • ${item.account.name}`
                              : item.card?.name
                              ? ` • ${item.card.name}`
                              : ""}
                          </div>

                          {item.notes && (
                            <div
                              style={{
                                marginTop: 4,
                                color:
                                  COLORS.inkSoft,
                                fontSize: 10.5,
                              }}
                            >
                              {item.notes}
                            </div>
                          )}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              openEditPetExpense(item)
                            }
                            title="Editar despesa"
                            style={{
                              border: 0,
                              background: "transparent",
                              color: COLORS.primary,
                              cursor: "pointer",
                              padding: 5,
                            }}
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deletePetExpense(item)
                            }
                            title="Excluir despesa"
                            style={{
                              border: 0,
                              background: "transparent",
                              color: COLORS.danger,
                              cursor: "pointer",
                              padding: 5,
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>
          </div>
        </>
      )}
      <PetVaccinationModal
        open={vaccinationModalOpen}
        onClose={() => {
            setVaccinationModalOpen(false);
            setEditingVaccination(null);
        }}
        pet={selectedPet}
        vaccinationToEdit={
            editingVaccination
        }
        currentUser={currentUser}
        onSaved={loadPets}
        />

        <PetDewormingModal
            open={dewormingModalOpen}
            onClose={() => {
                setDewormingModalOpen(false);
                setEditingDeworming(null);
            }}
            pet={selectedPet}
            dewormingToEdit={editingDeworming}
            currentUser={currentUser}
            onSaved={loadPets}
        />

        <PetMedicationModal
          open={medicationModalOpen}
          onClose={() => {
            setMedicationModalOpen(false);
            setEditingMedication(null);
          }}
          pet={selectedPet}
          medicationToEdit={editingMedication}
          currentUser={currentUser}
          onSaved={loadPets}
        />

        <PetHealthPlanModal
          open={healthPlanModalOpen}
          onClose={() => {
            setHealthPlanModalOpen(false);
            setEditingHealthPlan(null);
          }}
          pet={selectedPet}
          planToEdit={editingHealthPlan}
          currentUser={currentUser}
          onSaved={loadPets}
        />
        <PetWeightModal
          open={weightModalOpen}
          onClose={() => {
            setWeightModalOpen(false);
            setEditingWeight(null);
          }}
          pet={selectedPet}
          weightToEdit={editingWeight}
          currentUser={currentUser}
          onSaved={loadPets}
        />
        <PetAppointmentModal
          open={appointmentModalOpen}
          onClose={() => {
            setAppointmentModalOpen(false);
            setEditingAppointment(null);
          }}
          pet={selectedPet}
          appointmentToEdit={
            editingAppointment
          }
          currentUser={currentUser}
          onSaved={loadPets}
        />

        <TransactionModal
          open={petExpenseModalOpen}
          onClose={() => {
            setPetExpenseModalOpen(false);
            setEditingPetExpense(null);
          }}
          currentUser={currentUser}
          onSaved={loadPets}
          transactionToEdit={
            editingPetExpense
          }
          initialType="despesa"
          sourceModule="pets"
          sourceId={selectedPet?.id || null}
        />
    </div>
  );
}