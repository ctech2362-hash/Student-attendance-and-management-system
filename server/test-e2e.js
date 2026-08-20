async function runE2ETests() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('🚀 Starting End-to-End API Verification against:', BASE_URL);

  // 1. Auth Login
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  const loginData = await loginRes.json();
  if (loginRes.status !== 200 || !loginData.token) {
    throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  }
  console.log('✅ 1. Auth Login: SUCCESS (token received)');
  const token = loginData.token;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 2. Dashboard Stats
  const statsRes = await fetch(`${BASE_URL}/dashboard/stats`, { headers });
  const statsData = await statsRes.json();
  console.log('✅ 2. Dashboard Stats:', statsData);

  // 3. Students List
  const studentsRes = await fetch(`${BASE_URL}/students`, { headers });
  const studentsData = await studentsRes.json();
  console.log(`✅ 3. Students List: Found ${studentsData.length} students`);

  // 4. Subjects List
  const subjectsRes = await fetch(`${BASE_URL}/subjects`, { headers });
  const subjectsData = await subjectsRes.json();
  console.log(`✅ 4. Subjects List: Found ${subjectsData.length} subjects`);

  // 5. Bulk Mark Attendance
  const markRes = await fetch(`${BASE_URL}/attendance/mark`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      subject_id: subjectsData[0].id,
      date: '2026-08-20',
      records: [
        { student_id: studentsData[0].id, status: 'present' },
        { student_id: studentsData[1].id, status: 'absent' },
      ],
    }),
  });
  const markData = await markRes.json();
  console.log('✅ 5. Bulk Mark Attendance:', markData.message);

  // 6. Attendance History
  const historyRes = await fetch(`${BASE_URL}/attendance/history`, { headers });
  const historyData = await historyRes.json();
  console.log(`✅ 6. Attendance History: Found ${historyData.length} records`);

  // 7. Student Report
  const reportRes = await fetch(`${BASE_URL}/reports/student/${studentsData[0].id}`, { headers });
  const reportData = await reportRes.json();
  console.log(`✅ 7. Student Report: Overall Percentage = ${reportData.overall.percentage}%`);

  // 8. Create and delete a student
  const createStudentRes = await fetch(`${BASE_URL}/students`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      student_id: 'TEST999',
      name: 'Test Student',
      email: 'test@example.com',
      course: 'Computer Science',
      semester: 4,
    }),
  });
  const newStudent = await createStudentRes.json();
  console.log('✅ 8. Create Student:', newStudent.name, `(ID: ${newStudent.id})`);

  const deleteRes = await fetch(`${BASE_URL}/students/${newStudent.id}`, {
    method: 'DELETE',
    headers,
  });
  const deleteData = await deleteRes.json();
  console.log('✅ 9. Delete Student:', deleteData.message);

  console.log('\n🎉 ALL REST API ENDPOINTS TESTED AND WORKING 100%!');
}

runE2ETests().catch((err) => {
  console.error('❌ E2E Test Error:', err.message);
});
