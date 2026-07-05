const prisma = require('../db');

const DAY_MAP = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];

const listFood = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const todayKey = DAY_MAP[new Date().getDay()];

    const students = await prisma.student.findMany({
      where: { organizationId },
      select: {
        id: true, name: true,
        mealBreakfast: true, mealLunch: true, mealDinner: true,
        bed: { include: { room: true } },
        mealPlans: { where: { day: todayKey } },
      },
      orderBy: { name: 'asc' }
    });

    // Merge: prefer today's MealPlan entry if it exists, else fall back to legacy Student.mealX fields
    const result = students.map(s => {
      const todayPlan = s.mealPlans?.[0];
      return {
        id: s.id,
        name: s.name,
        bed: s.bed,
        mealBreakfast: todayPlan ? todayPlan.breakfast : s.mealBreakfast,
        mealLunch: todayPlan ? todayPlan.lunch : s.mealLunch,
        mealDinner: todayPlan ? todayPlan.dinner : s.mealDinner,
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getStudentFood = async (req, res) => {
  try {
    const id = Number(req.params.studentId);
    const organizationId = req.user.organizationId;

    const student = await prisma.student.findFirst({
      where: { id, organizationId },
      select: {
        id: true, name: true,
        mealBreakfast: true, mealLunch: true, mealDinner: true,
        bed: { include: { room: true } }
      }
    });

    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateMeal = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const id = Number(req.params.studentId);

    const existing = await prisma.student.findFirst({ where: { id, organizationId } });
    if (!existing) return res.status(404).json({ message: 'Student not found' });

    const { mealBreakfast, mealLunch, mealDinner } = req.body;
    const student = await prisma.student.update({
      where: { id },
      data: {
        ...(mealBreakfast !== undefined && { mealBreakfast }),
        ...(mealLunch !== undefined && { mealLunch }),
        ...(mealDinner !== undefined && { mealDinner }),
      }
    });
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const summary = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const students = await prisma.student.findMany({
      where: { organizationId },
      select: { mealBreakfast: true, mealLunch: true, mealDinner: true }
    });
    const totals = students.reduce((acc, s) => {
      acc.breakfast += s.mealBreakfast ? 1 : 0;
      acc.lunch += s.mealLunch ? 1 : 0;
      acc.dinner += s.mealDinner ? 1 : 0;
      return acc;
    }, { breakfast: 0, lunch: 0, dinner: 0 });
    res.json({ ...totals, total: students.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { listFood, getStudentFood, updateMeal, summary };