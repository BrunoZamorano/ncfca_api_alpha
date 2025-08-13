import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando a limpeza de CPFs...');

  const users = await prisma.user.findMany({
    where: {
      cpf: {
        contains: '.',
      },
    },
  });

  if (users.length === 0) {
    console.log('Nenhum CPF com pontuação encontrado para limpar.');
    return;
  }

  console.log(`Encontrados ${users.length} usuários com CPFs a serem limpos.`);

  let updatedCount = 0;
  for (const user of users) {
    try {
      const cleanedCpf = user.cpf.replace(/\D/g, '');
      await prisma.user.update({
        where: { id: user.id },
        data: { cpf: cleanedCpf },
      });
      updatedCount++;
    } catch (error) {
      console.error(`Erro ao atualizar o CPF para o usuário ${user.id}:`, error);
    }
  }

  console.log(`Foram atualizados ${updatedCount} CPFs.`);
  console.log('Limpeza de CPFs finalizada.');
}

main()
  .catch((e) => {
    console.error('Erro durante o script de limpeza de CPF:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
