export function validStudentProfile(data) {
  const validGraduationYear =
    data.graduationYear == null ||
    (Number.isInteger(data.graduationYear) &&
      data.graduationYear >= 2000 &&
      data.graduationYear <= 2100);
  const validSemester =
    data.semester == null ||
    (Number.isInteger(data.semester) && data.semester >= 1 && data.semester <= 12);

  return validGraduationYear && validSemester;
}
