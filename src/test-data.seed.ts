// src/test-data.seed.ts

import { NestExpressApplication } from '@nestjs/platform-express';
import { HASHING_SERVICE, ID_GENERATOR } from '@/shared/constants/service-constants';
import HashingService from '@/domain/services/hashing-service';
import IdGenerator from '@/application/services/id-generator';
import { CLUB_REPOSITORY, FAMILY_REPOSITORY, USER_REPOSITORY } from '@/shared/constants/repository-constants';
import UserRepository from '@/domain/repositories/user-repository';
import FamilyRepository from '@/domain/repositories/family-repository';
import ClubRepository from '@/domain/repositories/club-repository';
import User from '@/domain/entities/user/user';
import { UserRoles } from '@/domain/enums/user-roles';
import Family from '@/domain/entities/family/family';
import Club from '@/domain/entities/club/club';
import CpfGenerator from '@/infraestructure/services/cpf-generator.service';

// Dados de teste para clubes e diretores
const seedData = [
  {
    owner: { firstName: 'Carlos', lastName: 'Mendes', email: 'carlos.mendes@clubedebate.com' },
    club: { name: 'Oradores do Planalto', city: 'Brasília', state: 'DF' },
  },
  {
    owner: { firstName: 'Beatriz', lastName: 'Costa', email: 'beatriz.costa@clubedebate.com' },
    club: { name: 'Debatedores da Guanabara', city: 'Rio de Janeiro', state: 'RJ' },
  },
  {
    owner: { firstName: 'Ricardo', lastName: 'Nogueira', email: 'ricardo.nogueira@clubedebate.com' },
    club: { name: 'Paulistas em Foco', city: 'São Paulo', state: 'SP' },
  },
  {
    owner: { firstName: 'Juliana', lastName: 'Alves', email: 'juliana.alves@clubedebate.com' },
    club: { name: 'Argumento Mineiro', city: 'Belo Horizonte', state: 'MG' },
  },
  {
    owner: { firstName: 'Fernando', lastName: 'Lopes', email: 'fernando.lopes@clubedebate.com' },
    club: { name: 'Vozes do Sul', city: 'Porto Alegre', state: 'RS' },
  },
  {
    owner: { firstName: 'Patrícia', lastName: 'Ferreira', email: 'patricia.ferreira@clubedebate.com' },
    club: { name: 'Leões do Norte', city: 'Recife', state: 'PE' },
  },
  {
    owner: { firstName: 'Marcos', lastName: 'Ribeiro', email: 'marcos.ribeiro@clubedebate.com' },
    club: { name: 'Conexão Amazônia', city: 'Manaus', state: 'AM' },
  },
  {
    owner: { firstName: 'Sandra', lastName: 'Gomes', email: 'sandra.gomes@clubedebate.com' },
    club: { name: 'Eloquentes da Costa', city: 'Salvador', state: 'BA' },
  },
  {
    owner: { firstName: 'Tiago', lastName: 'Martins', email: 'tiago.martins@clubedebate.com' },
    club: { name: 'Círculo de Ideias de Curitiba', city: 'Curitiba', state: 'PR' },
  },
  {
    owner: { firstName: 'Helena', lastName: 'Santana', email: 'helena.santana@clubedebate.com' },
    club: { name: 'Fortaleza Retórica', city: 'Fortaleza', state: 'CE' },
  },
];

/**
 * Popula o banco de dados com uma variedade de clubes e diretores para teste.
 * É idempotente: não criará dados duplicados se for executado várias vezes.
 */
export async function testDataSeed(app: NestExpressApplication) {
  console.log('Iniciando o seed de dados de teste...');

  // Obtenção dos serviços necessários do contêiner de injeção de dependência do NestJS
  const userRepository = app.get<UserRepository>(USER_REPOSITORY);
  const familyRepository = app.get<FamilyRepository>(FAMILY_REPOSITORY);
  const clubRepository = app.get<ClubRepository>(CLUB_REPOSITORY);
  const hashingService = app.get<HashingService>(HASHING_SERVICE);
  const idGenerator = app.get<IdGenerator>(ID_GENERATOR);
  const cpfGenerator = new CpfGenerator();

  for (const data of seedData) {
    // 1. VERIFICA SE O USUÁRIO JÁ EXISTE PARA GARANTIR IDEMPOTÊNCIA
    const existingUser = await userRepository.findByEmail(data.owner.email);
    if (existingUser) {
      console.log(`Usuário ${data.owner.email} já existe. Ignorando.`);
      continue;
    }

    // 2. CRIA O DIRETOR (USER) COM CPF ÚNICO
    const principal = User.create(
      {
        ...data.owner,
        password: 'Password@123', // Senha padrão para todos os usuários de teste
        roles: [UserRoles.DONO_DE_CLUBE],
        cpf: cpfGenerator.gerarCpf(), // <-- CORREÇÃO AQUI
      },
      idGenerator,
      hashingService,
    );
    await userRepository.save(principal);

    // 3. CRIA A FAMÍLIA E AFILIA
    // Um diretor precisa ter uma família e esta precisa estar afiliada para criar um clube.
    const family = new Family({
      id: idGenerator.generate(),
      holderId: principal.id,
    });
    family.activateAffiliation(); // Ativa a afiliação imediatamente
    await familyRepository.save(family);

    // 4. CRIA O CLUBE
    const club = Club.create(
      {
        ...data.club,
        principalId: principal.id,
      },
      idGenerator,
    );
    await clubRepository.save(club);

    console.log(`Clube '${club.name}' e diretor '${principal.email}' criados com sucesso.`);
  }

  console.log('Seed de dados de teste concluído.');
}
