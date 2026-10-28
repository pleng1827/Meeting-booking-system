import { RoomData, BookingData } from '@/types/booking';

export const INITIAL_MOCK_ROOMS: RoomData[] = [
  {
    id: 'room_boardroom',
    name: 'Grand Executive Boardroom (ห้องประชุมใหญ่)',
    description: 'ห้องประชุมขนาดใหญ่ เหมาะสำหรับการประชุมผู้บริหาร ประชุมประจำปี และการนำเสนองานสำคัญ',
    capacity: 20,
    location: 'ชั้น 5 ตึก A',
    color: '#2563eb',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600',
    equipment: [
      'Smart TV 75 นิ้ว 4K',
      'Polycom Video Conference Bar',
      'ไมโครโฟนไร้สาย 4 ตัว',
      'Whiteboard ดิจิทัล',
      'Wi-Fi ความเร็วสูง 1Gbps',
    ],
    isActive: true,
    currentStatus: 'AVAILABLE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'room_innovation',
    name: 'Innovation & Brainstorming Lab (ห้องระดมความคิด)',
    description: 'พื้นที่สร้างสรรค์สำหรับการจัด Workshop, สปรินท์งานออกแบบ และการประชุมทีมขนาดกลาง',
    capacity: 10,
    location: 'ชั้น 3 ตึก B',
    color: '#10b981',
    imageUrl: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=600',
    equipment: [
      'โปรเจกเตอร์ความคมชัดสูง',
      'Whiteboard รอบทิศทาง',
      'Post-it & Design Thinking Kit',
      'ลำโพงบลูทูธ Conference',
    ],
    isActive: true,
    currentStatus: 'AVAILABLE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'room_focus',
    name: 'Focus Room Alpha (ห้องประชุมย่อย 1)',
    description: 'ห้องประชุมขนาดเล็ก เหมาะสำหรับการสัมภาษณ์งาน คุยงาน 1-on-1 หรือโทรคุยกับลูกค้าต่างประเทศ',
    capacity: 4,
    location: 'ชั้น 2 ตึก A',
    color: '#f59e0b',
    imageUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600',
    equipment: ['จอ Monitor 43 นิ้ว', 'Webcam HD พร้อมไมค์ตัดเสียงรบกวน', 'แผ่นซับเสียงรอบห้อง'],
    isActive: true,
    currentStatus: 'AVAILABLE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'room_studio',
    name: 'Media & Townhall Studio (ห้องสตูดิโอถ่ายทอดสด)',
    description: 'ห้องประชุมแบบเอนกประสงค์ มีระบบกล้องสตรีมมิ่งและระบบไฟสตูดิโอ รองรับการจัดสัมมนาออนไลน์',
    capacity: 15,
    location: 'ชั้น 1 อาคารสื่อ',
    color: '#8b5cf6',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600',
    equipment: [
      'กล้อง PTZ Tracking 2 ตัว',
      'ระบบไฟ Softbox Studio',
      'Audio Mixer + ไมค์หนีบปกเสื้อ 4 ชุด',
    ],
    isActive: true,
    currentStatus: 'AVAILABLE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const today = new Date();
const start1 = new Date(today);
start1.setHours(9, 30, 0, 0);
const end1 = new Date(today);
end1.setHours(11, 30, 0, 0);

const start2 = new Date(today);
start2.setHours(13, 30, 0, 0);
const end2 = new Date(today);
end2.setHours(15, 0, 0, 0);

export const INITIAL_MOCK_BOOKINGS: BookingData[] = [
  {
    id: 'bk_mock_01',
    roomId: 'room_boardroom',
    userId: 'usr_01',
    title: 'ประชุมวางแผนกลยุทธ์การตลาด Q4 (Marketing Roadmap)',
    description: 'ทบทวนผลประกอบการไตรมาสก่อนหน้า และอนุมัติงบประมาณแคมเปญส่งท้ายปี',
    startTime: start1.toISOString(),
    endTime: end1.toISOString(),
    attendeesCount: 12,
    equipmentRequested: ['Smart TV 75 นิ้ว 4K', 'Polycom Video Conference Bar'],
    status: 'CONFIRMED',
    syncedToSheets: true,
    sheetRowId: 'row_101',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    room: INITIAL_MOCK_ROOMS[0],
    user: {
      id: 'usr_01',
      name: 'วิรยาภรณ์ แสนดี',
      email: 'wirayaporn@company.internal',
      role: 'USER',
      department: 'Marketing Strategy',
      avatarUrl: null,
    },
    attachments: [
      {
        id: 'att_01',
        bookingId: 'bk_mock_01',
        fileName: 'Q4_Marketing_Strategy_Slides.pdf',
        fileSize: 2450000,
        mimeType: 'application/pdf',
        driveFileId: 'mock_drive_1',
        driveWebViewLink: 'https://drive.google.com',
        driveDownloadLink: null,
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'bk_mock_02',
    roomId: 'room_innovation',
    userId: 'usr_02',
    title: 'Design Sprint: พัฒนาฟีเจอร์ Mobile App Redesign',
    description: 'วิเคราะห์ Customer Journey ใหม่และร่วมทดสอบ Prototype กับทีม UX',
    startTime: start2.toISOString(),
    endTime: end2.toISOString(),
    attendeesCount: 8,
    equipmentRequested: ['โปรเจกเตอร์ความคมชัดสูง'],
    status: 'CONFIRMED',
    syncedToSheets: true,
    sheetRowId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    room: INITIAL_MOCK_ROOMS[1],
    user: {
      id: 'usr_02',
      name: 'ณัฐพงษ์ สิทธิศักดิ์',
      email: 'nattapong@company.internal',
      role: 'USER',
      department: 'Engineering',
      avatarUrl: null,
    },
    attachments: [],
  },
];
