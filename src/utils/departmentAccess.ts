/** รหัสแผนกที่ใช้เทียบ allowed_departments / route policy (สอดคล้อง backend) */

export function expandDepartmentGateCodes(deptCode: string): string[] {

  const trimmed = deptCode.trim();

  const upper = trimmed.toUpperCase();

  const codes = new Set<string>([trimmed, upper]);

  if (upper === 'WE' || upper === 'WELDING') {

    codes.add('WE');

    codes.add('WELDING');

  }

  if (upper === 'PD' || upper === 'PRESS' || upper === 'PRESS_FIT') {

    codes.add('PD');

    codes.add('PRESS');

    codes.add('PRESS_FIT');

  }

  return [...codes];

}



export function departmentMatchesAllowed(

  userDepartmentCode: string | null | undefined,

  allowedDepartments?: string[] | null,

): boolean {

  if (!allowedDepartments?.length) return true;

  if (!userDepartmentCode) return false;

  const gate = expandDepartmentGateCodes(userDepartmentCode);

  return allowedDepartments.some((allowed) =>

    gate.some(

      (g) => g.toUpperCase() === String(allowed ?? '').trim().toUpperCase(),

    ),

  );

}



/** ผู้ใช้มีแผนกใดแผนกหนึ่งที่เข้าเงื่อนไข allowed หรือไม่ */

export function departmentMatchesAnyUserDepartments(

  userDepartmentCodes: string[],

  allowedDepartments?: string[] | null,

): boolean {

  if (!allowedDepartments?.length) return true;

  if (!userDepartmentCodes.length) return false;

  return userDepartmentCodes.some((code) =>

    departmentMatchesAllowed(code, allowedDepartments),

  );

}


