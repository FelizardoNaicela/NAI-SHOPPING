import {
  PrismaClient,
  UserRole,
  AdminRole,
  AdminStatus,
} from "@prisma/client";

import * as bcrypt from "bcrypt";
import * as readline from "readline";

const prisma = new PrismaClient();

function askQuestion(
  question: string,
): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function askPassword(
  question: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    stdout.write(question);

    let password = "";

    function cleanup() {
      stdin.setRawMode?.(false);
      stdin.pause();
      stdin.removeListener("data", onData);
      stdin.removeListener("error", onError);
    }

    function onError(error: Error) {
      cleanup();
      reject(error);
    }

    function onData(char: Buffer | string) {
      const input = char.toString();

      for (const currentChar of input) {
        // ENTER
        if (
          currentChar === "\r" ||
          currentChar === "\n"
        ) {
          cleanup();

          stdout.write("\n");

          resolve(password);

          return;
        }

        // CTRL+C
        if (currentChar === "\u0003") {
          cleanup();

          stdout.write("\n");

          reject(
            new Error(
              "Operação cancelada pelo utilizador.",
            ),
          );

          return;
        }

        // BACKSPACE
        if (currentChar === "\u007f") {
          if (password.length > 0) {
            password = password.slice(0, -1);
          }

          continue;
        }

        password += currentChar;
      }
    }

    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    stdin.on("data", onData);
    stdin.on("error", onError);
  });
}

async function main() {
  console.log("");
  console.log(
    "==========================================",
  );
  console.log(
    "      TAXILINK - SUPER ADMIN BOOTSTRAP",
  );
  console.log(
    "==========================================",
  );
  console.log("");

  try {
    // ========================================================
    // 1. Verificar se já existe um Super Admin
    // ========================================================

    const existingSuperAdmin =
      await prisma.adminProfile.findFirst({
        where: {
          adminRole: AdminRole.SUPER_ADMIN,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

    if (existingSuperAdmin) {
      throw new Error(
        `Já existe um Super Admin: ${existingSuperAdmin.user.email}. ` +
          `O bootstrap foi interrompido por segurança.`,
      );
    }

    // ========================================================
    // 2. Recolher dados
    // ========================================================

    const email = await askQuestion(
      "Email do Super Admin: ",
    );

    if (!email) {
      throw new Error(
        "O email é obrigatório.",
      );
    }

    const name = await askQuestion(
      "Nome do Super Admin: ",
    );

    const countryCode =
      await askQuestion(
        "Country code (ex.: MZ): ",
      );

    if (!countryCode) {
      throw new Error(
        "O countryCode é obrigatório.",
      );
    }

    // ========================================================
    // 3. Ler senha sem readline ativo
    // ========================================================

    const password =
      await askPassword(
        "Senha do Super Admin: ",
      );

    if (!password) {
      throw new Error(
        "A senha não pode estar vazia.",
      );
    }

    if (password.length < 12) {
      throw new Error(
        "Por segurança, a senha do Super Admin deve ter pelo menos 12 caracteres.",
      );
    }

    // ========================================================
    // 4. Verificar se o email já existe
    // ========================================================

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email,
        },
        include: {
          adminProfile: true,
        },
      });

    if (existingUser) {
      throw new Error(
        `Já existe um usuário com o email ${email}. ` +
          `Por segurança, o bootstrap não altera uma conta existente.`,
      );
    }

    // ========================================================
    // 5. Criar hash da senha
    // ========================================================

    const passwordHash =
      await bcrypt.hash(
        password,
        12,
      );

    // ========================================================
    // 6. Criar User + AdminProfile
    // ========================================================

    const result =
      await prisma.$transaction(
        async (tx) => {
          const user =
            await tx.user.create({
              data: {
                email,
                name: name || null,
                countryCode:
                  countryCode.toUpperCase(),
                passwordHash,

                role: UserRole.ADMIN,

                region: null,
              },
            });

          const adminProfile =
            await tx.adminProfile.create({
              data: {
                userId: user.id,

                adminRole:
                  AdminRole.SUPER_ADMIN,

                status:
                  AdminStatus.ACTIVE,

                region: null,

                canManageVerifications:
                  true,

                canApproveVerifications:
                  true,

                canRevokeVerifications:
                  true,

                canManageStores:
                  true,

                canManageRanking:
                  true,

                canPromoteRegionalAdmins:
                  true,
              },
            });

          return {
            user,
            adminProfile,
          };
        },
      );

    // ========================================================
    // 7. Resultado
    // ========================================================

    console.log("");
    console.log(
      "==========================================",
    );
    console.log(
      "       SUPER ADMIN CRIADO COM SUCESSO",
    );
    console.log(
      "==========================================",
    );
    console.log("");

    console.log(
      `ID: ${result.user.id}`,
    );

    console.log(
      `Email: ${result.user.email}`,
    );

    console.log(
      `Role: ${result.user.role}`,
    );

    console.log(
      `Admin Role: ${result.adminProfile.adminRole}`,
    );

    console.log(
      `Status: ${result.adminProfile.status}`,
    );

    console.log(
      "Região: GLOBAL",
    );

    console.log("");

    console.log(
      "Todas as permissões administrativas foram ativadas.",
    );

    console.log("");

    console.log(
      "IMPORTANTE: guarda as credenciais do Super Admin num local seguro.",
    );

    console.log("");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("");
  console.error(
    "ERRO:",
    error instanceof Error
      ? error.message
      : error,
  );
  console.error("");

  prisma
    .$disconnect()
    .finally(() => {
      process.exit(1);
    });
});