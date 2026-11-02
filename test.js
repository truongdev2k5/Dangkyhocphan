const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function test() {
  try {
    const svCount = await prisma.sinhVien.count();
    console.log("svCount:", svCount);
    const gvCount = await prisma.giangVien.count();
    console.log("gvCount:", gvCount);
    const lopCount = await prisma.lopHocPhan.count();
    console.log("lopCount:", lopCount);
    const choDuyetCount = await prisma.danhSachDangKy.count({
      where: { trang_thai: "cho_duyet" },
    });
    console.log("choDuyetCount:", choDuyetCount);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
