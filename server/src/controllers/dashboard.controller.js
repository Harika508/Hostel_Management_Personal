const prisma = require('../db');
const DAY_MAP = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];

const stats = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    // Get all rooms with beds for this organization
    const rooms = await prisma.room.findMany({
      where: { organizationId },
      include: { beds: true }
    });

    const totalBeds = rooms.reduce((acc, r) => acc + r.totalBeds, 0);
    const occupied = rooms.reduce((acc, r) => acc + r.beds.filter(b => b.status === 'OCCUPIED').length, 0);
    const vacant = rooms.reduce((acc, r) => acc + r.beds.filter(b => b.status === 'VACANT').length, 0);
    const leavingSoon = rooms.reduce((acc, r) => acc + r.beds.filter(b => b.status === 'LEAVING_SOON').length, 0);

    // Payments stats
    const pendingPayments = await prisma.payment.count({
      where: { status: 'UNPAID', student: { organizationId } }
    });

    const totalPendingAmount = await prisma.payment.aggregate({
      where: { status: { in: ['UNPAID', 'PARTIAL'] }, student: { organizationId } },
      _sum: { amount: true }
    });

    // Students stats
    const totalStudents = await prisma.student.count({ where: { organizationId } });
    const pendingKyc = await prisma.student.count({ where: { organizationId, kycStatus: 'PENDING' } });

    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const leavingThisWeek = await prisma.student.count({
      where: {
        organizationId,
        checkOutDate: { gte: now, lte: nextWeek }
      }
    });

    // Occupancy by month (last 6 months)
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        month: date.toLocaleString('default', { month: 'short' }),
        year: date.getFullYear(),
      });
    }
    // Today's meal counts — prefer MealPlan entry for today, fall back to legacy Student.mealX fields
    const todayKey = DAY_MAP[new Date().getDay()];
    const allStudents = await prisma.student.findMany({
      where: { organizationId },
      select: {
        id: true,
        mealBreakfast: true, mealLunch: true, mealDinner: true,
        mealPlans: { where: { day: todayKey } },
      },
    });
    const mealCounts = allStudents.reduce((acc, s) => {
      const todayPlan = s.mealPlans?.[0];
      const breakfast = todayPlan ? todayPlan.breakfast : s.mealBreakfast;
      const lunch = todayPlan ? todayPlan.lunch : s.mealLunch;
      const dinner = todayPlan ? todayPlan.dinner : s.mealDinner;
      if (breakfast) acc.mealBreakfast++;
      if (lunch) acc.mealLunch++;
      if (dinner) acc.mealDinner++;
      return acc;
    }, { mealBreakfast: 0, mealLunch: 0, mealDinner: 0 });

    res.json({
      totalBeds,
      occupied,
      vacant,
      leavingSoon,
      totalRooms: rooms.length,
      totalStudents,
      pendingPayments,
      pendingKyc,
      leavingThisWeek,
      pendingAmount: totalPendingAmount._sum.amount || 0,
      occupancyByMonth: months,
      ...mealCounts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { stats };