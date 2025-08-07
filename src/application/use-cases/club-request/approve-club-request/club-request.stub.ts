import { faker } from '@faker-js/faker';
import Address from '@/domain/value-objects/address/address';
import { ClubRequestStatus } from '@/domain/enums/club-request-status.enum';
import ClubRequest, { ClubRequestProps } from '@/domain/entities/club-request/club-request.entity';

/**
 * Cria um stub para a entidade ClubRequest com valores padrão.
 *
 * @param overrides Propriedades para sobrescrever os valores padrão.
 * @returns Um objeto ClubRequestProps.
 */
export function createClubRequestStub(overrides?: Partial<ClubRequestProps>): ClubRequest {
  const addressStub = new Address({
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    zipCode: faker.location.zipCode('#####-###'),
    country: 'Brazil',
  });

  return new ClubRequest({
    id: faker.string.uuid(),
    clubName: faker.company.name(),
    address: addressStub,
    requesterId: faker.string.uuid(),
    maxMembers: faker.number.int({ min: 5, max: 50 }),
    status: ClubRequestStatus.PENDING,
    requestedAt: new Date(),
    ...overrides, // Sobrescreve as propriedades padrão com os valores passados
  });
}
