/**
 * Teste temporário: compara a senha em texto puro com um hash bcrypt.
 * Uso: npx tsx scripts/test-bcrypt-compare.ts
 */
import bcrypt from "bcryptjs";

const PLAIN_PASSWORD = "Cpvistos@1979";
const HASH =
  "$2a$12$GyHfI5Rey0xjzIcCK9wlKeLAqFSYI9L3UUc8bCZnu.s7TP9m8bNPC";

async function main() {
  const match = await bcrypt.compare(PLAIN_PASSWORD, HASH);
  console.log("bcrypt.compare result:", match);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
