export function formDataRows(formData: FormData, fields: string[]): Record<string, string>[] {
  const lists = fields.map((field) => formData.getAll(field).map((value) => String(value ?? "")));
  const length = Math.max(0, ...lists.map((list) => list.length));
  const rows: Record<string, string>[] = [];

  for (let index = 0; index < length; index += 1) {
    const row: Record<string, string> = {};
    fields.forEach((field, fieldIndex) => {
      row[field] = lists[fieldIndex][index] ?? "";
    });
    rows.push(row);
  }

  return rows;
}

export function filledFormRows(formData: FormData, fields: string[]): Record<string, string>[] {
  return formDataRows(formData, fields).filter((row) => {
    const description = row.description?.trim() ?? "";
    const amount = row.amount?.trim() ?? "";
    return Boolean(description || amount);
  });
}
