import { supabase } from "./supabase";

let activeUserName = "";
let activeOwnerUserId = null;

// =====================================================
// USUÁRIO ATIVO
// =====================================================

export async function setHealthCurrentUser(currentUser) {
  const { data, error } = await supabase
    .from("users")
    .select("id, display_name, name")
    .or(`display_name.eq.${currentUser},name.eq.${currentUser}`)
    .limit(1)
    .maybeSingle();

  checkError(error);

  if (!data?.id) {
    throw new Error("Usuário do lifeOS não encontrado.");
  }

  activeUserName = data.display_name || data.name || currentUser;
  activeOwnerUserId = data.id;

  return data.id;
}

function ownerId() {
  if (!activeOwnerUserId) {
    throw new Error("Usuário da Saúde ainda não foi definido.");
  }

  return activeOwnerUserId;
}

function softDeletePayload() {
  const now = new Date().toISOString();

  return {
    deleted_at: now,
    deleted_by: ownerId(),
    updated_at: now,
  };
}

// =====================================================
// AUXILIARES
// =====================================================

function checkError(error) {
  if (error) {
    console.error("Erro Supabase:", error);
    throw error;
  }
}

function emptyToNull(value) {
  return value === "" || value === undefined ? null : value;
}

function dbNumberOrEmpty(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return Number(value);
}

// =====================================================
// HISTÓRICO
// =====================================================

export async function getHistoryLogs() {
  const { data, error } = await supabase
    .from("health_history_logs")
    .select("*")
    .eq("owner_user_id", ownerId())
    .order("created_at", { ascending: false });

  checkError(error);

  return (data || []).map((item) => ({
    id: item.id,
    user: activeUserName,
    action: item.action,
    module: item.module,
    description: item.description || "",
    createdAt: item.created_at,
  }));
}

export async function addHistoryLog(
  user,
  action,
  module,
  description = ""
) {
  const { data, error } = await supabase
    .from("health_history_logs")
    .insert({
      owner_user_id: ownerId(),
      action,
      module,
      description,
    })
    .select()
    .single();

  checkError(error);

  return {
    ...data,
    user_name: activeUserName,
  };
}

// =====================================================
// ALIMENTAÇÃO — METAS
// =====================================================

export async function getNutritionGoals() {
  const { data, error } = await supabase
    .from("nutrition_goals")
    .select("*")
    .eq("owner_user_id", ownerId())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  checkError(error);

  if (!data) {
    return {
      calories: 1800,
      protein: 140,
      carbs: 190,
      fat: 60,
      fiber: 25,
    };
  }

  return {
    calories: Number(data.calories || 0),
    protein: Number(data.protein || 0),
    carbs: Number(data.carbs || 0),
    fat: Number(data.fat || 0),
    fiber: Number(data.fiber || 0),
  };
}

export async function saveNutritionGoals(goals, user) {
  const { data: existing, error: readError } = await supabase
    .from("nutrition_goals")
    .select("id")
    .eq("owner_user_id", ownerId())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  checkError(readError);

  const payload = {
    calories: goals.calories,
    protein: goals.protein,
    carbs: goals.carbs,
    fat: goals.fat,
    fiber: goals.fiber,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { data, error } = await supabase
      .from("nutrition_goals")
      .update(payload)
      .eq("id", existing.id)
      .eq("owner_user_id", ownerId())
      .select()
      .single();

    checkError(error);
    return data;
  }

  const { data, error } = await supabase
    .from("nutrition_goals")
    .insert({
      ...payload,
      owner_user_id: ownerId(),
    })
    .select()
    .single();

  checkError(error);

  return data;
}

// =====================================================
// ALIMENTAÇÃO — ALIMENTOS
// =====================================================

export async function getFoods() {
  const { data, error } = await supabase
    .from("foods")
    .select("*")
    .eq("owner_user_id", ownerId())
    .is("deleted_at", null)
    .order("name");

  checkError(error);

  return (data || []).map((food) => ({
    id: food.id,
    name: food.name,
    portion: Number(food.portion || 0),
    calories: Number(food.calories || 0),
    protein: Number(food.protein || 0),
    carbs: Number(food.carbs || 0),
    fat: Number(food.fat || 0),
    fiber: Number(food.fiber || 0),
  }));
}

export async function addFood(food, user) {
  const { data, error } = await supabase
    .from("foods")
    .insert({
      name: food.name,
      portion: food.portion,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber,
      owner_user_id: ownerId(),
    })
    .select()
    .single();

  checkError(error);

  return {
    id: data.id,
    name: data.name,
    portion: Number(data.portion || 0),
    calories: Number(data.calories || 0),
    protein: Number(data.protein || 0),
    carbs: Number(data.carbs || 0),
    fat: Number(data.fat || 0),
    fiber: Number(data.fiber || 0),
  };
}

export async function deleteFood(id) {
  const { error } = await supabase
    .from("foods")
    .update(softDeletePayload())
    .eq("id", id)
    .eq("owner_user_id", ownerId());

  checkError(error);
}

// =====================================================
// ALIMENTAÇÃO — REGISTROS
// =====================================================

function mapNutritionEntry(item) {
  return {
    id: item.id,
    date: item.date,
    meal: item.meal,
    foodId: item.food_id,
    foodName: item.food_name,

    quantity:
      item.quantity === null ? null : Number(item.quantity),

    calories: Number(item.calories || 0),
    protein: Number(item.protein || 0),
    carbs: Number(item.carbs || 0),
    fat: Number(item.fat || 0),
    fiber: Number(item.fiber || 0),

    isSubstitution: item.is_substitution || false,
    substitutionGroup: item.substitution_group || "",
    substitutionDescription:
      item.substitution_description || "",

    portions:
      item.portions === null ? null : Number(item.portions),

    createdAt: item.created_at,
  };
}

export async function getNutritionEntries() {
  const { data, error } = await supabase
    .from("nutrition_entries")
    .select("*")
    .eq("owner_user_id", ownerId())
    .is("deleted_at", null)
    .order("date", { ascending: false });

  checkError(error);

  return (data || []).map(mapNutritionEntry);
}

export async function addNutritionEntry(entry, user) {
  const { data, error } = await supabase
    .from("nutrition_entries")
    .insert({
      date: entry.date,
      meal: entry.meal,

      food_id: entry.foodId || null,
      food_name: entry.foodName,

      quantity: emptyToNull(entry.quantity),

      calories: entry.calories || 0,
      protein: entry.protein || 0,
      carbs: entry.carbs || 0,
      fat: entry.fat || 0,
      fiber: entry.fiber || 0,

      is_substitution: entry.isSubstitution || false,

      substitution_group:
        entry.substitutionGroup || null,

      substitution_description:
        entry.substitutionDescription || null,

      portions: emptyToNull(entry.portions),

      owner_user_id: ownerId(),
    })
    .select()
    .single();

  checkError(error);

  return mapNutritionEntry(data);
}

export async function deleteNutritionEntry(id) {
  const { error } = await supabase
    .from("nutrition_entries")
    .update(softDeletePayload())
    .eq("id", id)
    .eq("owner_user_id", ownerId());

  checkError(error);
}

// =====================================================
// MEDIDAS
// =====================================================

function mapMeasurement(item) {
  return {
    id: item.id,
    date: item.date,

    weight: dbNumberOrEmpty(item.weight),
    waist: dbNumberOrEmpty(item.waist),
    abdomen: dbNumberOrEmpty(item.abdomen),
    hip: dbNumberOrEmpty(item.hip),
    chest: dbNumberOrEmpty(item.chest),

    armRight: dbNumberOrEmpty(item.arm_right),
    armLeft: dbNumberOrEmpty(item.arm_left),

    thighRight: dbNumberOrEmpty(item.thigh_right),
    thighLeft: dbNumberOrEmpty(item.thigh_left),

    calfRight: dbNumberOrEmpty(item.calf_right),
    calfLeft: dbNumberOrEmpty(item.calf_left),

    notes: item.notes || "",
    createdAt: item.created_at,
  };
}

export async function getMeasurements() {
  const { data, error } = await supabase
    .from("body_measurements")
    .select("*")
    .eq("owner_user_id", ownerId())
    .is("deleted_at", null)
    .order("date", { ascending: false });

  checkError(error);

  return (data || []).map(mapMeasurement);
}

export async function addMeasurement(record, user) {
  const { data, error } = await supabase
    .from("body_measurements")
    .insert({
      date: record.date,

      weight: emptyToNull(record.weight),
      waist: emptyToNull(record.waist),
      abdomen: emptyToNull(record.abdomen),
      hip: emptyToNull(record.hip),
      chest: emptyToNull(record.chest),

      arm_right: emptyToNull(record.armRight),
      arm_left: emptyToNull(record.armLeft),

      thigh_right: emptyToNull(record.thighRight),
      thigh_left: emptyToNull(record.thighLeft),

      calf_right: emptyToNull(record.calfRight),
      calf_left: emptyToNull(record.calfLeft),

      notes: record.notes || null,
      owner_user_id: ownerId(),
    })
    .select()
    .single();

  checkError(error);

  return mapMeasurement(data);
}

export async function deleteMeasurement(id) {
  const { error } = await supabase
    .from("body_measurements")
    .update(softDeletePayload())
    .eq("id", id)
    .eq("owner_user_id", ownerId());

  checkError(error);
}

// =====================================================
// BIOIMPEDÂNCIA
// =====================================================

function mapBioimpedance(item) {
  return {
    id: item.id,
    date: item.date,

    weight: emptyToNull(item.weight),
    bmi: emptyToNull(item.bmi),

    bodyFatPercent:
      emptyToNull(item.body_fat_percent),

    fatMass: emptyToNull(item.fat_mass),
    muscleMass: emptyToNull(item.muscle_mass),
    leanMass: emptyToNull(item.lean_mass),

    bodyWaterPercent:
      emptyToNull(item.body_water_percent),

    visceralFat:
      emptyToNull(item.visceral_fat),

    basalMetabolism:
      emptyToNull(item.basal_metabolism),

    metabolicAge:
      emptyToNull(item.metabolic_age),

    notes: item.notes || "",
    createdAt: item.created_at,
  };
}

export async function getBioimpedanceRecords() {
  const { data, error } = await supabase
    .from("bioimpedance")
    .select("*")
    .eq("owner_user_id", ownerId())
    .is("deleted_at", null)
    .order("date", { ascending: false });

  checkError(error);

  return (data || []).map(mapBioimpedance);
}

export async function addBioimpedance(record, user) {
  const { data, error } = await supabase
    .from("bioimpedance")
    .insert({
      date: record.date,

      weight: emptyToNull(record.weight),
      bmi: emptyToNull(record.bmi),

      body_fat_percent:
        emptyToNull(record.bodyFatPercent),

      fat_mass: emptyToNull(record.fatMass),
      muscle_mass: emptyToNull(record.muscleMass),
      lean_mass: emptyToNull(record.leanMass),

      body_water_percent:
        emptyToNull(record.bodyWaterPercent),

      visceral_fat:
        emptyToNull(record.visceralFat),

      basal_metabolism:
        emptyToNull(record.basalMetabolism),

      metabolic_age:
        emptyToNull(record.metabolicAge),

      notes: record.notes || null,
      owner_user_id: ownerId(),
    })
    .select()
    .single();

  checkError(error);

  return mapBioimpedance(data);
}

export async function deleteBioimpedance(id) {
  const { error } = await supabase
    .from("bioimpedance")
    .update(softDeletePayload())
    .eq("id", id)
    .eq("owner_user_id", ownerId());

  checkError(error);
}

// =====================================================
// EXAMES
// =====================================================

function mapExam(exam) {
  return {
    id: exam.id,
    date: exam.date,
    laboratory: exam.laboratory || "",
    category: exam.category || "",
    notes: exam.notes || "",
    createdAt: exam.created_at,

    results: (exam.lab_results || []).map((result) => ({
      id: result.id,
      marker: result.marker,

      value:
        result.value === null
          ? ""
          : Number(result.value),

      unit: result.unit || "",

      min:
        result.min_reference === null
          ? ""
          : Number(result.min_reference),

      max:
        result.max_reference === null
          ? ""
          : Number(result.max_reference),
    })),
  };
}

export async function getExams() {
  const { data, error } = await supabase
    .from("lab_exams")
    .select(`
      *,
      lab_results (*)
    `)
    .eq("owner_user_id", ownerId())
    .is("deleted_at", null)
    .order("date", { ascending: false });

  checkError(error);

  return (data || []).map(mapExam);
}

export async function addExam(exam, results, user) {
  const { data: createdExam, error } = await supabase
    .from("lab_exams")
    .insert({
      date: exam.date,
      laboratory: exam.laboratory || null,
      category: exam.category || null,
      notes: exam.notes || null,
      owner_user_id: ownerId(),
    })
    .select()
    .single();

  checkError(error);

  const rows = results.map((result) => ({
    exam_id: createdExam.id,
    marker: result.marker,
    value: emptyToNull(result.value),
    unit: result.unit || null,
    min_reference: emptyToNull(result.min),
    max_reference: emptyToNull(result.max),
  }));

  let createdResults = [];

  if (rows.length > 0) {
    const { data, error: resultsError } = await supabase
      .from("lab_results")
      .insert(rows)
      .select();

    checkError(resultsError);
    createdResults = data || [];
  }

  return mapExam({
    ...createdExam,
    lab_results: createdResults,
  });
}

export async function deleteExam(id) {
  const { error } = await supabase
    .from("lab_exams")
    .update(softDeletePayload())
    .eq("id", id)
    .eq("owner_user_id", ownerId());

  checkError(error);
}

// =====================================================
// TREINOS — PLANOS
// =====================================================

function mapPlan(plan) {
  return {
    id: plan.id,
    name: plan.name,
    focus: plan.focus || "",
    notes: plan.notes || "",

    exercises: (plan.workout_plan_exercises || [])
      .sort(
        (a, b) =>
          Number(a.position || 0) -
          Number(b.position || 0)
      )
      .map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        sets: exercise.sets || "",
        reps: exercise.reps || "",

        load:
          exercise.load === null
            ? ""
            : Number(exercise.load),

        rest: exercise.rest || "",
      })),
  };
}

export async function getWorkoutPlans() {
  const { data, error } = await supabase
    .from("workout_plans")
    .select(`
      *,
      workout_plan_exercises (*)
    `)
    .eq("owner_user_id", ownerId())
    .is("deleted_at", null)
    .order("created_at");

  checkError(error);

  return (data || []).map(mapPlan);
}

export async function addWorkoutPlan(plan, user) {
  const { data: createdPlan, error } = await supabase
    .from("workout_plans")
    .insert({
      name: plan.name,
      focus: plan.focus || null,
      notes: plan.notes || null,
      owner_user_id: ownerId(),
    })
    .select()
    .single();

  checkError(error);

  const exercises = (plan.exercises || []).map(
    (exercise, index) => ({
      plan_id: createdPlan.id,
      name: exercise.name,
      sets: emptyToNull(exercise.sets),
      reps: exercise.reps || null,
      load: emptyToNull(exercise.load),
      rest: emptyToNull(exercise.rest),
      position: index,
    })
  );

  let createdExercises = [];

  if (exercises.length > 0) {
    const { data, error: exerciseError } = await supabase
      .from("workout_plan_exercises")
      .insert(exercises)
      .select();

    checkError(exerciseError);
    createdExercises = data || [];
  }

  return mapPlan({
    ...createdPlan,
    workout_plan_exercises: createdExercises,
  });
}

export async function updateWorkoutPlan(
  id,
  plan,
  user
) {
  const { data: updatedPlan, error } = await supabase
    .from("workout_plans")
    .update({
      name: plan.name,
      focus: plan.focus || null,
      notes: plan.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("owner_user_id", ownerId())
    .select()
    .single();

  checkError(error);

  const { error: deleteExercisesError } = await supabase
    .from("workout_plan_exercises")
    .delete()
    .eq("plan_id", id);

  checkError(deleteExercisesError);

  const exercises = (plan.exercises || []).map(
    (exercise, index) => ({
      plan_id: id,
      name: exercise.name,
      sets: emptyToNull(exercise.sets),
      reps: exercise.reps || null,
      load: emptyToNull(exercise.load),
      rest: emptyToNull(exercise.rest),
      position: index,
    })
  );

  let createdExercises = [];

  if (exercises.length > 0) {
    const { data, error: exerciseError } = await supabase
      .from("workout_plan_exercises")
      .insert(exercises)
      .select();

    checkError(exerciseError);
    createdExercises = data || [];
  }

  return mapPlan({
    ...updatedPlan,
    workout_plan_exercises: createdExercises,
  });
}

export async function deleteWorkoutPlan(id) {
  const { error } = await supabase
    .from("workout_plans")
    .update(softDeletePayload())
    .eq("id", id)
    .eq("owner_user_id", ownerId());

  checkError(error);
}

// =====================================================
// TREINOS — SESSÕES
// =====================================================

function mapWorkoutSession(session) {
  return {
    id: session.id,
    planId: session.plan_id,
    planName: session.plan_name || "",
    focus: session.focus || "",
    date: session.date,
    createdAt: session.created_at,

    exercises: (
      session.workout_session_exercises || []
    )
      .sort(
        (a, b) =>
          Number(a.position || 0) -
          Number(b.position || 0)
      )
      .map((exercise) => ({
        id: exercise.id,
        name: exercise.exercise_name,
        rest: exercise.rest || "",

        performedSets: (exercise.workout_sets || [])
          .sort(
            (a, b) =>
              Number(a.set_number) -
              Number(b.set_number)
          )
          .map((set) => ({
            id: set.id,
            setNumber: set.set_number,

            reps:
              set.reps === null
                ? ""
                : Number(set.reps),

            load:
              set.load === null
                ? ""
                : Number(set.load),

            done: Boolean(set.done),
          })),
      })),
  };
}

export async function getWorkoutSessions() {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select(`
      *,
      workout_session_exercises (
        *,
        workout_sets (*)
      )
    `)
    .eq("owner_user_id", ownerId())
    .is("deleted_at", null)
    .order("date", { ascending: false });

  checkError(error);

  return (data || []).map(mapWorkoutSession);
}

export async function addWorkoutSession(session, user) {
  const { data: createdSession, error } = await supabase
    .from("workout_sessions")
    .insert({
      plan_id: session.planId || null,
      plan_name: session.planName || null,
      focus: session.focus || null,
      date: session.date,
      owner_user_id: ownerId(),
    })
    .select()
    .single();

  checkError(error);

  const createdExercises = [];

  for (
    let i = 0;
    i < (session.exercises || []).length;
    i++
  ) {
    const exercise = session.exercises[i];

    const {
      data: createdExercise,
      error: exerciseError,
    } = await supabase
      .from("workout_session_exercises")
      .insert({
        session_id: createdSession.id,
        exercise_name: exercise.name,
        rest: emptyToNull(exercise.rest),
        position: i,
      })
      .select()
      .single();

    checkError(exerciseError);

    let createdSets = [];

    if (exercise.performedSets?.length) {
      const rows = exercise.performedSets.map(
        (set, index) => ({
          session_exercise_id: createdExercise.id,
          set_number: set.setNumber || index + 1,
          reps: emptyToNull(set.reps),
          load: emptyToNull(set.load),
          done: Boolean(set.done),
        })
      );

      const { data, error: setsError } = await supabase
        .from("workout_sets")
        .insert(rows)
        .select();

      checkError(setsError);
      createdSets = data || [];
    }

    createdExercises.push({
      ...createdExercise,
      workout_sets: createdSets,
    });
  }

  return mapWorkoutSession({
    ...createdSession,
    workout_session_exercises: createdExercises,
  });
}

export async function updateWorkoutSession(
  sessionId,
  session,
  user
) {
  const { data: updatedSession, error } = await supabase
    .from("workout_sessions")
    .update({
      plan_id: session.planId || null,
      plan_name: session.planName || null,
      focus: session.focus || null,
      date: session.date,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("owner_user_id", ownerId())
    .select()
    .single();

  checkError(error);

  const { error: deleteExercisesError } = await supabase
    .from("workout_session_exercises")
    .delete()
    .eq("session_id", sessionId);

  checkError(deleteExercisesError);

  const createdExercises = [];

  for (
    let i = 0;
    i < (session.exercises || []).length;
    i++
  ) {
    const exercise = session.exercises[i];

    const {
      data: createdExercise,
      error: exerciseError,
    } = await supabase
      .from("workout_session_exercises")
      .insert({
        session_id: sessionId,
        exercise_name: exercise.name,
        rest: emptyToNull(exercise.rest),
        position: i,
      })
      .select()
      .single();

    checkError(exerciseError);

    let createdSets = [];

    if (exercise.performedSets?.length) {
      const rows = exercise.performedSets.map(
        (set, index) => ({
          session_exercise_id: createdExercise.id,
          set_number: set.setNumber || index + 1,
          reps: emptyToNull(set.reps),
          load: emptyToNull(set.load),
          done: Boolean(set.done),
        })
      );

      const { data, error: setsError } = await supabase
        .from("workout_sets")
        .insert(rows)
        .select();

      checkError(setsError);
      createdSets = data || [];
    }

    createdExercises.push({
      ...createdExercise,
      workout_sets: createdSets,
    });
  }

  return mapWorkoutSession({
    ...updatedSession,
    workout_session_exercises: createdExercises,
  });
}

export async function deleteWorkoutSession(id) {
  const { error } = await supabase
    .from("workout_sessions")
    .update(softDeletePayload())
    .eq("id", id)
    .eq("owner_user_id", ownerId());

  checkError(error);
}

// =====================================================
// CHECK-IN
// =====================================================

function mapCheckIn(item) {
  return {
    id: item.id,
    date: item.date,

    weight:
      item.weight === null
        ? ""
        : Number(item.weight),

    sleepHours:
      item.sleep_hours === null
        ? ""
        : Number(item.sleep_hours),

    sleepQuality:
      item.sleep_quality === null
        ? 3
        : Number(item.sleep_quality),

    water:
      item.water === null
        ? ""
        : Number(item.water),

    energy:
      item.energy === null
        ? 3
        : Number(item.energy),

    hunger:
      item.hunger === null
        ? 3
        : Number(item.hunger),

    stress:
      item.stress === null
        ? 3
        : Number(item.stress),

    steps:
      item.steps === null
        ? ""
        : Number(item.steps),

    trained: Boolean(item.trained),
    notes: item.notes || "",
    createdAt: item.created_at,
  };
}

export async function getCheckIns() {
  const { data, error } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("owner_user_id", ownerId())
    .is("deleted_at", null)
    .order("date", { ascending: false });

  checkError(error);

  return (data || []).map(mapCheckIn);
}

export async function saveCheckIn(record, user) {
  const payload = {
    date: record.date,

    weight: emptyToNull(record.weight),

    sleep_hours:
      emptyToNull(record.sleepHours),

    sleep_quality:
      emptyToNull(record.sleepQuality),

    water: emptyToNull(record.water),

    energy: emptyToNull(record.energy),
    hunger: emptyToNull(record.hunger),
    stress: emptyToNull(record.stress),

    steps: emptyToNull(record.steps),

    trained: Boolean(record.trained),
    notes: record.notes || null,

    updated_at: new Date().toISOString(),
  };

  const { data: existing, error: existingError } = await supabase
    .from("daily_checkins")
    .select("id")
    .eq("date", record.date)
    .eq("owner_user_id", ownerId())
    .is("deleted_at", null)
    .maybeSingle();

  checkError(existingError);

  if (existing) {
    const { data, error } = await supabase
      .from("daily_checkins")
      .update(payload)
      .eq("id", existing.id)
      .eq("owner_user_id", ownerId())
      .select()
      .single();

    checkError(error);

    return mapCheckIn(data);
  }

  const { data, error } = await supabase
    .from("daily_checkins")
    .insert({
      ...payload,
      owner_user_id: ownerId(),
    })
    .select()
    .single();

  checkError(error);

  return mapCheckIn(data);
}

export async function deleteCheckIn(id) {
  const { error } = await supabase
    .from("daily_checkins")
    .update(softDeletePayload())
    .eq("id", id)
    .eq("owner_user_id", ownerId());

  checkError(error);
}

// =====================================================
// SUBSTITUIÇÕES
// =====================================================

function mapSubstitutionGroup(group) {
  return {
    id: group.id,
    name: group.name,

    description:
      group.description || "1 porção equivale a",

    items: (group.substitution_items || [])
      .sort(
        (a, b) =>
          new Date(a.created_at) -
          new Date(b.created_at)
      )
      .map((item) => ({
        id: item.id,
        text: item.description,
      })),
  };
}

export async function getSubstitutionGroups() {
  const { data, error } = await supabase
    .from("substitution_groups")
    .select(`
      *,
      substitution_items (
        id,
        description,
        created_at
      )
    `)
    .eq("owner_user_id", ownerId())
    .is("deleted_at", null)
    .order("created_at");

  checkError(error);

  return (data || []).map(mapSubstitutionGroup);
}

export async function addSubstitutionGroup(
  group,
  user
) {
  const { data, error } = await supabase
    .from("substitution_groups")
    .insert({
      name: group.name,

      description:
        group.description ||
        "1 porção equivale a",

      owner_user_id: ownerId(),
    })
    .select()
    .single();

  checkError(error);

  return {
    id: data.id,
    name: data.name,

    description:
      data.description ||
      "1 porção equivale a",

    items: [],
  };
}

export async function addSubstitutionItem(
  groupId,
  text,
  user
) {
  const { data, error } = await supabase
    .from("substitution_items")
    .insert({
      group_id: groupId,
      description: text,
    })
    .select()
    .single();

  checkError(error);

  return {
    id: data.id,
    text: data.description,
  };
}

export async function deleteSubstitutionItem(id) {
  const { error } = await supabase
    .from("substitution_items")
    .delete()
    .eq("id", id);

  checkError(error);
}

export async function deleteSubstitutionGroup(id) {
  const { error } = await supabase
    .from("substitution_groups")
    .update(softDeletePayload())
    .eq("id", id)
    .eq("owner_user_id", ownerId());

  checkError(error);
}

export async function replaceSubstitutionGroups(
  groups,
  user
) {
  const { error: deleteError } = await supabase
    .from("substitution_groups")
    .delete()
    .eq("owner_user_id", ownerId())
    .not("id", "is", null);

  checkError(deleteError);

  const createdGroups = [];

  for (const group of groups) {
    const createdGroup = await addSubstitutionGroup(
      group,
      user
    );

    const items = [];

    for (const item of group.items || []) {
      const text =
        typeof item === "string"
          ? item
          : item.text;

      const createdItem = await addSubstitutionItem(
        createdGroup.id,
        text,
        user
      );

      items.push(createdItem);
    }

    createdGroups.push({
      ...createdGroup,
      items,
    });
  }

  return createdGroups;
}

// =====================================================
// SONO
// =====================================================

function mapSleepRecord(record) {
  return {
    id: record.id,
    date: record.date,

    sleepScore:
      record.sleep_score === null
        ? ""
        : Number(record.sleep_score),

    bedtime: record.bedtime || "",
    wakeTime: record.wake_time || "",

    sleepDurationMinutes:
      record.sleep_duration_minutes === null
        ? ""
        : Number(record.sleep_duration_minutes),

    actualSleepMinutes:
      record.actual_sleep_minutes === null
        ? ""
        : Number(record.actual_sleep_minutes),

    physicalRecovery:
      record.physical_recovery === null
        ? ""
        : Number(record.physical_recovery),

    restScore:
      record.rest_score === null
        ? ""
        : Number(record.rest_score),

    mentalRecovery:
      record.mental_recovery === null
        ? ""
        : Number(record.mental_recovery),

    sleepCycles:
      record.sleep_cycles === null
        ? ""
        : Number(record.sleep_cycles),

    deepSleepMinutes:
      record.deep_sleep_minutes === null
        ? ""
        : Number(record.deep_sleep_minutes),

    remSleepMinutes:
      record.rem_sleep_minutes === null
        ? ""
        : Number(record.rem_sleep_minutes),

    lightSleepMinutes:
      record.light_sleep_minutes === null
        ? ""
        : Number(record.light_sleep_minutes),

    awakeMinutes:
      record.awake_minutes === null
        ? ""
        : Number(record.awake_minutes),

    perceivedQuality:
      record.perceived_quality === null
        ? ""
        : Number(record.perceived_quality),

    notes: record.notes || "",
    createdBy: activeUserName,
    createdAt: record.created_at,
  };
}

export async function getSleepRecords() {
  const { data, error } = await supabase
    .from("sleep_records")
    .select("*")
    .eq("owner_user_id", ownerId())
    .is("deleted_at", null)
    .order("date", { ascending: false });

  checkError(error);

  return (data || []).map(mapSleepRecord);
}

export async function addSleepRecord(
  record,
  user
) {
  const { data, error } = await supabase
    .from("sleep_records")
    .insert({
      date: record.date,

      sleep_score:
        emptyToNull(record.sleepScore),

      bedtime:
        record.bedtime || null,

      wake_time:
        record.wakeTime || null,

      sleep_duration_minutes:
        emptyToNull(record.sleepDurationMinutes),

      actual_sleep_minutes:
        emptyToNull(record.actualSleepMinutes),

      physical_recovery:
        emptyToNull(record.physicalRecovery),

      rest_score:
        emptyToNull(record.restScore),

      mental_recovery:
        emptyToNull(record.mentalRecovery),

      sleep_cycles:
        emptyToNull(record.sleepCycles),

      deep_sleep_minutes:
        emptyToNull(record.deepSleepMinutes),

      rem_sleep_minutes:
        emptyToNull(record.remSleepMinutes),

      light_sleep_minutes:
        emptyToNull(record.lightSleepMinutes),

      awake_minutes:
        emptyToNull(record.awakeMinutes),

      perceived_quality:
        emptyToNull(record.perceivedQuality),

      notes:
        record.notes || null,

      owner_user_id: ownerId(),
    })
    .select()
    .single();

  checkError(error);

  return mapSleepRecord(data);
}

export async function updateSleepRecord(
  id,
  record,
  user
) {
  const { data, error } = await supabase
    .from("sleep_records")
    .update({
      date: record.date,

      sleep_score:
        emptyToNull(record.sleepScore),

      bedtime:
        record.bedtime || null,

      wake_time:
        record.wakeTime || null,

      sleep_duration_minutes:
        emptyToNull(record.sleepDurationMinutes),

      actual_sleep_minutes:
        emptyToNull(record.actualSleepMinutes),

      physical_recovery:
        emptyToNull(record.physicalRecovery),

      rest_score:
        emptyToNull(record.restScore),

      mental_recovery:
        emptyToNull(record.mentalRecovery),

      sleep_cycles:
        emptyToNull(record.sleepCycles),

      deep_sleep_minutes:
        emptyToNull(record.deepSleepMinutes),

      rem_sleep_minutes:
        emptyToNull(record.remSleepMinutes),

      light_sleep_minutes:
        emptyToNull(record.lightSleepMinutes),

      awake_minutes:
        emptyToNull(record.awakeMinutes),

      perceived_quality:
        emptyToNull(record.perceivedQuality),

      notes:
        record.notes || null,

      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("owner_user_id", ownerId())
    .select()
    .single();

  checkError(error);

  return mapSleepRecord(data);
}

export async function deleteSleepRecord(id) {
  const { error } = await supabase
    .from("sleep_records")
    .update(softDeletePayload())
    .eq("id", id)
    .eq("owner_user_id", ownerId());

  checkError(error);
}