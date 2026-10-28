import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');

  // 1. Clean existing records
  await prisma.notification.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users
  const adminUser = await prisma.user.create({
    data: {
      id: 'usr_admin_01',
      name: 'ศิริพร บุญรักษา (Admin)',
      email: 'admin@company.internal',
      role: 'ADMIN',
      department: 'IT & Facilities',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  const normalUser1 = await prisma.user.create({
    data: {
      id: 'usr_user_01',
      name: 'วิรยาภรณ์ แสนดี',
      email: 'wirayaporn@company.internal',
      role: 'USER',
      department: 'Marketing Strategy',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const normalUser2 = await prisma.user.create({
    data: {
      id: 'usr_user_02',
      name: 'ณัฐพงษ์ สิทธิศักดิ์',
      email: 'nattapong@company.internal',
      role: 'USER',
      department: 'Engineering & Tech',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  // 3. Create Rooms
  const rooms = await Promise.all([
    prisma.room.create({
      data: {
        id: 'room_boardroom',
        name: 'Grand Executive Boardroom (ห้องประชุมใหญ่)',
        description: 'ห้องประชุมขนาดใหญ่ เหมาะสำหรับการประชุมผู้บริหาร ประชุมประจำปี และการนำเสนองานสำคัญ',
        capacity: 20,
        location: 'ชั้น 5 ตึก A',
        color: '#2563eb', // Blue
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600',
        equipment: JSON.stringify([
          'Smart TV 75 นิ้ว 4K',
          'Polycom Video Conference Bar',
          'ไมโครโฟนไร้สาย 4 ตัว',
          'Whiteboard ดิจิทัล',
          'Wi-Fi ความเร็วสูง 1Gbps',
        ]),
      },
    }),
    prisma.room.create({
      data: {
        id: 'room_innovation',
        name: 'Innovation & Brainstorming Lab (ห้องระดมความคิด)',
        description: 'พื้นที่สร้างสรรค์สำหรับการจัด Workshop, สปรินท์งานออกแบบ และการประชุมทีมขนาดกลาง',
        capacity: 10,
        location: 'ชั้น 3 ตึก B',
        color: '#10b981', // Emerald green
        imageUrl: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=600',
        equipment: JSON.stringify([
          'โปรเจกเตอร์ความคมชัดสูง',
          'Whiteboard รอบทิศทาง',
          'Post-it & Design Thinking Kit',
          'ลำโพงบลูทูธ Conference',
        ]),
      },
    }),
    prisma.room.create({
      data: {
        id: 'room_focus',
        name: 'Focus Room Alpha (ห้องประชุมย่อย 1)',
        description: 'ห้องประชุมขนาดเล็ก เหมาะสำหรับการสัมภาษณ์งาน คุยงาน 1-on-1 หรือโทรคุยกับลูกค้าต่างประเทศ',
        capacity: 4,
        location: 'ชั้น 2 ตึก A',
        color: '#f59e0b', // Amber
        imageUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600',
        equipment: JSON.stringify([
          'จอ Monitor 43 นิ้ว',
          'Webcam HD พร้อมไมค์ตัดเสียงรบกวน',
          'แผ่นซับเสียงรอบห้อง',
        ]),
      },
    }),
    prisma.room.create({
      data: {
        id: 'room_studio',
        name: 'Media & Townhall Studio (ห้องสตูดิโอถ่ายทอดสด)',
        description: 'ห้องประชุมแบบเอนกประสงค์ มีระบบกล้องสตรีมมิ่งและระบบไฟสตูดิโอ รองรับการจัดสัมมนาออนไลน์',
        capacity: 15,
        location: 'ชั้น 1 อาคารสื่อ',
        color: '#8b5cf6', // Violet
        imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600',
        equipment: JSON.stringify([
          'กล้อง PTZ Tracking 2 ตัว',
          'ระบบไฟ Softbox Studio',
          'Audio Mixer + ไมค์หนีบปกเสื้อ 4 ชุด',
          'มอนิเตอร์แสดงผล Teleprompter',
        ]),
      },
    }),
  ]);

  // 4. Create Sample Bookings for Today & Tomorrow
  const now = new Date();
  
  // Meeting 1: Today 09:30 - 11:30 in Boardroom
  const todayStart1 = new Date(now);
  todayStart1.setHours(9, 30, 0, 0);
  const todayEnd1 = new Date(now);
  todayEnd1.setHours(11, 30, 0, 0);

  const b1 = await prisma.booking.create({
    data: {
      roomId: rooms[0].id,
      userId: normalUser1.id,
      title: 'ประชุมวางแผนกลยุทธ์การตลาด Q4 (Marketing Q4 Roadmap)',
      description: 'ทบทวนผลประกอบการไตรมาสก่อนหน้า และอนุมัติงบประมาณแคมเปญส่งท้ายปี',
      startTime: todayStart1,
      endTime: todayEnd1,
      attendeesCount: 12,
      equipmentRequested: JSON.stringify(['Smart TV 75 นิ้ว 4K', 'Polycom Video Conference Bar']),
      status: 'CONFIRMED',
      syncedToSheets: true,
      sheetRowId: 'row_101',
    },
  });

  // Attach sample Google Drive file
  await prisma.attachment.create({
    data: {
      bookingId: b1.id,
      fileName: 'Q4_Marketing_Strategy_Slides.pdf',
      fileSize: 2450000,
      mimeType: 'application/pdf',
      driveFileId: '1AbCdEfGhIjKlMnOpQrStUvWxYz',
      driveWebViewLink: 'https://drive.google.com/file/d/sample_marketing_deck/view',
      driveDownloadLink: 'https://drive.google.com/uc?id=sample_marketing_deck&export=download',
    },
  });

  // Meeting 2: Today 13:30 - 15:00 in Innovation Lab
  const todayStart2 = new Date(now);
  todayStart2.setHours(13, 30, 0, 0);
  const todayEnd2 = new Date(now);
  todayEnd2.setHours(15, 0, 0, 0);

  await prisma.booking.create({
    data: {
      roomId: rooms[1].id,
      userId: normalUser2.id,
      title: 'Design Sprint: พัฒนาฟีเจอร์ Mobile App Redesign',
      description: 'วิเคราะห์ Customer Journey ใหม่และร่วมทดสอบ Prototype กับทีม UX',
      startTime: todayStart2,
      endTime: todayEnd2,
      attendeesCount: 8,
      equipmentRequested: JSON.stringify(['โปรเจกเตอร์ความคมชัดสูง', 'Post-it & Design Thinking Kit']),
      status: 'CONFIRMED',
      syncedToSheets: true,
    },
  });

  // Meeting 3: Tomorrow 10:00 - 11:30 in Focus Room Alpha
  const tmrwStart = new Date(now);
  tmrwStart.setDate(tmrwStart.getDate() + 1);
  tmrwStart.setHours(10, 0, 0, 0);
  const tmrwEnd = new Date(tmrwStart);
  tmrwEnd.setHours(11, 30, 0, 0);

  await prisma.booking.create({
    data: {
      roomId: rooms[2].id,
      userId: adminUser.id,
      title: 'สัมภาษณ์ผู้สมัครงานตำแหน่ง Senior Frontend Engineer',
      description: 'สัมภาษณ์รอบสุดท้ายพร้อมทดสอบทักษะ Architecture และ System Design',
      startTime: tmrwStart,
      endTime: tmrwEnd,
      attendeesCount: 3,
      equipmentRequested: JSON.stringify(['จอ Monitor 43 นิ้ว', 'Webcam HD พร้อมไมค์ตัดเสียงรบกวน']),
      status: 'CONFIRMED',
      syncedToSheets: true,
    },
  });

  // Seed sample notifications
  await prisma.notification.create({
    data: {
      userId: normalUser1.id,
      bookingId: b1.id,
      title: 'ยืนยันการจองห้องประชุมสำเร็จ',
      message: 'คุณได้จอง Grand Executive Boardroom วันนี้ เวลา 09:30 - 11:30 น. สำเร็จ',
      type: 'BOOKING_CREATED',
      isRead: false,
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
