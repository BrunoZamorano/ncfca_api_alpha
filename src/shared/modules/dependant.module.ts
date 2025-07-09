import { Module } from '@nestjs/common';

import AddDependant from '@/application/use-cases/add-dependant/add-dependant';

import DependantController from '@/infraestructure/controllers/dependant/dependant.controller';

import SharedModule from '@/shared/modules/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [DependantController],
  providers: [AddDependant],
  exports: [],
})
export default class DependantModule {}
