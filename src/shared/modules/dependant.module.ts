import { Module } from '@nestjs/common';

import AddDependant from '@/application/use-cases/family/add-dependant/add-dependant';

import DependantController from '@/infraestructure/controllers/dependant/dependant.controller';

import SharedModule from '@/shared/modules/shared.module';
import UpdateDependant from '@/application/use-cases/family/update-dependant/update-dependant';
import DeleteDependant from '@/application/use-cases/family/delete-dependant/delete-dependant';
import ListUserDependants from '@/application/use-cases/family/list-user-dependants/list-user-dependants';
import ViewMyFamily from '@/application/use-cases/family/view-my-family/view-my-family';
import ViewDependant from '@/application/use-cases/family/view-dependant/view-dependant';

@Module({
  imports: [SharedModule],
  controllers: [DependantController],
  providers: [AddDependant, UpdateDependant, DeleteDependant, ListUserDependants, ViewMyFamily, ViewDependant],
  exports: [],
})
export default class DependantModule {}
