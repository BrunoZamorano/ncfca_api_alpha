import { Module } from '@nestjs/common';

import AddDependant from '@/application/use-cases/add-dependant/add-dependant';

import DependantController from '@/infraestructure/controllers/dependant/dependant.controller';

import SharedModule from '@/shared/modules/shared.module';
import UpdateDependant from '@/application/use-cases/update-dependant/update-dependant';
import DeleteDependant from '@/application/use-cases/delete-dependant/delete-dependant';
import ListDependants from '@/application/use-cases/list-dependants/list-dependants';

@Module({
  imports: [SharedModule],
  controllers: [DependantController],
  providers: [AddDependant, UpdateDependant, DeleteDependant, ListDependants],
  exports: [],
})
export default class DependantModule {}
