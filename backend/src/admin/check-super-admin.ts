import {
  PrismaClient,
  AdminRole,
} from "@prisma/client";

import * as bcrypt from "bcrypt";
import * as readline from "readline";

const prisma = new PrismaClient();

function askQuestion(
  rl: readline.Interface,
  question: string,
): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function askPassword(
  rl: readline.Interface,
  question: string,
): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    stdout.write(question);

    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let password = "";

    const onData = (char: string) => {
      if (char === "\r" || char === "\n") {
        stdin.setRawMode?.(false);
        stdin.pause();
        stdin.removeListener("data", onData);

        stdout.write("\n");

        resolve(password);
        return;
      }

      if (char === "\u0003") {
        stdin.setRawMode?.(false);
        stdin.pause();
        stdin.removeListener("data", onData);

        stdout.write("\n");
        process.exit(1);
      }

      if (char === "\u007f") {
        password = password.slice(0, -1);
        return;
      }

      password += char;
    };

    stdin.on("data", onData);
  });
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log("");
    console.log("==========================================");
    console.log("       TAXILINK - TESTE SUPER ADMIN");
    console.log("==========================================");
    console.log("");

    const email = await askQuestion(
      rl,
      "Email do Super Admin: ",
    );

    const password = await askPassword(
      rl,
      "Senha do Super Admin: ",
    );

    const user = await prisma.user.findUnique({
      where: {
        email: email.trim(),
      },
      include: {
        adminProfile: true,
      },
    });

    if (!user) {
      console.log("");
      console.log("❌ Usuário não encontrado.");
      return;
    }

    console.log("");
    console.log("Usuário encontrado: SIM");
    console.log("Email:", user.email);
    console.log("Role:", user.role);

    if (!user.adminProfile) {
      console.log("AdminProfile: NÃO");
    } else {
      console.log(
        "AdminRole:",
        user.adminProfile.adminRole,
      );

      console.log(
        "AdminStatus:",
        user.adminProfile.status,
      );
    }

    console.log(
      "Hash bcrypt:",
      user.passwordHash.startsWith("$2")
        ? "SIM"
        : "NÃO",
    );

    const passwordMatch = await bcrypt.compare(
      password,
      user.passwordHash,
    );

    console.log("");

    if (passwordMatch) {
      console.log(
        "✅ SENHA CORRETA - bcrypt.compare() = true",
      );
    } else {
      console.log(
        "❌ SENHA NÃO CORRESPONDE - bcrypt.compare() = false",
      );
    }

    console.log("");
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error("");
  console.error("❌ Erro:", error);
  await prisma.$disconnect();
  process.exit(1);
});