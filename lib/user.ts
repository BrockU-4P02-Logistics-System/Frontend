import bcrypt from "bcrypt";
import { query } from "./db";

export interface User {
    id: string;
    email: string;
    name: string;
    password: string;

}
  

// Create a new user
export const createUser = async (email: string, password: string, name: string): Promise<User> => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await query(
    `INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name`,
    [email, hashedPassword, name]
  );

  return result.rows[0];
};

// Find a user by email
export const findUserByEmail = async (email: string): Promise<User | null> => {
  const result = await query(`SELECT * FROM users WHERE email = $1`, [email]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

// Verify user credentials
export const verifyUser = async (email: string, password: string): Promise<User | null> => {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.password as string);
  if (!isValid) return null;

  // Exclude password from the returned user object
  const { password: _, ...safeUser } = user;
  return safeUser;
};
