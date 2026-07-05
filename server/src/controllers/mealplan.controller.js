const prisma = require('../db');

const DAYS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];

// Get meal plan for a student
const getMealPlan = async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);
    const organizationId = req.user.organizationId;

    const student = await prisma.student.findFirst({ where: { id: studentId, organizationId } });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const plans = await prisma.mealPlan.findMany({ where: { studentId } });

    // Return full week, filling missing days with false
    const result = DAYS.map(day => {
      const found = plans.find(p => p.day === day);
      return { day, breakfast: found?.breakfast || false, lunch: found?.lunch || false, dinner: found?.dinner || false };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update meal plan for a student (upsert per day)
const updateMealPlan = async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);
    const organizationId = req.user.organizationId;
    const { day, breakfast, lunch, dinner } = req.body;

    const student = await prisma.student.findFirst({ where: { id: studentId, organizationId } });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    if (!DAYS.includes(day)) return res.status(400).json({ message: 'Invalid day' });

    const plan = await prisma.mealPlan.upsert({
      where: { studentId_day: { studentId, day } },
      update: { breakfast: !!breakfast, lunch: !!lunch, dinner: !!dinner },
      create: { studentId, day, breakfast: !!breakfast, lunch: !!lunch, dinner: !!dinner },
    });

    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get weekly summary for admin (how many tenants per day per meal)
const weeklySummary = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const students = await prisma.student.findMany({
      where: { organizationId },
      select: { id: true }
    });
    const studentIds = students.map(s => s.id);

    const plans = await prisma.mealPlan.findMany({
      where: { studentId: { in: studentIds } }
    });

    const result = DAYS.map(day => {
      const dayPlans = plans.filter(p => p.day === day);
      return {
        day,
        breakfast: dayPlans.filter(p => p.breakfast).length,
        lunch:     dayPlans.filter(p => p.lunch).length,
        dinner:    dayPlans.filter(p => p.dinner).length,
      };
    });

    res.json({ summary: result, totalStudents: studentIds.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getMealPlan, updateMealPlan, weeklySummary };