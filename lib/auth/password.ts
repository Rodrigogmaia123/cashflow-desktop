import bcrypt from "bcryptjs";

/**
 * Utilitários para hash e verificação de senhas
 * Usa bcryptjs para segurança
 */

/**
 * Gera hash da senha
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verifica se a senha corresponde ao hash
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
