import { Body, Controller, Post } from '@nestjs/common';

import RegisterUser from '@/application/use-cases/register-user/register-user';

import { RegisterUserInputDto, RegisterUserOutputDto } from '@/infraestructure/dtos/register-user.dto';

@Controller('/account')
export default class AccountController {
  constructor(private readonly _registerUser: RegisterUser) {}

  @Post('/user')
  async registerUser(@Body() input: RegisterUserInputDto): Promise<RegisterUserOutputDto> {
    return await this._registerUser.execute(input);
  }
}
